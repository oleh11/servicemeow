import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const jobs = await db.sysScheduledJob.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: jobs });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { name, runIntervalMinutes = 60, script, active = true } = body;

    if (!name || !script) {
      return NextResponse.json(
        { error: "name and script are required." },
        { status: 400 }
      );
    }

    const job = await db.sysScheduledJob.create({
      data: {
        name,
        runIntervalMinutes: Number(runIntervalMinutes),
        script,
        active: Boolean(active),
        nextRunAt: new Date(Date.now() + Number(runIntervalMinutes) * 60 * 1000),
      },
    });

    return NextResponse.json({ result: job }, { status: 201 });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
