import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");

    const where: any = {};
    if (table) where.tableName = table;

    const policies = await db.sysUiPolicy.findMany({
      where,
      orderBy: [{ tableName: "asc" }, { order: "asc" }],
      include: {
        actions: true,
      },
    });

    return NextResponse.json({ result: policies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.tableName || !body.conditionField || body.conditionValue === undefined) {
      return NextResponse.json(
        { error: "Name, Table Name, Condition Field, and Condition Value are required" },
        { status: 400 }
      );
    }

    const policy = await db.sysUiPolicy.create({
      data: {
        name: body.name,
        tableName: body.tableName,
        shortDescription: body.shortDescription || "",
        active: body.active !== false,
        order: parseInt(body.order || "100", 10),
        conditionField: body.conditionField,
        conditionOperator: body.conditionOperator || "=",
        conditionValue: String(body.conditionValue),
        reverseIfFalse: body.reverseIfFalse !== false,
      },
    });

    // Create policy actions if provided
    if (Array.isArray(body.actions) && body.actions.length > 0) {
      await db.sysUiPolicyAction.createMany({
        data: body.actions.map((act: any) => ({
          uiPolicyId: policy.id,
          fieldName: act.fieldName,
          mandatory: act.mandatory || "ignore",
          readOnly: act.readOnly || "ignore",
          visible: act.visible || "ignore",
        })),
      });
    }

    const fullPolicy = await db.sysUiPolicy.findUnique({
      where: { id: policy.id },
      include: { actions: true },
    });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_ui_policy",
      action: "insert",
      recordId: policy.id,
      name: policy.name,
      data: fullPolicy,
    });

    return NextResponse.json({ result: fullPolicy }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/now/ui-policies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
