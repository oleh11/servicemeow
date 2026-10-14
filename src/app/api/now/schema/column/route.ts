import { NextRequest, NextResponse } from "next/server";
import { updateColumn } from "@/lib/dictionary";
import { recordUpdateChange } from "@/lib/update-set";

export async function PATCH(request: NextRequest) {
  try {
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
    console.error("Column PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
