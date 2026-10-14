import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
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

    let outputLog = "";
    try {
      const sandboxFn = new Function("db", "log", `
        ${job.script}
      `);
      const res = await sandboxFn(db, (msg: any) => {
        outputLog += String(msg) + "\n";
      });
      if (res && typeof res === "string") outputLog += res;
      if (!outputLog) outputLog = "Job completed successfully with no output.";
    } catch (scriptErr: any) {
      outputLog = `Error: ${scriptErr.message}`;
    }

    const updated = await db.sysScheduledJob.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: new Date(Date.now() + job.runIntervalMinutes * 60 * 1000),
        lastLog: outputLog,
      },
    });

    return NextResponse.json({ result: updated, log: outputLog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
