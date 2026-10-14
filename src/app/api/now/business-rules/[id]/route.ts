import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await db.sysScript.findUnique({ where: { id } });
    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ result: rule });
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
    if (body.tableName !== undefined) data.tableName = body.tableName;
    if (body.when !== undefined) data.when = body.when;
    if (body.active !== undefined) data.active = body.active;
    if (body.order !== undefined) data.order = parseInt(body.order, 10);
    if (body.filterConditions !== undefined) {
      data.filterConditions =
        typeof body.filterConditions === "object"
          ? JSON.stringify(body.filterConditions)
          : body.filterConditions;
    }
    if (body.actionsJson !== undefined) {
      data.actionsJson =
        typeof body.actionsJson === "object"
          ? JSON.stringify(body.actionsJson)
          : body.actionsJson;
    }
    if (body.description !== undefined) data.description = body.description;
    if (body.script !== undefined) data.script = body.script;

    const updated = await db.sysScript.update({
      where: { id },
      data,
    });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script",
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
    const rule = await db.sysScript.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await db.sysScript.delete({ where: { id } });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script",
      action: "delete",
      recordId: id,
      name: rule.name,
      data: rule,
    });

    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
