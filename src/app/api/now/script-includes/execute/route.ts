import { NextRequest, NextResponse } from "next/server";
import { executeScriptInclude } from "@/lib/script-include-engine";

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
