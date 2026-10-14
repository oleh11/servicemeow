import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const schedules = await db.cmnSchedule.findMany({
      include: { slaDefinitions: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, timeZone, workDays, startHour, endHour, holidaysJson } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const created = await db.cmnSchedule.create({
      data: {
        name,
        timeZone: timeZone || "America/New_York",
        workDays: workDays || "1,2,3,4,5",
        startHour: startHour !== undefined ? Number(startHour) : 9,
        endHour: endHour !== undefined ? Number(endHour) : 17,
        holidaysJson: holidaysJson || "[]",
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
