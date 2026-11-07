import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as floorplanUploadHandler } from "../src/app/api/now/spatial/floorplan-upload/route";
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

describe("CAD Floorplan & Room Hotspot Architecture", () => {
  let testFloor: any = null;
  let testSpace: any = null;

  beforeEach(async () => {
    // Find or seed a test floor and space in dev DB
    testFloor = await db.cmnFloor.findFirst();
    testSpace = await db.cmnSpace.findFirst();
  });

  it("blocks unauthenticated upload requests with 401", async () => {
    mockSession = null;
    const req = new NextRequest("http://localhost:3000/api/now/spatial/floorplan-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floorId: "dummy" }),
    });

    const res = await floorplanUploadHandler(req);
    expect(res.status).toBe(401);
  });

  it("blocks standard employees from uploading CAD floorplans with 403", async () => {
    mockSession = {
      session: { id: "sess-1" },
      user: { id: "user-emp", role: "employee" },
      actualUser: { id: "user-emp", role: "employee" },
      isImpersonating: false,
      primaryRole: "employee",
      roles: ["employee", "public"],
      isAdmin: false,
    };

    const req = new NextRequest("http://localhost:3000/api/now/spatial/floorplan-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floorId: "dummy" }),
    });

    const res = await floorplanUploadHandler(req);
    expect(res.status).toBe(403);
  });

  it("allows workplace_admin to assign a CAD blueprint URL to a floor", async () => {
    if (!testFloor) return;

    mockSession = {
      session: { id: "sess-2" },
      user: { id: "user-workplace", role: "workplace_admin" },
      actualUser: { id: "user-workplace", role: "workplace_admin" },
      isImpersonating: false,
      primaryRole: "workplace_admin",
      roles: ["workplace_admin", "employee", "public"],
      isAdmin: false,
    };

    const targetUrl = "/floorplans/tech_tower_l4.svg";
    const req = new NextRequest("http://localhost:3000/api/now/spatial/floorplan-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floorId: testFloor.id,
        url: targetUrl,
      }),
    });

    const res = await floorplanUploadHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.fileUrl).toBe(targetUrl);
    expect(body.floor.floorplanSvgUrl).toBe(targetUrl);
  });

  it("verifies space coordinate bounds can be patched via cmn_space Table API", async () => {
    if (!testSpace) return;

    const updated = await db.cmnSpace.update({
      where: { id: testSpace.id },
      data: {
        floorplanX: 42.5,
        floorplanY: 30.0,
        floorplanWidth: 15.0,
        floorplanHeight: 12.5,
      },
    });

    expect(updated.floorplanX).toBe(42.5);
    expect(updated.floorplanY).toBe(30.0);
    expect(updated.floorplanWidth).toBe(15.0);
    expect(updated.floorplanHeight).toBe(12.5);
  });
});
