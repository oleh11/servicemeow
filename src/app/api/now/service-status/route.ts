import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/service-status -> returns services and active outages/incidents
export async function GET(request: NextRequest) {
  try {
    const services = await db.cmnService.findMany({
      orderBy: { name: "asc" },
    });

    // Check for any active P1/P2 incidents
    const activeIncidents = await db.task.findMany({
      where: {
        sysClassName: "incident",
        state: { in: [1, 2, 3] }, // New, In Progress, On Hold
        priority: { in: [1, 2] },
      },
      include: {
        incident: {
          include: { cmdbCi: true },
        },
      },
      orderBy: { priority: "asc" },
      take: 5,
    });

    // Compute overall system health
    const hasMajorOutage = services.some((s) => s.status === "major_outage");
    const hasDegraded = services.some((s) => s.status === "degraded" || s.status === "partial_outage");

    const overallStatus = hasMajorOutage
      ? "major_outage"
      : hasDegraded
      ? "degraded"
      : "operational";

    return NextResponse.json({
      result: {
        overallStatus,
        services,
        activeIncidents,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/now/service-status -> update a service's status or uptime
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, uptimePercent, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Service id is required" }, { status: 400 });
    }

    const updated = await db.cmnService.update({
      where: { id },
      data: {
        status: status || undefined,
        uptimePercent: uptimePercent !== undefined ? Number(uptimePercent) : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/service-status -> create new service offering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, status = "operational", description, uptimePercent = 100.0 } = body;

    if (!name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const created = await db.cmnService.create({
      data: {
        name,
        category: category || "Core Infrastructure",
        status,
        description: description || null,
        uptimePercent: Number(uptimePercent) || 100.0,
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
