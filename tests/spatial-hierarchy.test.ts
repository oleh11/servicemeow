import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { resolveReference, getDynamicReferenceCandidates, resolveDotWalk } from "@/lib/reference-resolver";

describe("Workplace Hub - 6-Tier Spatial Hierarchy", () => {
  it("persists and traverses the full 6-tier hierarchy (Region -> State -> Campus -> Building -> Floor -> Space)", async () => {
    // 1. Region
    const region = await db.cmnRegion.findUnique({
      where: { code: "AMER" },
      include: {
        states: {
          where: { code: "US-CA" },
          include: {
            campuses: {
              where: { code: "SF-MED-CAMPUS" },
              include: {
                buildings: {
                  where: { code: "BLDG-A-SURG" },
                  include: {
                    floors: {
                      where: { code: "L3-OR" },
                      include: {
                        spaces: {
                          where: { spaceNumber: "OR-301" },
                          include: {
                            configurationItems: true,
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
    });

    expect(region).toBeDefined();
    expect(region?.name).toBe("Americas");

    // Tier 2: State
    const state = region?.states[0];
    expect(state).toBeDefined();
    expect(state?.name).toBe("California");
    expect(state?.country).toBe("United States");

    // Tier 3: Campus
    const campus = state?.campuses[0];
    expect(campus).toBeDefined();
    expect(campus?.name).toBe("San Francisco Mission Bay Medical Campus");
    expect(campus?.city).toBe("San Francisco");

    // Tier 4: Building
    const building = campus?.buildings[0];
    expect(building).toBeDefined();
    expect(building?.name).toBe("Pavilion A - Surgical & Critical Care");
    expect(building?.buildingType).toBe("Hospital / Clinical");
    expect(building?.floorsCount).toBe(5);

    // Tier 5: Floor
    const floor = building?.floors[0];
    expect(floor).toBeDefined();
    expect(floor?.floorNumber).toBe(3);
    expect(floor?.name).toBe("Level 3 - Operating Suites & Surgery");

    // Tier 6: Space / Room
    const space = floor?.spaces[0];
    expect(space).toBeDefined();
    expect(space?.spaceNumber).toBe("OR-301");
    expect(space?.name).toBe("Robotic Surgery Suite 1");
    expect(space?.spaceType).toBe("Operating Room");
    expect(space?.status).toBe("occupied");
    expect(space?.capacity).toBe(8);
    expect(space?.department).toBe("Surgical Services");

    // CMDB Asset Linkage inside Space
    expect(space?.configurationItems.length).toBeGreaterThan(0);
    const robot = space?.configurationItems.find((ci) => ci.assetTag === "MED-ROBOT-001");
    expect(robot).toBeDefined();
    expect(robot?.name).toContain("da Vinci Xi");
    expect(robot?.ciClass).toBe("biomedical_device");
  });

  it("resolves single references for all spatial hierarchy tables", async () => {
    const region = await db.cmnRegion.findFirst({ where: { code: "AMER" } });
    expect(region).toBeDefined();
    const refRegion = await resolveReference("cmn_region", region!.id);
    expect(refRegion?.display_value).toBe("Americas (AMER)");
    expect(refRegion?.link).toBe(`/api/now/table/cmn_region/${region!.id}`);

    const campus = await db.cmnCampus.findFirst({ where: { code: "SV-CAMPUS" } });
    expect(campus).toBeDefined();
    const refCampus = await resolveReference("cmn_campus", campus!.id);
    expect(refCampus?.display_value).toContain("Silicon Valley");

    const space = await db.cmnSpace.findFirst({ where: { spaceNumber: "OR-301" } });
    expect(space).toBeDefined();
    const refSpace = await resolveReference("cmn_space", space!.id);
    expect(refSpace?.display_value).toBe("Robotic Surgery Suite 1 [OR-301]");
    expect(refSpace?.link).toBe(`/api/now/table/cmn_space/${space!.id}`);
  });

  it("applies dependent filtering in getDynamicReferenceCandidates across tiers", async () => {
    const campusSF = await db.cmnCampus.findFirst({ where: { code: "SF-MED-CAMPUS" } });
    expect(campusSF).toBeDefined();

    // Query buildings dependent on campus
    const buildingsResp = await getDynamicReferenceCandidates("cmn_building", {
      dependentField: "campus",
      dependentValue: campusSF!.id,
    });
    expect(buildingsResp.dependentQualifierApplied).toBe(true);
    expect(buildingsResp.results.length).toBeGreaterThan(0);
    for (const b of buildingsResp.results) {
      expect(b.subtitle).toContain(campusSF!.name);
    }

    // Query floors dependent on building
    const bldg = await db.cmnBuilding.findFirst({ where: { code: "BLDG-A-SURG" } });
    expect(bldg).toBeDefined();
    const floorsResp = await getDynamicReferenceCandidates("cmn_floor", {
      dependentField: "building",
      dependentValue: bldg!.id,
    });
    expect(floorsResp.dependentQualifierApplied).toBe(true);
    expect(floorsResp.results.length).toBeGreaterThanOrEqual(3);

    // Query spaces dependent on floor
    const fl3 = await db.cmnFloor.findFirst({ where: { buildingId: bldg!.id, floorNumber: 3 } });
    expect(fl3).toBeDefined();
    const spacesResp = await getDynamicReferenceCandidates("cmn_space", {
      dependentField: "floor",
      dependentValue: fl3!.id,
    });
    expect(spacesResp.dependentQualifierApplied).toBe(true);
    const spaceNums = spacesResp.results.map((r) => r.display_value);
    expect(spaceNums.some((s) => s.includes("OR-301"))).toBe(true);
    expect(spaceNums.some((s) => s.includes("OR-302"))).toBe(true);
  });

  it("supports multi-hop dot walking from spaces and assets", async () => {
    const space = await db.cmnSpace.findFirst({
      where: { spaceNumber: "OR-301" },
      include: { floor: { include: { building: { include: { campus: true } } } } },
    });
    expect(space).toBeDefined();

    const dotWalkResult = await resolveDotWalk("cmn_space", space!.id, "floor.building.name");
    expect(dotWalkResult.displayValue).toBe("Pavilion A - Surgical & Critical Care");

    const dotWalkCampus = await resolveDotWalk("cmn_space", space!.id, "floor.building.campus.name");
    expect(dotWalkCampus.displayValue).toBe("San Francisco Mission Bay Medical Campus");
  });

  it("maintains Unified Location (cmn_location) parent-child relationships and breadcrumbs", async () => {
    // Verify root locations
    const americasRoot = await db.cmnLocation.findFirst({
      where: { name: "Americas", locationType: "region" },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });
    expect(americasRoot).toBeDefined();
    expect(americasRoot?.parentId).toBeNull();
    expect(americasRoot?.children.length).toBeGreaterThan(0);

    // Verify child state has americas as parent
    const california = americasRoot?.children.find((c) => c.name === "California");
    expect(california).toBeDefined();
    expect(california?.parentId).toBe(americasRoot!.id);
    expect(california?.fullPath).toBe("Americas / California");
  });

  it("supports dynamic location creation, parent-child linking, and re-parenting", async () => {
    // 1. Create a parent site
    const parentSite = await db.cmnLocation.create({
      data: {
        name: "Test Research District",
        locationType: "campus",
        city: "Austin",
        state: "TX",
        fullPath: "Test Research District",
      },
    });
    expect(parentSite.id).toBeDefined();

    // 2. Create child building under parent site
    const childBuilding = await db.cmnLocation.create({
      data: {
        name: "Bio-Nano Center",
        locationType: "building",
        parentId: parentSite.id,
        fullPath: `${parentSite.name} / Bio-Nano Center`,
      },
      include: { parent: true },
    });
    expect(childBuilding.parentId).toBe(parentSite.id);
    expect(childBuilding.parent?.name).toBe("Test Research District");

    // 3. Create sub-child room under child building
    const childRoom = await db.cmnLocation.create({
      data: {
        name: "Cleanroom Alpha",
        locationType: "space",
        parentId: childBuilding.id,
        fullPath: `${childBuilding.fullPath} / Cleanroom Alpha`,
      },
    });
    expect(childRoom.parentId).toBe(childBuilding.id);

    // 4. Verify 3-tier ancestor chain
    const loadedRoom = await db.cmnLocation.findUnique({
      where: { id: childRoom.id },
      include: {
        parent: {
          include: {
            parent: true,
          },
        },
      },
    });
    expect(loadedRoom?.parent?.name).toBe("Bio-Nano Center");
    expect(loadedRoom?.parent?.parent?.name).toBe("Test Research District");

    // 5. Clean up test records
    await db.cmnLocation.deleteMany({
      where: {
        id: { in: [childRoom.id, childBuilding.id, parentSite.id] },
      },
    });
  });
});
