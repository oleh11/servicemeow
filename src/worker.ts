/**
 * ServiceMeow Background Worker & Interval Scheduler
 * Executes:
 * 1. Due Scheduled Jobs (`sys_scheduled_jobs`) in a secure sandboxed VM
 * 2. Autonomous Workflow Agent triage cycle (SLA escalations & auto-assignments)
 */

import { db } from "./lib/db";
import { runInSecureSandbox } from "./lib/script-sandbox";
import { runWorkflowAgent } from "./lib/workflow-agent";

const WORKER_INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS) || 15000; // 15 seconds

let isRunning = true;
let isProcessing = false;

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] [WORKER] [${level}] ${msg}`, data);
  } else {
    console.log(`[${timestamp}] [WORKER] [${level}] ${msg}`);
  }
}

async function executeDueJobs() {
  const now = new Date();
  const dueJobs = await db.sysScheduledJob.findMany({
    where: {
      active: true,
      nextRunAt: { lte: now },
    },
  });

  if (dueJobs.length === 0) return;

  log("INFO", `Found ${dueJobs.length} due scheduled job(s) to execute.`);

  for (const job of dueJobs) {
    log("INFO", `Executing job: '${job.name}' (id: ${job.id})`);
    const outputLogs: string[] = [];
    const safeLogger = (...msgs: any[]) => {
      outputLogs.push(
        msgs.map((m) => (typeof m === "object" ? JSON.stringify(m) : String(m))).join(" ")
      );
    };

    let finalLog = "";
    try {
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
      finalLog = outputLogs.length > 0 ? outputLogs.join("\n") : "Job executed successfully.";
      log("INFO", `Job '${job.name}' completed successfully.`);
    } catch (err: any) {
      finalLog = `Execution Error: ${err.message}`;
      log("ERROR", `Job '${job.name}' failed with error: ${err.message}`);
    }

    const intervalMinutes = Math.max(1, job.runIntervalMinutes || 60);
    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);

    await db.sysScheduledJob.update({
      where: { id: job.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun,
        lastLog: finalLog,
      },
    });
  }
}

async function executeWorkflowAgent() {
  try {
    const report = await runWorkflowAgent();
    if (report.autoAssignments > 0 || report.escalationsTriggered > 0) {
      log("INFO", "Workflow Agent actions applied:", {
        scanned: report.tasksScanned,
        autoAssignments: report.autoAssignments,
        escalations: report.escalationsTriggered,
      });
    }
  } catch (err: any) {
    log("ERROR", `Workflow agent cycle failed: ${err.message}`);
  }
}

async function runWorkerTick() {
  if (isProcessing || !isRunning) return;
  isProcessing = true;

  try {
    await executeDueJobs();
    await executeWorkflowAgent();
  } catch (err: any) {
    log("ERROR", `Unexpected error during worker cycle: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

export async function startWorker() {
  log("INFO", `ServiceMeow Scheduler Daemon started. Polling every ${WORKER_INTERVAL_MS / 1000}s.`);

  // Immediate initial run
  await runWorkerTick();

  // Schedule periodic tick
  const interval = setInterval(async () => {
    if (!isRunning) {
      clearInterval(interval);
      return;
    }
    await runWorkerTick();
  }, WORKER_INTERVAL_MS);

  // Graceful shutdown signals
  const shutdown = async (signal: string) => {
    log("WARN", `Received ${signal}. Shutting down worker gracefully...`);
    isRunning = false;
    clearInterval(interval);
    await db.$disconnect();
    log("INFO", "Worker shutdown complete.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// If executed directly
if (require.main === module || process.argv[1]?.includes("worker")) {
  startWorker().catch((err) => {
    console.error("Worker failed to start:", err);
    process.exit(1);
  });
}
