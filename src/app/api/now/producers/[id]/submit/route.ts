import { NextRequest, NextResponse } from "next/server";
import { executeRecordProducer } from "@/lib/record-producer-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { variables = {}, user = {} } = body;

    const result = await executeRecordProducer(id, variables, user);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error: any) {
    console.error("Record producer submission failed:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
