import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

interface SpaceCategoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  legendColor: string;
  isCirculation: boolean;
  totalAreaSqFt: number;
  roomCount: number;
}

const STANDARD_SPATIAL_CATEGORIES: Omit<SpaceCategoryItem, "totalAreaSqFt" | "roomCount">[] = [
  {
    id: "cat_meeting",
    code: "MEETING",
    name: "Meeting",
    description: "Conference rooms, video huddle suites, and collaborative presentation arenas",
    legendColor: "#f97316", // Orange
    isCirculation: false,
  },
  {
    id: "cat_office",
    code: "OFFICE",
    name: "Office",
    description: "Dedicated executive suites, private director offices, and departmental leadership rooms",
    legendColor: "#10b981", // Emerald Green
    isCirculation: false,
  },
  {
    id: "cat_openplan",
    code: "OPENPLAN",
    name: "OpenPlan",
    description: "Agile open team collaboration bays, flex desks, and cross-functional project zones",
    legendColor: "#eab308", // Yellow
    isCirculation: false,
  },
  {
    id: "cat_primcirc",
    code: "PRIMCIRC",
    name: "Primary Circulation",
    description: "Primary egress corridors, main atrium ring, elevator lobbies, and building thoroughfares",
    legendColor: "#84cc16", // Lime Green
    isCirculation: true,
  },
  {
    id: "cat_secondcirc",
    code: "SECONDCIRC",
    name: "Secondary Circulation",
    description: "Internal room aisles, workstation access pathways, and secondary egress ways",
    legendColor: "#94a3b8", // Slate Grey
    isCirculation: true,
  },
  {
    id: "cat_serv",
    code: "SERV",
    name: "Service Area",
    description: "Restrooms, janitorial, electrical closets, IDF/MDF data rooms, and mechanical equipment",
    legendColor: "#047857", // Dark Green
    isCirculation: false,
  },
  {
    id: "cat_support",
    code: "SUPPORT",
    name: "Support Area",
    description: "Copy/print hubs, mail distribution centers, supply closets, and storage vaults",
    legendColor: "#78350f", // Brown
    isCirculation: false,
  },
  {
    id: "cat_vert",
    code: "VERT",
    name: "Vertical Penetrations",
    description: "Elevator hoistways, stairwells, HVAC shafts, plumbing risers, and utility chases",
    legendColor: "#dc2626", // Red
    isCirculation: true,
  },
  {
    id: "cat_wkstn",
    code: "WKSTN",
    name: "Workstation",
    description: "Assigned individual desks, electronic systems benching clusters, and focus pods",
    legendColor: "#2563eb", // Royal Blue
    isCirculation: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get("floorId") || searchParams.get("floor_id") || undefined;

    // Fetch spaces to aggregate
    const spaces = await db.cmnSpace.findMany({
      where: floorId ? { floorId } : undefined,
      select: {
        id: true,
        spaceType: true,
        squareFeet: true,
        capacity: true,
      },
    });

    // Helper to map spaceType to standard category code
    const mapTypeToCategory = (type: string): string => {
      const t = (type || "").toLowerCase().trim();
      if (t.includes("meet") || t.includes("conf") || t.includes("collab") || t.includes("arena")) return "MEETING";
      if (t.includes("exec") || t.includes("office") || t.includes("suite")) return "OFFICE";
      if (t.includes("open") || t.includes("pod") || t.includes("team")) return "OPENPLAN";
      if (t.includes("desk") || t.includes("wkstn") || t.includes("workstation")) return "WKSTN";
      if (t.includes("restroom") || t.includes("serv") || t.includes("mdf") || t.includes("server")) return "SERV";
      if (t.includes("stair") || t.includes("elevator") || t.includes("vert")) return "VERT";
      if (t.includes("circ") || t.includes("atrium") || t.includes("corridor") || t.includes("hall")) return "PRIMCIRC";
      if (t.includes("support") || t.includes("storage")) return "SUPPORT";
      return "OFFICE";
    };

    // Aggregate counts and area
    const aggregated = STANDARD_SPATIAL_CATEGORIES.map((cat) => {
      let roomCount = 0;
      let totalArea = 0;

      for (const sp of spaces) {
        if (mapTypeToCategory(sp.spaceType) === cat.code) {
          roomCount++;
          totalArea += sp.squareFeet || 350;
        }
      }

      return {
        ...cat,
        roomCount,
        totalAreaSqFt: Math.round(totalArea * 100) / 100,
      };
    });

    const totalRooms = spaces.length;
    const totalGrossArea = aggregated.reduce((acc, c) => acc + c.totalAreaSqFt, 0);

    return NextResponse.json({
      success: true,
      result: aggregated,
      categories: aggregated,
      stats: {
        totalRooms,
        totalAreaSqFt: Math.round(totalGrossArea * 100) / 100,
        totalGrossAreaSqFt: Math.round(totalGrossArea * 100) / 100,
      },
      summary: {
        totalRooms,
        totalGrossAreaSqFt: Math.round(totalGrossArea * 100) / 100,
      },
    });
  } catch (err: any) {
    console.error("Error fetching space categories:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch space categories" }, { status: 500 });
  }
}
