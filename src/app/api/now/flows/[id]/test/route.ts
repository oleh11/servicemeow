import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulateFlow } from "@/lib/flow-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const flow = await db.sysHubFlow.findUnique({ where: { id } });
    if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });

    const executionResult = await simulateFlow(id, body?.recordId);

    if (!executionResult) {
      return NextResponse.json({ error: "Failed to simulate flow execution" }, { status: 500 });
    }

    return NextResponse.json({
      result: {
        flowName: flow.name,
        testedRecord: body?.recordId || `Latest ${flow.triggerTable}`,
        executions: [executionResult],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
