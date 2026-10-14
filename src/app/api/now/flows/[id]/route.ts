import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flow = await db.sysHubFlow.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    return NextResponse.json({ result: flow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.triggerTable !== undefined) data.triggerTable = body.triggerTable;
    if (body.triggerCondition !== undefined) data.triggerCondition = body.triggerCondition;
    if (body.active !== undefined) data.active = body.active;
    if (body.description !== undefined) data.description = body.description;
    if (body.stepsJson !== undefined) {
      data.stepsJson = typeof body.stepsJson === "object" ? JSON.stringify(body.stepsJson) : body.stepsJson;
    }

    const updated = await db.sysHubFlow.update({
      where: { id },
      data,
      include: { executions: { take: 5 } },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "sys_hub_flow",
      action: "update",
      recordId: updated.id,
      name: updated.name,
      data: updated,
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.sysHubFlow.findUnique({ where: { id } });
    if (existing) {
      await db.sysHubFlow.delete({ where: { id } });
      const { recordUpdateChange } = await import("@/lib/update-set");
      await recordUpdateChange({
        type: "sys_hub_flow",
        action: "delete",
        recordId: id,
        name: existing.name,
        data: existing,
      });
    }
    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
