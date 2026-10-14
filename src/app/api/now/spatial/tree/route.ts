import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region_id") || undefined;
    const campusId = searchParams.get("campus_id") || undefined;
    const buildingId = searchParams.get("building_id") || undefined;
    const includeAssets = searchParams.get("include_assets") !== "false";

    // Build the nested hierarchy tree
    const regions = await db.cmnRegion.findMany({
      where: {
        active: true,
        ...(regionId ? { id: regionId } : {}),
      },
      include: {
        states: {
          include: {
            campuses: {
              where: campusId ? { id: campusId } : undefined,
              include: {
                buildings: {
                  where: buildingId ? { id: buildingId } : undefined,
                  include: {
                    floors: {
                      orderBy: { floorNumber: "asc" },
                      include: {
                        spaces: {
                          orderBy: { spaceNumber: "asc" },
                          include: {
                            configurationItems: includeAssets
                              ? {
                                  select: {
                                    id: true,
                                    name: true,
                                    assetTag: true,
                                    ciClass: true,
                                    status: true,
                                    operationalStatus: true,
                                  },
                                }
                              : false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute aggregated rollups
    let totalRegions = regions.length;
    let totalStates = 0;
    let totalCampuses = 0;
    let totalBuildings = 0;
    let totalFloors = 0;
    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalVacant = 0;
    let totalCapacity = 0;
    let totalAreaSqFt = 0;
    let totalAssets = 0;

    for (const r of regions) {
      totalStates += r.states.length;
      for (const s of r.states) {
        totalCampuses += s.campuses.length;
        for (const c of s.campuses) {
          totalBuildings += c.buildings.length;
          for (const b of c.buildings) {
            totalFloors += b.floors.length;
            if (b.totalAreaSqFt) totalAreaSqFt += b.totalAreaSqFt;
            for (const fl of b.floors) {
              totalSpaces += fl.spaces.length;
              for (const sp of fl.spaces) {
                if (sp.status === "occupied") totalOccupied++;
                else if (sp.status === "vacant") totalVacant++;
                totalCapacity += sp.capacity || 0;
                if (sp.configurationItems) {
                  totalAssets += sp.configurationItems.length;
                }
              }
            }
          }
        }
      }
    }

    const occupancyRate = totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 100) : 0;

    return NextResponse.json({
      result: {
        tree: regions,
        stats: {
          totalRegions,
          totalStates,
          totalCampuses,
          totalBuildings,
          totalFloors,
          totalSpaces,
          totalOccupied,
          totalVacant,
          occupancyRate,
          totalCapacity,
          totalAreaSqFt,
          totalAssets,
        },
      },
    });
  } catch (error: any) {
    console.error("Spatial tree error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
