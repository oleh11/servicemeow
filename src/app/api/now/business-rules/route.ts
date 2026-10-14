import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");
    const when = searchParams.get("when");

    const where: any = {};
    if (table) where.tableName = table;
    if (when) where.when = when;

    const rules = await db.sysScript.findMany({
      where,
      orderBy: [{ tableName: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ result: rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.tableName || !body.when) {
      return NextResponse.json(
        { error: "Name, Table Name, and When (execution event) are required" },
        { status: 400 }
      );
    }

    const rule = await db.sysScript.create({
      data: {
        name: body.name,
        tableName: body.tableName,
        when: body.when,
        active: body.active !== false,
        order: parseInt(body.order || "100", 10),
        filterConditions: typeof body.filterConditions === "object" ? JSON.stringify(body.filterConditions) : body.filterConditions || "[]",
        actionsJson: typeof body.actionsJson === "object" ? JSON.stringify(body.actionsJson) : body.actionsJson || "{}",
        description: body.description || "",
        script: body.script || "",
      },
    });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script",
      action: "insert",
      recordId: rule.id,
      name: rule.name,
      data: rule,
    });

    return NextResponse.json({ result: rule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
