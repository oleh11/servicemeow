import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attachment = await db.sysAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json({ result: attachment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.sysAttachment.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
