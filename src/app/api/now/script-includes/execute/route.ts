import { NextRequest, NextResponse } from "next/server";
import { executeScriptInclude } from "@/lib/script-include-engine";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { scriptIncludeName, methodName, args = [], context = {} } = body;

    if (!scriptIncludeName) {
      return NextResponse.json(
        { error: "scriptIncludeName is required." },
        { status: 400 }
      );
    }

    const output = await executeScriptInclude(scriptIncludeName, methodName, args, context);
    return NextResponse.json({ result: output });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
