import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.sysScheduledJob.findUnique({
      where: { id },
    });
    if (!job) {
      return NextResponse.json({ error: "Scheduled Job not found" }, { status: 404 });
    }
    return NextResponse.json({ result: job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.sysScheduledJob.update({
      where: { id },
      data: {
        name: body.name,
        runIntervalMinutes: body.runIntervalMinutes !== undefined ? Number(body.runIntervalMinutes) : undefined,
        script: body.script,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    });

    return NextResponse.json({ result: updated });
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
    await db.sysScheduledJob.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
