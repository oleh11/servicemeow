import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { resolveReference, getDynamicReferenceCandidates, resolveDotWalk } from "@/lib/reference-resolver";
import { getNextNumber } from "@/lib/numbering";
import {
  formatTimeSlot,
  formatTimeOption,
  formatInterval,
  toMilitaryCallout,
  STANDARD_TIME_OPTIONS,
  CALENDAR_HOURLY_SLOTS,
} from "@/lib/time-format";

describe("Workplace Hub - Room & Desk Reservation System", () => {
  let testSpace: any;
  let testDesk: any;
  let testUser: any;
  const createdReservationIds: string[] = [];

  beforeAll(async () => {
    // Find or create test spaces and user
    testSpace = await db.cmnSpace.findFirst({
      where: { spaceNumber: "CONF-410" },
      include: { floor: { include: { building: true } } },
    });

    testDesk = await db.cmnSpace.findFirst({
      where: { spaceNumber: "DESK-401" },
      include: { floor: { include: { building: true } } },
    });

    testUser = await db.user.findFirst({
      where: { userName: "admin" },
    });

    expect(testSpace).toBeDefined();
    expect(testDesk).toBeDefined();
    expect(testUser).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup any created reservations
    if (createdReservationIds.length > 0) {
      await db.cmnReservation.deleteMany({
        where: { id: { in: createdReservationIds } },
      });
    }
  });

  it("persists room and desk capabilities, photos, and floorplan schematic coordinates", async () => {
    // Check Conference Room
    expect(testSpace.capabilities).toBeDefined();
    const confCaps: string[] = JSON.parse(testSpace.capabilities);
    expect(confCaps).toContain("teams");
    expect(confCaps).toContain("zoom");
    expect(confCaps).toContain("whiteboard");
    expect(testSpace.imageUrl).toBeTruthy();
    expect(testSpace.floorplanX).toBeGreaterThanOrEqual(0);
    expect(testSpace.floorplanY).toBeGreaterThanOrEqual(0);
    expect(testSpace.floorplanWidth).toBeGreaterThan(0);
    expect(testSpace.floorplanHeight).toBeGreaterThan(0);

    // Check Standing Desk
    expect(testDesk.capabilities).toBeDefined();
    const deskCaps: string[] = JSON.parse(testDesk.capabilities);
    expect(deskCaps).toContain("standing_desk");
    expect(deskCaps).toContain("teams");
    expect(testDesk.imageUrl).toBeTruthy();
    expect(testDesk.floorplanX).toBeGreaterThanOrEqual(0);
    expect(testDesk.floorplanY).toBeGreaterThanOrEqual(0);

    // Check floorplan on Floor
    expect(testSpace.floor.floorplanSvgUrl).toContain(".svg");
  });

  it("creates a confirmed reservation with atomic RES number and capability requirements", async () => {
    const resNumber = await getNextNumber("cmn_reservation", "RES");
    expect(resNumber).toMatch(/^RES\d{7}$/);

    const startTime = new Date("2026-11-20T14:00:00Z");
    const endTime = new Date("2026-11-20T15:30:00Z");

    const reservation = await db.cmnReservation.create({
      data: {
        number: resNumber,
        spaceId: testSpace.id,
        reservedById: testUser.id,
        subject: "Automated Strategy Session",
        startTime,
        endTime,
        status: "confirmed",
        attendeesCount: 8,
        capabilitiesNeeded: JSON.stringify(["teams", "zoom", "whiteboard"]),
        notes: "Automated test reservation",
      },
      include: {
        space: true,
        reservedBy: true,
      },
    });

    createdReservationIds.push(reservation.id);

    expect(reservation.id).toBeDefined();
    expect(reservation.number).toBe(resNumber);
    expect(reservation.spaceId).toBe(testSpace.id);
    expect(reservation.status).toBe("confirmed");
    expect(reservation.attendeesCount).toBe(8);
    expect(reservation.reservedBy?.id).toBe(testUser.id);
  });

  it("detects and rejects overlapping double-booking conflict for the same space", async () => {
    const baseStart = new Date("2026-11-21T10:00:00Z");
    const baseEnd = new Date("2026-11-21T12:00:00Z");

    // 1. Initial confirmed reservation
    const res1Number = await getNextNumber("cmn_reservation", "RES");
    const res1 = await db.cmnReservation.create({
      data: {
        number: res1Number,
        spaceId: testSpace.id,
        reservedById: testUser.id,
        subject: "Primary Booking",
        startTime: baseStart,
        endTime: baseEnd,
        status: "confirmed",
      },
    });
    createdReservationIds.push(res1.id);

    // 2. Overlapping conflict query: startTime < existing.endTime && endTime > existing.startTime
    const overlappingStart = new Date("2026-11-21T11:00:00Z");
    const overlappingEnd = new Date("2026-11-21T13:00:00Z");

    const conflict = await db.cmnReservation.findFirst({
      where: {
        spaceId: testSpace.id,
        status: { not: "cancelled" },
        startTime: { lt: overlappingEnd },
        endTime: { gt: overlappingStart },
      },
    });

    expect(conflict).toBeDefined();
    expect(conflict?.id).toBe(res1.id);
    expect(conflict?.number).toBe(res1Number);

    // 3. Non-overlapping time slot should NOT conflict
    const safeStart = new Date("2026-11-21T12:30:00Z");
    const safeEnd = new Date("2026-11-21T14:00:00Z");

    const noConflict = await db.cmnReservation.findFirst({
      where: {
        spaceId: testSpace.id,
        status: { not: "cancelled" },
        startTime: { lt: safeEnd },
        endTime: { gt: safeStart },
      },
    });

    expect(noConflict).toBeNull();
  });

  it("supports reference resolution and multi-tier dot-walking from cmn_reservation", async () => {
    const resNumber = await getNextNumber("cmn_reservation", "RES");
    const reservation = await db.cmnReservation.create({
      data: {
        number: resNumber,
        spaceId: testSpace.id,
        reservedById: testUser.id,
        subject: "Dot-Walk Integration Test",
        startTime: new Date("2026-11-22T09:00:00Z"),
        endTime: new Date("2026-11-22T10:00:00Z"),
        status: "confirmed",
      },
    });
    createdReservationIds.push(reservation.id);

    // 1. Direct Reference Resolution
    const resolvedRef = await resolveReference("cmn_reservation", reservation.id);
    expect(resolvedRef).toBeDefined();
    expect(resolvedRef?.value).toBe(reservation.id);
    expect(resolvedRef?.display_value).toContain(resNumber);
    expect(resolvedRef?.display_value).toContain(reservation.subject);

    // 2. Dot-walk to Space name
    const spaceWalk = await resolveDotWalk("cmn_reservation", reservation.id, "space.name");
    expect(spaceWalk.terminalValue).toBe(testSpace.name);

    // 3. Deep 4-tier dot-walk: reservation -> space -> floor -> building -> name
    const bldgWalk = await resolveDotWalk("cmn_reservation", reservation.id, "space.floor.building.name");
    expect(bldgWalk.terminalValue).toBe(testSpace.floor.building.name);

    // 4. Dot-walk to Reserved By email
    const userWalk = await resolveDotWalk("cmn_reservation", reservation.id, "reserved_by.email");
    expect(userWalk.terminalValue).toBe(testUser.email);
  });

  it("provides dynamic reference candidates for cmn_reservation with space filtering", async () => {
    const candidates = await getDynamicReferenceCandidates("cmn_reservation", {
      dependentField: "spaceId",
      dependentValue: testSpace.id,
      limit: 10,
    });

    expect(candidates).toBeDefined();
    expect(candidates.results.length).toBeGreaterThan(0);
    expect(candidates.dependentQualifierApplied).toBe(true);

    const firstResult = candidates.results[0];
    expect(firstResult.value).toBeDefined();
    expect(firstResult.display_value).toMatch(/^RES\d{7}/);
  });

  describe("Time Formatting & Military Time Booking", () => {
    it("formats 24-hour military time accurately", () => {
      expect(formatTimeSlot("08:00", "24h")).toBe("08:00");
      expect(formatTimeSlot("09:30", "24h")).toBe("09:30");
      expect(formatTimeSlot("12:00", "24h")).toBe("12:00");
      expect(formatTimeSlot("14:30", "24h")).toBe("14:30");
      expect(formatTimeSlot("17:00", "24h")).toBe("17:00");
      expect(formatTimeSlot("21:30", "24h")).toBe("21:30");
      expect(formatTimeSlot("00:15", "24h")).toBe("00:15");
    });

    it("formats 12-hour AM/PM time accurately", () => {
      expect(formatTimeSlot("08:00", "12h")).toBe("8:00 AM");
      expect(formatTimeSlot("09:30", "12h")).toBe("9:30 AM");
      expect(formatTimeSlot("12:00", "12h")).toBe("12:00 PM");
      expect(formatTimeSlot("13:00", "12h")).toBe("1:00 PM");
      expect(formatTimeSlot("14:30", "12h")).toBe("2:30 PM");
      expect(formatTimeSlot("17:00", "12h")).toBe("5:00 PM");
      expect(formatTimeSlot("21:30", "12h")).toBe("9:30 PM");
      expect(formatTimeSlot("00:15", "12h")).toBe("12:15 AM");
    });

    it("generates unambiguous military callout notations", () => {
      expect(toMilitaryCallout("08:00")).toBe("0800 hrs");
      expect(toMilitaryCallout("09:30")).toBe("0930 hrs");
      expect(toMilitaryCallout("14:00")).toBe("1400 hrs");
      expect(toMilitaryCallout("17:45")).toBe("1745 hrs");
    });

    it("formats dropdown options with military annotations", () => {
      expect(formatTimeOption("14:30", "12h")).toBe("2:30 PM");
      expect(formatTimeOption("14:30", "24h")).toBe("14:30 (1430 hrs)");
      expect(formatTimeOption("09:00", "24h")).toBe("09:00 (0900 hrs)");
    });

    it("formats booking intervals with callouts in military mode", () => {
      const standardInterval = formatInterval("09:00", "10:30", "12h");
      expect(standardInterval).toBe("9:00 AM – 10:30 AM");

      const militaryInterval = formatInterval("09:00", "10:30", "24h");
      expect(militaryInterval).toBe("09:00 – 10:30 (0900 – 1030 hrs)");
    });

    it("provides standard 30-minute intervals and calendar hourly slots", () => {
      expect(STANDARD_TIME_OPTIONS.length).toBeGreaterThan(20);
      expect(STANDARD_TIME_OPTIONS).toContain("08:00");
      expect(STANDARD_TIME_OPTIONS).toContain("09:30");
      expect(STANDARD_TIME_OPTIONS).toContain("10:30");
      expect(STANDARD_TIME_OPTIONS).toContain("14:00");
      expect(STANDARD_TIME_OPTIONS).toContain("17:30");

      expect(CALENDAR_HOURLY_SLOTS).toContain("08:00");
      expect(CALENDAR_HOURLY_SLOTS).toContain("12:00");
      expect(CALENDAR_HOURLY_SLOTS).toContain("17:00");
    });
  });

  describe("ITIL Numbering & Prefix Segregation", () => {
    it("generates TASK prefix for sc_task and never leaks cmn_reservation prefix", async () => {
      const taskNum = await getNextNumber("TASK");
      expect(taskNum).toMatch(/^TASK\d{7}$/);
      expect(taskNum).not.toContain("cmn_reservation");
      expect(taskNum).not.toContain("RES");

      const scTaskNum = await getNextNumber("sc_task");
      expect(scTaskNum).toMatch(/^TASK\d{7}$/);
      expect(scTaskNum).not.toContain("cmn_reservation");
    });

    it("generates RES prefix for cmn_reservation and isolates from task sequences", async () => {
      const resNum = await getNextNumber("cmn_reservation");
      expect(resNum).toMatch(/^RES\d{7}$/);
      expect(resNum).not.toContain("cmn_reservation");
      expect(resNum).not.toContain("TASK");

      const resNumExplicit = await getNextNumber("RES");
      expect(resNumExplicit).toMatch(/^RES\d{7}$/);
    });

    it("generates distinct prefixes for REQ, RITM, and CTASK", async () => {
      const reqNum = await getNextNumber("REQ");
      expect(reqNum).toMatch(/^REQ\d{7}$/);

      const ritmNum = await getNextNumber("RITM");
      expect(ritmNum).toMatch(/^RITM\d{7}$/);

      const ctaskNum = await getNextNumber("CTASK");
      expect(ctaskNum).toMatch(/^CTASK\d{7}$/);
    });
  });
});
