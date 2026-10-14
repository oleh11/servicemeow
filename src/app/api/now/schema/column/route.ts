import { NextRequest, NextResponse } from "next/server";
import { updateColumn } from "@/lib/dictionary";
import { recordUpdateChange } from "@/lib/update-set";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const updated = await updateColumn(body);

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_dictionary",
      action: "update",
      recordId: updated.id,
      name: `${updated.tableName}.${updated.columnName}`,
      data: updated,
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
