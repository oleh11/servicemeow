import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const policy = await db.sysUiPolicy.findUnique({
      where: { id },
      include: { actions: true },
    });
    if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    return NextResponse.json({ result: policy });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.tableName !== undefined) data.tableName = body.tableName;
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription;
    if (body.active !== undefined) data.active = body.active;
    if (body.order !== undefined) data.order = parseInt(body.order, 10);
    if (body.conditionField !== undefined) data.conditionField = body.conditionField;
    if (body.conditionOperator !== undefined) data.conditionOperator = body.conditionOperator;
    if (body.conditionValue !== undefined) data.conditionValue = String(body.conditionValue);
    if (body.reverseIfFalse !== undefined) data.reverseIfFalse = body.reverseIfFalse;

    await db.sysUiPolicy.update({
      where: { id },
      data,
    });

    if (Array.isArray(body.actions)) {
      await db.sysUiPolicyAction.deleteMany({ where: { uiPolicyId: id } });
      if (body.actions.length > 0) {
        await db.sysUiPolicyAction.createMany({
          data: body.actions.map((act: any) => ({
            uiPolicyId: id,
            fieldName: act.fieldName,
            mandatory: act.mandatory || "ignore",
            readOnly: act.readOnly || "ignore",
            visible: act.visible || "ignore",
          })),
        });
      }
    }

    const updated = await db.sysUiPolicy.findUnique({
      where: { id },
      include: { actions: true },
    });

    if (updated) {
      await recordUpdateChange({
        type: "sys_ui_policy",
        action: "update",
        recordId: updated.id,
        name: updated.name,
        data: updated,
      });
    }

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const policy = await db.sysUiPolicy.findUnique({ where: { id } });
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    await db.sysUiPolicy.delete({ where: { id } });

    await recordUpdateChange({
      type: "sys_ui_policy",
      action: "delete",
      recordId: id,
      name: policy.name,
      data: policy,
    });

    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
