import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 1. Regions
    const regions = await db.cmnRegion.findMany({ where: { active: true } });
    const regionLocMap = new Map<string, string>(); // regionId -> locationId

    for (const r of regions) {
      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "region", OR: [{ regionId: r.id }, { name: r.name }] },
      });
      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: r.name,
            locationType: "region",
            regionId: r.id,
            parentId: null,
            fullPath: r.name,
          },
        });
        regionLocMap.set(r.id, existing.id);
        updatedCount++;
      } else {
        const created = await db.cmnLocation.create({
          data: {
            name: r.name,
            locationType: "region",
            regionId: r.id,
            parentId: null,
            fullPath: r.name,
          },
        });
        regionLocMap.set(r.id, created.id);
        createdCount++;
      }
    }

    // 2. States / Provinces
    const states = await db.cmnState.findMany();
    const stateLocMap = new Map<string, string>(); // stateId -> locationId

    for (const s of states) {
      const parentLocId = s.regionId ? regionLocMap.get(s.regionId) || null : null;
      let parentPath = "";
      if (parentLocId) {
        const p = await db.cmnLocation.findUnique({ where: { id: parentLocId } });
        parentPath = p?.fullPath || p?.name || "";
      }
      const fullPath = parentPath ? `${parentPath} / ${s.name}` : s.name;

      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "state", OR: [{ stateRefId: s.id }, { name: s.name }] },
      });

      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: s.name,
            locationType: "state",
            state: s.code,
            country: s.country || "US",
            regionId: s.regionId,
            stateRefId: s.id,
            parentId: parentLocId,
            fullPath,
          },
        });
        stateLocMap.set(s.id, existing.id);
        updatedCount++;
      } else {
        const created = await db.cmnLocation.create({
          data: {
            name: s.name,
            locationType: "state",
            state: s.code,
            country: s.country || "US",
            regionId: s.regionId,
            stateRefId: s.id,
            parentId: parentLocId,
            fullPath,
          },
        });
        stateLocMap.set(s.id, created.id);
        createdCount++;
      }
    }

    // 3. Campuses
    const campuses = await db.cmnCampus.findMany();
    const campusLocMap = new Map<string, string>(); // campusId -> locationId

    for (const c of campuses) {
      const parentLocId = c.stateId ? stateLocMap.get(c.stateId) || null : null;
      let parentPath = "";
      if (parentLocId) {
        const p = await db.cmnLocation.findUnique({ where: { id: parentLocId } });
        parentPath = p?.fullPath || p?.name || "";
      }
      const fullPath = parentPath ? `${parentPath} / ${c.name}` : c.name;

      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "campus", OR: [{ campusId: c.id }, { name: c.name }] },
      });

      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: c.name,
            locationType: "campus",
            campusId: c.id,
            stateRefId: c.stateId,
            parentId: parentLocId,
            street: c.address || null,
            city: c.city || null,
            fullPath,
          },
        });
        campusLocMap.set(c.id, existing.id);
        updatedCount++;
      } else {
        const created = await db.cmnLocation.create({
          data: {
            name: c.name,
            locationType: "campus",
            campusId: c.id,
            stateRefId: c.stateId,
            parentId: parentLocId,
            street: c.address || null,
            city: c.city || null,
            fullPath,
          },
        });
        campusLocMap.set(c.id, created.id);
        createdCount++;
      }
    }

    // 4. Buildings
    const buildings = await db.cmnBuilding.findMany();
    const bldgLocMap = new Map<string, string>(); // buildingId -> locationId

    for (const b of buildings) {
      const parentLocId = b.campusId ? campusLocMap.get(b.campusId) || null : null;
      let parentPath = "";
      if (parentLocId) {
        const p = await db.cmnLocation.findUnique({ where: { id: parentLocId } });
        parentPath = p?.fullPath || p?.name || "";
      }
      const fullPath = parentPath ? `${parentPath} / ${b.name}` : b.name;

      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "building", OR: [{ buildingId: b.id }, { name: b.name }] },
      });

      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: b.name,
            locationType: "building",
            buildingId: b.id,
            campusId: b.campusId,
            parentId: parentLocId,
            fullPath,
          },
        });
        bldgLocMap.set(b.id, existing.id);
        updatedCount++;
      } else {
        const created = await db.cmnLocation.create({
          data: {
            name: b.name,
            locationType: "building",
            buildingId: b.id,
            campusId: b.campusId,
            parentId: parentLocId,
            fullPath,
          },
        });
        bldgLocMap.set(b.id, created.id);
        createdCount++;
      }
    }

    // 5. Floors
    const floors = await db.cmnFloor.findMany();
    const floorLocMap = new Map<string, string>(); // floorId -> locationId

    for (const fl of floors) {
      const parentLocId = fl.buildingId ? bldgLocMap.get(fl.buildingId) || null : null;
      let parentPath = "";
      if (parentLocId) {
        const p = await db.cmnLocation.findUnique({ where: { id: parentLocId } });
        parentPath = p?.fullPath || p?.name || "";
      }
      const fullPath = parentPath ? `${parentPath} / ${fl.name}` : fl.name;

      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "floor", OR: [{ floorId: fl.id }, { name: fl.name }] },
      });

      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: fl.name,
            locationType: "floor",
            floorId: fl.id,
            buildingId: fl.buildingId,
            parentId: parentLocId,
            fullPath,
          },
        });
        floorLocMap.set(fl.id, existing.id);
        updatedCount++;
      } else {
        const created = await db.cmnLocation.create({
          data: {
            name: fl.name,
            locationType: "floor",
            floorId: fl.id,
            buildingId: fl.buildingId,
            parentId: parentLocId,
            fullPath,
          },
        });
        floorLocMap.set(fl.id, created.id);
        createdCount++;
      }
    }

    // 6. Spaces / Rooms
    const spaces = await db.cmnSpace.findMany();
    for (const sp of spaces) {
      const parentLocId = sp.floorId ? floorLocMap.get(sp.floorId) || null : null;
      let parentPath = "";
      if (parentLocId) {
        const p = await db.cmnLocation.findUnique({ where: { id: parentLocId } });
        parentPath = p?.fullPath || p?.name || "";
      }
      const fullPath = parentPath ? `${parentPath} / ${sp.name}` : sp.name;

      const existing = await db.cmnLocation.findFirst({
        where: { locationType: "space", OR: [{ spaceId: sp.id }, { name: sp.name }] },
      });

      if (existing) {
        await db.cmnLocation.update({
          where: { id: existing.id },
          data: {
            name: sp.name,
            locationType: "space",
            spaceId: sp.id,
            floorId: sp.floorId,
            parentId: parentLocId,
            fullPath,
          },
        });
        updatedCount++;
      } else {
        await db.cmnLocation.create({
          data: {
            name: sp.name,
            locationType: "space",
            spaceId: sp.id,
            floorId: sp.floorId,
            parentId: parentLocId,
            fullPath,
          },
        });
        createdCount++;
      }
    }

    const totalLocations = await db.cmnLocation.count();

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalLocations,
      message: `Synchronized ${createdCount + updatedCount} location hierarchy nodes (${createdCount} created, ${updatedCount} updated). Total locations: ${totalLocations}.`,
    });
  } catch (error: any) {
    console.error("Error syncing locations from spatial hierarchy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
