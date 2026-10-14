import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/cmdb/racks -> returns all racks with mounted CIs
export async function GET(request: NextRequest) {
  try {
    const racks = await db.cmdbRack.findMany({
      include: {
        mountedCis: {
          orderBy: { rackUnitStart: "desc" },
          include: { location: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Also fetch unmounted hardware/server/network CIs so admins can mount them
    const unmountedCis = await db.configurationItem.findMany({
      where: { rackId: null },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ result: { racks, unmountedCis } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/cmdb/racks -> create rack or mount CI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "mount_ci") {
      const { ciId, rackId, rackUnitStart, rackUnitHeight = 1 } = body;
      if (!ciId || !rackId || !rackUnitStart) {
        return NextResponse.json(
          { error: "ciId, rackId, and rackUnitStart are required to mount CI" },
          { status: 400 }
        );
      }

      const updatedCi = await db.configurationItem.update({
        where: { id: ciId },
        data: {
          rackId,
          rackUnitStart: Number(rackUnitStart),
          rackUnitHeight: Number(rackUnitHeight) || 1,
        },
      });

      return NextResponse.json({ result: updatedCi });
    }

    if (action === "unmount_ci") {
      const { ciId } = body;
      const updatedCi = await db.configurationItem.update({
        where: { id: ciId },
        data: {
          rackId: null,
          rackUnitStart: null,
          rackUnitHeight: null,
        },
      });
      return NextResponse.json({ result: updatedCi });
    }

    // Create new Rack
    const { name, site, uHeight = 42, maxPowerWatts = 5000, notes } = body;
    if (!name) {
      return NextResponse.json({ error: "Rack name is required" }, { status: 400 });
    }

    const newRack = await db.cmdbRack.create({
      data: {
        name,
        site: site || "Primary Datacenter",
        uHeight: Number(uHeight) || 42,
        maxPowerWatts: Number(maxPowerWatts) || 5000,
        notes: notes || null,
      },
    });

    return NextResponse.json({ result: newRack }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
