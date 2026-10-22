import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import { getNextNumber } from "@/lib/numbering";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.cmnMorningCheck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Morning check not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.status !== undefined) {
      updateData.status = String(body.status).toLowerCase();
      updateData.checkedAt = new Date();
      updateData.checkedById = body.inspectedById || session.user.id;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.incidentId !== undefined || body.incident_id !== undefined) {
      updateData.incidentId = body.incidentId || body.incident_id;
    }

    let escalatedIncident: any = null;

    // 1-Click Escalate to Incident
    if (body.escalateToIncident) {
      const incPayload = body.incidentPayload || {};
      const number = await getNextNumber("INC");
      const priority = incPayload.priority || 1;
      const impact = incPayload.impact || 1;
      const urgency = incPayload.urgency || 1;

      const task = await db.task.create({
        data: {
          number,
          sysClassName: "incident",
          shortDescription:
            incPayload.short_description ||
            incPayload.shortDescription ||
            `[Morning Check Failure]: ${existing.title}`,
          description:
            incPayload.description ||
            existing.notes ||
            "Escalated from shift operational round check.",
          priority,
          impact,
          urgency,
          state: 1, // New
          assignedToId: session.user.id,
        },
      });

      escalatedIncident = await db.incident.create({
        data: {
          taskId: task.id,
          category: incPayload.category || existing.category || "datacenter",
          severity: priority,
        },
        include: {
          task: true,
        },
      });

      updateData.incidentId = escalatedIncident.id;
    }

    const updated = await db.cmnMorningCheck.update({
      where: { id },
      data: updateData,
      include: {
        checkedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted = {
      ...updated,
      status: updated.status.toUpperCase(),
      category: updated.category.toUpperCase(),
      shift: updated.shift.toUpperCase(),
    };

    return NextResponse.json({
      result: formatted,
      check: formatted,
      incident: escalatedIncident,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update morning check" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.cmnMorningCheck.delete({ where: { id } });

    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete morning check" },
      { status: 500 }
    );
  }
}
