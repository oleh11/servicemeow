import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { resolveReference, getDynamicReferenceCandidates, resolveDotWalk } from "@/lib/reference-resolver";
import { getNextNumber } from "@/lib/numbering";

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
});
