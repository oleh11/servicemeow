import { db } from "./db";
import { triggerFlows } from "./flow-engine";

export interface WorkflowAgentReport {
  timestamp: string;
  status: "idle" | "running" | "completed" | "error";
  tasksScanned: number;
  autoAssignments: number;
  escalationsTriggered: number;
  flowsExecuted: number;
  logs: string[];
}

let lastReport: WorkflowAgentReport | null = null;

export async function runWorkflowAgent(): Promise<WorkflowAgentReport> {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    logs.push(`[${timestamp}] ${msg}`);
  };

  addLog("🤖 ServiceMeow Autonomous Workflow Agent initiated triage cycle.");

  let autoAssignments = 0;
  let escalationsTriggered = 0;
  let flowsExecuted = 0;

  try {
    // 1. Scan active, open tasks
    const activeTasks = await db.task.findMany({
      where: {
        active: true,
        state: { in: [1, 2] }, // New or In Progress
      },
      include: {
        assignedTo: true,
        assignmentGroup: true,
        incident: true,
        changeRequest: true,
        slaInstances: {
          include: { slaDefinition: true },
        },
      },
    });

    addLog(`Scanning ${activeTasks.length} active records in the task polymorphic pipeline...`);

    // 2. Find eligible fulfillers for auto-assignment
    const itilOrAdminUsers = await db.user.findMany({
      where: {
        role: { in: ["admin", "itil"] },
        active: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const primaryFulfiller = itilOrAdminUsers[0] || null;

    // 3. Process each task for Auto-Triage & Escalation
    for (const task of activeTasks) {
      // Check 1: Auto-assign unassigned P1 Critical Tasks
      if (task.priority === 1 && !task.assignedToId && primaryFulfiller) {
        addLog(`🚨 Critical P1 task ${task.number} is unassigned! Initiating emergency auto-assignment...`);

        await db.task.update({
          where: { id: task.id },
          data: {
            assignedToId: primaryFulfiller.id,
          },
        });

        await db.activityNote.create({
          data: {
            taskId: task.id,
            noteType: "work_note",
            content: `🤖 ServiceMeow Workflow Agent: Automatically assigned unassigned P1 Critical incident to ${primaryFulfiller.name} (${primaryFulfiller.role.toUpperCase()}) for immediate response.`,
          },
        });

        autoAssignments++;
        addLog(`✅ Task ${task.number} assigned to ${primaryFulfiller.name}.`);
      }

      // Check 2: SLA Escalation & Breach Monitoring
      for (const sla of task.slaInstances) {
        if (sla.state === "in_progress") {
          const now = Date.now();
          const breach = new Date(sla.breachTime).getTime();
          const remainingMinutes = Math.round((breach - now) / 60000);

          if (now > breach) {
            // SLA Breached
            await db.slaInstance.update({
              where: { id: sla.id },
              data: { state: "breached" },
            });

            await db.activityNote.create({
              data: {
                taskId: task.id,
                noteType: "work_note",
                content: `⚠️ ServiceMeow Workflow Agent SLA Alert: SLA '${sla.slaDefinition.name}' breached! Escalating ticket to Lead Incident Commander.`,
              },
            });

            escalationsTriggered++;
            addLog(`⚠️ SLA breached on ${task.number} ('${sla.slaDefinition.name}'). SLA state set to breached.`);
          } else if (remainingMinutes <= 15 && remainingMinutes > 0) {
            // Imminent Breach Warning
            addLog(`⏱️ SLA '${sla.slaDefinition.name}' on ${task.number} has ${remainingMinutes}m remaining.`);
          }
        }
      }

      // Check 3: Check automated flows
      const flatRecord = {
        id: task.id,
        number: task.number,
        priority: task.priority,
        state: task.state,
        impact: task.impact,
        urgency: task.urgency,
        shortDescription: task.shortDescription,
        short_description: task.shortDescription,
        category: task.incident?.category,
        assignedToId: task.assignedToId,
        assignmentGroupId: task.assignmentGroupId,
      };

      const triggered = await triggerFlows(task.sysClassName, flatRecord);
      if (triggered.length > 0) {
        flowsExecuted += triggered.length;
        addLog(`⚡ Dispatched ${triggered.length} Flow Designer workflow(s) for ${task.number}.`);
      }
    }

    addLog(
      `🏁 Workflow Agent cycle completed. Auto-assignments: ${autoAssignments}, SLA Escalations: ${escalationsTriggered}, Flows: ${flowsExecuted}.`
    );

    lastReport = {
      timestamp: new Date().toISOString(),
      status: "completed",
      tasksScanned: activeTasks.length,
      autoAssignments,
      escalationsTriggered,
      flowsExecuted,
      logs,
    };

    return lastReport;
  } catch (error: any) {
    addLog(`❌ Workflow Agent error: ${error.message}`);
    lastReport = {
      timestamp: new Date().toISOString(),
      status: "error",
      tasksScanned: 0,
      autoAssignments,
      escalationsTriggered,
      flowsExecuted,
      logs,
    };
    return lastReport;
  }
}

export async function getWorkflowAgentStatus() {
  const pendingCount = await db.task.count({
    where: { active: true, state: { in: [1, 2] } },
  });

  const unassignedP1Count = await db.task.count({
    where: { active: true, priority: 1, assignedToId: null },
  });

  const breachedSlaCount = await db.slaInstance.count({
    where: { state: "breached" },
  });

  return {
    status: "active",
    daemonMode: "polling_30s",
    pendingTasks: pendingCount,
    unassignedP1s: unassignedP1Count,
    breachedSlas: breachedSlaCount,
    lastRun: lastReport || {
      timestamp: new Date().toISOString(),
      status: "idle",
      tasksScanned: pendingCount,
      autoAssignments: 0,
      escalationsTriggered: 0,
      flowsExecuted: 0,
      logs: ["Agent initialized and standing by."],
    },
  };
}
