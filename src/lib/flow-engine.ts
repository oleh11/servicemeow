import { db } from "@/lib/db";
import { evaluateRuleFilter } from "@/lib/business-rules";

export interface FlowStep {
  step: number;
  action: "notification" | "create_approval" | "work_note" | "update_record";
  title: string;
  detail: string;
}

export interface FlowExecutionResult {
  flowId: string;
  flowName: string;
  executionId: string;
  logs: string[];
}

/**
 * Triggers matching ServiceMeow Hub Flows for a given table and record.
 */
export async function triggerFlows(
  triggerTable: string,
  record: { id: string; number?: string; [key: string]: any }
): Promise<FlowExecutionResult[]> {
  const results: FlowExecutionResult[] = [];

  try {
    const flows = await db.sysHubFlow.findMany({
      where: {
        triggerTable,
        active: true,
      },
    });

    for (const flow of flows) {
      let isTriggered = false;
      if (!flow.triggerCondition) {
        isTriggered = true;
      } else {
        isTriggered = evaluateRuleFilter(record, flow.triggerCondition);
      }

      if (isTriggered) {
        const executionLogs: string[] = [];
        let steps: FlowStep[] = [];

        try {
          steps = JSON.parse(flow.stepsJson);
        } catch {
          steps = [];
        }

        executionLogs.push(
          `🐾 [Flow Designer] Triggered flow '${flow.name}' for record ${record.number || record.id}.`
        );

        // Check if record exists in task table before creating relational records
        const taskExists = await db.task.findUnique({ where: { id: record.id } }).catch(() => null);

        for (const step of steps) {
          try {
            if (step.action === "notification") {
              executionLogs.push(`[Step ${step.step} - Notification] ${step.title}: ${step.detail}`);
            } else if (step.action === "work_note") {
              executionLogs.push(`[Step ${step.step} - Work Note] Added work note: ${step.detail}`);
              if (taskExists) {
                await db.activityNote.create({
                  data: {
                    taskId: record.id,
                    noteType: "work_note",
                    content: `🐾 [Flow Designer: ${flow.name}] ${step.detail}`,
                  },
                });
              }
            } else if (step.action === "create_approval") {
              executionLogs.push(`[Step ${step.step} - Approval] Created approval record: ${step.detail}`);
              if (taskExists) {
                // Find CAB approver or platform admin to attach
                const approver = await db.user.findFirst({
                  where: { role: { in: ["cab_approver", "admin"] } },
                });
                if (approver) {
                  await db.approvalRecord.create({
                    data: {
                      taskId: record.id,
                      approverId: approver.id,
                      state: "requested",
                      approvalType: "cab",
                      comments: `Automatically requested by ServiceMeow Flow '${flow.name}'`,
                    },
                  });
                }
              }
            } else if (step.action === "update_record") {
              executionLogs.push(`[Step ${step.step} - Update] Executed record update action: ${step.detail}`);
              if (taskExists && step.detail && step.detail.includes("=")) {
                const parts = step.detail.split(",").map((s) => s.trim());
                const updateData: any = {};
                for (const part of parts) {
                  const [k, v] = part.split("=").map((s) => s.trim());
                  if (k === "state") updateData.state = parseInt(v, 10);
                  if (k === "priority") updateData.priority = parseInt(v, 10);
                  if (k === "shortDescription" || k === "short_description") updateData.shortDescription = v;
                }
                if (Object.keys(updateData).length > 0) {
                  await db.task.update({ where: { id: record.id }, data: updateData }).catch(() => null);
                }
              }
            }
          } catch (stepErr: any) {
            executionLogs.push(`[Step ${step.step} Error] Failed: ${stepErr.message}`);
          }
        }

        // Record execution in SysHubFlowExecution
        const execution = await db.sysHubFlowExecution.create({
          data: {
            flowId: flow.id,
            recordId: record.id,
            recordNumber: record.number || "N/A",
            status: "completed",
            executionLog: JSON.stringify(executionLogs),
          },
        });

        // Update flow stats
        await db.sysHubFlow.update({
          where: { id: flow.id },
          data: {
            runCount: { increment: 1 },
            lastRunAt: new Date(),
          },
        });

        results.push({
          flowId: flow.id,
          flowName: flow.name,
          executionId: execution.id,
          logs: executionLogs,
        });
      }
    }
  } catch (err) {
    console.error("Error triggering Hub Flows:", err);
  }

  return results;
}

/**
 * Simulates a single flow execution for testing and debugging in Studio Flow Designer.
 */
export async function simulateFlow(
  flowId: string,
  targetRecordId?: string
): Promise<FlowExecutionResult | null> {
  const flow = await db.sysHubFlow.findUnique({ where: { id: flowId } });
  if (!flow) return null;

  let record: any = null;
  if (targetRecordId) {
    record = await db.task.findUnique({
      where: { id: targetRecordId },
      include: { incident: true, changeRequest: true, problem: true },
    });
  }

  if (!record) {
    record = await db.task.findFirst({
      where: { sysClassName: flow.triggerTable },
      orderBy: { createdAt: "desc" },
      include: { incident: true, changeRequest: true, problem: true },
    });
  }

  const recordNumber = record?.number || (flow.triggerTable === "incident" ? "INC0001001" : "CHG0001001");
  const recordId = record?.id || "simulation-test-id";

  const executionLogs: string[] = [
    `🐾 [Flow Simulation] Live testing flow '${flow.name}' against record ${recordNumber}.`,
    `[Trigger Check] Table: ${flow.triggerTable} • Condition: '${flow.triggerCondition || "Always"}' (Simulated PASS)`,
  ];

  let steps: FlowStep[] = [];
  try {
    steps = JSON.parse(flow.stepsJson);
  } catch {
    steps = [];
  }

  for (const step of steps) {
    if (step.action === "notification") {
      executionLogs.push(`[Step ${step.step} - Notification] ${step.title}: ${step.detail}`);
    } else if (step.action === "work_note") {
      executionLogs.push(`[Step ${step.step} - Work Note] ${step.title}: ${step.detail}`);
    } else if (step.action === "create_approval") {
      executionLogs.push(`[Step ${step.step} - Approval] ${step.title}: ${step.detail}`);
    } else if (step.action === "update_record") {
      executionLogs.push(`[Step ${step.step} - Update] ${step.title}: ${step.detail}`);
    } else {
      executionLogs.push(`[Step ${step.step}] ${step.title}: ${step.detail}`);
    }
  }

  executionLogs.push(`🐾 [Flow Complete] Successfully orchestrated ${steps.length} sequential steps without error.`);

  // Record in sysHubFlowExecution
  const execution = await db.sysHubFlowExecution.create({
    data: {
      flowId: flow.id,
      recordId,
      recordNumber,
      status: "completed",
      executionLog: JSON.stringify(executionLogs),
    },
  });

  await db.sysHubFlow.update({
    where: { id: flow.id },
    data: {
      runCount: { increment: 1 },
      lastRunAt: new Date(),
    },
  });

  return {
    flowId: flow.id,
    flowName: flow.name,
    executionId: execution.id,
    logs: executionLogs,
  };
}
