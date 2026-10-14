import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { runInSecureSandbox } from "@/lib/script-sandbox";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const job = await db.sysScheduledJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Scheduled Job not found" }, { status: 404 });
    }

    const outputLogs: string[] = [];
    const safeLogger = (...msgs: any[]) => {
      outputLogs.push(
        msgs.map((m) => (typeof m === "object" ? JSON.stringify(m) : String(m))).join(" ")
      );
    };

    let executionSuccess = true;
    let finalLog = "";

    try {
      // Safe, restricted sandbox with no process/require/host access
      const sandboxContext = {
        log: safeLogger,
        gs: {
          log: safeLogger,
          info: safeLogger,
          warn: safeLogger,
          error: safeLogger,
          nowDateTime: () => new Date().toISOString(),
        },
      };

      const result = runInSecureSandbox(job.script, sandboxContext, { timeoutMs: 5000 });
      if (result && typeof result === "string") {
        outputLogs.push(result);
      }
      finalLog = outputLogs.length > 0 ? outputLogs.join("\n") : "Job completed successfully with no output.";
    } catch (scriptErr: any) {
      executionSuccess = false;
      finalLog = `Execution Error: ${scriptErr.message}`;
    }

    const updated = await db.sysScheduledJob.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: new Date(Date.now() + job.runIntervalMinutes * 60 * 1000),
        lastLog: finalLog,
      },
    });

    return NextResponse.json({
      success: executionSuccess,
      result: updated,
      log: finalLog,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
