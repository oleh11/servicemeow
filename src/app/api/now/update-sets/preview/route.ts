import { NextRequest, NextResponse } from "next/server";
import { previewUpdateSet } from "@/lib/update-set";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body.payload ?? body;
    if (!payload) {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    const preview = previewUpdateSet(payloadStr);
    return NextResponse.json({ result: preview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
