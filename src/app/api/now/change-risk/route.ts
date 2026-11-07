import { NextRequest, NextResponse } from "next/server";
import { evaluateChangeRisk } from "@/lib/change-risk-engine";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const evaluation = await evaluateChangeRisk({
      changeId: body.changeId || body.change_id,
      changeType: body.changeType || body.change_type,
      cmdbCiId: body.cmdbCiId || body.cmdb_ci_id,
      plannedStart: body.plannedStart || body.planned_start,
      plannedEnd: body.plannedEnd || body.planned_end,
    });

    return NextResponse.json({ result: evaluation });
  } catch (err: any) {
    console.error("Change risk API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
