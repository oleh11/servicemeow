import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await db.cmnSchedule.findUnique({
      where: { id },
      include: { slaDefinitions: true },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ result: schedule });
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

    const updated = await db.cmnSchedule.update({
      where: { id },
      data: {
        name: body.name,
        timeZone: body.timeZone,
        workDays: body.workDays,
        startHour: body.startHour !== undefined ? Number(body.startHour) : undefined,
        endHour: body.endHour !== undefined ? Number(body.endHour) : undefined,
        holidaysJson: body.holidaysJson,
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
    await db.cmnSchedule.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
