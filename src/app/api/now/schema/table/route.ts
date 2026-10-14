import { NextRequest, NextResponse } from "next/server";
import { createTable } from "@/lib/dictionary";
import { recordUpdateChange } from "@/lib/update-set";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!body.name || !body.label) {
      return NextResponse.json(
        { error: "Table name and label are required" },
        { status: 400 }
      );
    }

    const table = await createTable(body);

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_db_object",
      action: "insert",
      recordId: table.id,
      name: table.name,
      data: table,
    });

    return NextResponse.json({ result: table }, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
