import { NextRequest, NextResponse } from "next/server";
import { detectChangeConflicts } from "@/lib/change-conflict-engine";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const changeId = request.nextUrl.searchParams.get("change_id");
    if (!changeId) {
      const allConflicts = await db.changeConflict.findMany({
        include: { change: { include: { task: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ result: allConflicts });
    }

    const result = await detectChangeConflicts(changeId);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
