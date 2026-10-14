import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");

    const where: any = {};
    if (table) where.tableName = table;

    const scripts = await db.sysClientScript.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ result: scripts });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { name, tableName, type, fieldName, scriptBody, active, description } = body;

    if (!name || !tableName || !type || scriptBody === undefined) {
      return NextResponse.json(
        { error: "name, tableName, type, and scriptBody are required" },
        { status: 400 }
      );
    }

    const script = await db.sysClientScript.create({
      data: {
        name,
        tableName,
        type,
        fieldName: fieldName || null,
        scriptBody,
        active: active !== undefined ? active : true,
        description: description || null,
      },
    });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script_client",
      action: "insert",
      recordId: script.id,
      name: script.name,
      data: script,
    });

    return NextResponse.json({ result: script });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
