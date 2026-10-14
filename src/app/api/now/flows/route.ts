import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");

    const where: any = {};
    if (table) where.triggerTable = table;

    const flows = await db.sysHubFlow.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ result: flows });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    if (!body.name || !body.triggerTable) {
      return NextResponse.json(
        { error: "Flow Name and Trigger Table are required" },
        { status: 400 }
      );
    }

    const flow = await db.sysHubFlow.create({
      data: {
        name: body.name,
        triggerTable: body.triggerTable,
        triggerCondition: body.triggerCondition || "",
        active: body.active !== false,
        description: body.description || "",
        stepsJson: typeof body.stepsJson === "object" ? JSON.stringify(body.stepsJson) : body.stepsJson || "[]",
      },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "sys_hub_flow",
      action: "insert",
      recordId: flow.id,
      name: flow.name,
      data: flow,
    });

    return NextResponse.json({ result: flow }, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
