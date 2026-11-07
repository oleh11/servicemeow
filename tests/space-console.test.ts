import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCategoriesHandler } from "../src/app/api/now/spatial/categories/route";
import { PATCH as batchAllocateHandler } from "../src/app/api/now/spatial/batch-allocate/route";
import { db } from "../src/lib/db";

// Mock getServerSession
let mockSession: any = null;
vi.mock("../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/auth")>();
  return {
    ...actual,
    getServerSession: vi.fn(async () => mockSession),
  };
});

describe("ServiceMeow Space Console & Category Allocation Engine", () => {
  let testFloor: any = null;
  let testRooms: any[] = [];

  beforeEach(async () => {
    // Locate seeded HQ18 or another floor and its spaces
    testFloor = await db.cmnFloor.findFirst({
      where: { code: "HQ18" },
      include: { spaces: true },
    });

    if (!testFloor) {
      testFloor = await db.cmnFloor.findFirst({
        include: { spaces: true },
      });
    }

    if (testFloor && testFloor.spaces.length > 0) {
      testRooms = testFloor.spaces;
    } else {
      testRooms = await db.cmnSpace.findMany({ take: 3 });
    }

    // Default mock session for authenticated calls
    mockSession = {
      session: { id: "sess-default" },
      user: { id: "user-default", role: "itil" },
      actualUser: { id: "user-default", role: "itil" },
      isImpersonating: false,
      primaryRole: "itil",
      roles: ["itil", "employee"],
      isAdmin: false,
    };
  });

  describe("GET /api/now/spatial/categories", () => {
    it("blocks unauthenticated requests with 401", async () => {
      mockSession = null;
      const req = new NextRequest("http://localhost:3000/api/now/spatial/categories");
      const res = await getCategoriesHandler(req);
      expect(res.status).toBe(401);
    });

    it("returns standard space categories with legend colors and aggregations", async () => {
      const req = new NextRequest("http://localhost:3000/api/now/spatial/categories");
      const res = await getCategoriesHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.result)).toBe(true);
      expect(body.result.length).toBeGreaterThanOrEqual(9);

      // Verify essential spatial categories exist with appropriate HEX colors
      const categoryCodes = body.result.map((c: any) => c.code);
      expect(categoryCodes).toContain("MEETING");
      expect(categoryCodes).toContain("OFFICE");
      expect(categoryCodes).toContain("OPENPLAN");
      expect(categoryCodes).toContain("PRIMCIRC");
      expect(categoryCodes).toContain("SERV");
      expect(categoryCodes).toContain("WKSTN");

      const meetingCat = body.result.find((c: any) => c.code === "MEETING");
      expect(meetingCat.legendColor).toBe("#f97316");
      expect(typeof meetingCat.totalAreaSqFt).toBe("number");
      expect(typeof meetingCat.roomCount).toBe("number");

      expect(body.stats).toBeDefined();
      expect(body.stats.totalRooms).toBeGreaterThanOrEqual(0);
      expect(body.stats.totalAreaSqFt).toBeGreaterThanOrEqual(0);
    });

    it("supports filtering category aggregates by floorId", async () => {
      if (!testFloor) return;

      const req = new NextRequest(`http://localhost:3000/api/now/spatial/categories?floorId=${testFloor.id}`);
      const res = await getCategoriesHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.stats).toBeDefined();
    });
  });

  describe("PATCH /api/now/spatial/batch-allocate", () => {
    it("blocks unauthenticated requests with 401", async () => {
      mockSession = null;
      const req = new NextRequest("http://localhost:3000/api/now/spatial/batch-allocate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: ["r1"], categoryCode: "OFFICE" }),
      });

      const res = await batchAllocateHandler(req);
      expect(res.status).toBe(401);
    });

    it("blocks standard employees without facility roles with 403", async () => {
      mockSession = {
        session: { id: "sess-emp" },
        user: { id: "user-emp", role: "employee" },
        actualUser: { id: "user-emp", role: "employee" },
        isImpersonating: false,
        primaryRole: "employee",
        roles: ["employee", "public"],
        isAdmin: false,
      };

      const req = new NextRequest("http://localhost:3000/api/now/spatial/batch-allocate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: ["r1"], categoryCode: "OFFICE" }),
      });

      const res = await batchAllocateHandler(req);
      expect(res.status).toBe(403);
    });

    it("returns 400 when roomIds array is empty or missing", async () => {
      mockSession = {
        session: { id: "sess-adm" },
        user: { id: "user-adm", role: "admin" },
        actualUser: { id: "user-adm", role: "admin" },
        isImpersonating: false,
        primaryRole: "admin",
        roles: ["admin"],
        isAdmin: true,
      };

      const req = new NextRequest("http://localhost:3000/api/now/spatial/batch-allocate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: [], categoryCode: "OFFICE" }),
      });

      const res = await batchAllocateHandler(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/required/i);
    });

    it("allows workplace_admin to batch-allocate category and department to rooms", async () => {
      if (testRooms.length === 0) return;

      mockSession = {
        session: { id: "sess-workplace" },
        user: { id: "user-workplace", role: "workplace_admin" },
        actualUser: { id: "user-workplace", role: "workplace_admin" },
        isImpersonating: false,
        primaryRole: "workplace_admin",
        roles: ["workplace_admin", "employee"],
        isAdmin: false,
      };

      const targetRoomIds = testRooms.slice(0, 2).map((r) => r.id);
      const req = new NextRequest("http://localhost:3000/api/now/spatial/batch-allocate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomIds: targetRoomIds,
          categoryCode: "OFFICE",
          department: "Executive Facility Management",
          status: "vacant",
        }),
      });

      const res = await batchAllocateHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.updatedCount).toBe(targetRoomIds.length);
      expect(body.categoryCode).toBe("OFFICE");
      expect(body.department).toBe("Executive Facility Management");

      // Verify database persistence
      const verifiedRooms = await db.cmnSpace.findMany({
        where: { id: { in: targetRoomIds } },
      });
      for (const room of verifiedRooms) {
        expect(room.department).toBe("Executive Facility Management");
        expect(room.status).toBe("vacant");
      }
    });
  });
});
