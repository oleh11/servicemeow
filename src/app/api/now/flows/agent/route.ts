import { NextRequest, NextResponse } from "next/server";
import { runWorkflowAgent, getWorkflowAgentStatus } from "@/lib/workflow-agent";

export async function GET() {
  try {
    const status = await getWorkflowAgentStatus();
    return NextResponse.json({ result: status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const report = await runWorkflowAgent();
    return NextResponse.json({ result: report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
