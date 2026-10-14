import { db } from "./db";
import { getNextNumber } from "./numbering";
import { executeBusinessRules } from "./business-rules";
import { triggerFlows } from "./flow-engine";
import { enqueueEvent } from "./event-notification-engine";
import { runInSecureSandbox } from "./script-sandbox";

export interface RecordProducerSubmissionResult {
  success: boolean;
  record?: any;
  table: string;
  redirectUrl: string;
  number?: string;
  error?: string;
}

export async function executeRecordProducer(
  producerId: string,
  variables: Record<string, any>,
  user: { id?: string; name?: string; email?: string } = {}
): Promise<RecordProducerSubmissionResult> {
  const producer = await db.sysRecordProducer.findUnique({
    where: { id: producerId },
    include: {
      variables: {
        orderBy: { order: "asc" },
      },
      uiPolicies: {
        include: { actions: true },
      },
    },
  });

  if (!producer || !producer.active) {
    throw new Error(`Record Producer with ID '${producerId}' not found or inactive`);
  }

  // 1. Validate mandatory variables
  for (const v of producer.variables) {
    if (v.isMandatory) {
      const val = variables[v.name];
      if (val === undefined || val === null || val === "") {
        throw new Error(`Mandatory variable '${v.label}' (${v.name}) is required.`);
      }
    }
  }

  const targetTable = producer.targetTable.toLowerCase();
  const currentRecord: Record<string, any> = {};

  // 2. Map variables marked with mapToField
  for (const v of producer.variables) {
    const val = variables[v.name];
    if (v.mapToField && v.targetField && val !== undefined) {
      currentRecord[v.targetField] = val;
    }
  }

  // Set default caller/opened_by if available
  if (user.id) {
    if (!currentRecord.caller_id && (targetTable === "incident" || targetTable === "task")) {
      currentRecord.caller_id = user.id;
    }
    if (!currentRecord.caller_name) currentRecord.caller_name = user.name || "Self-Service User";
    if (!currentRecord.caller_email) currentRecord.caller_email = user.email || "";
    if (!currentRecord.opened_by_id) currentRecord.opened_by_id = user.id;
  }

  // Fallbacks for short_description if not mapped
  if (!currentRecord.short_description) {
    currentRecord.short_description = variables.short_description || variables.summary || variables.issue_title || `Submission via ${producer.name}`;
  }
  if (!currentRecord.description && variables.description) {
    currentRecord.description = variables.description;
  }

  // 3. Evaluate Producer Script ('current' & 'producer' context) safely
  if (producer.producerScript && producer.producerScript.trim()) {
    try {
      await runInSecureSandbox(
        producer.producerScript,
        { current: currentRecord, producer: variables, user },
        { timeoutMs: 2000 }
      );
    } catch (err: any) {
      console.error(`Error in producer script for ${producer.name}:`, err);
    }
  }

  // 4. Evaluate before_insert business rules
  const brBefore = await executeBusinessRules(targetTable, "before_insert", currentRecord);
  if (brBefore?.mutatedFields) {
    Object.assign(currentRecord, brBefore.mutatedFields);
  }

  // 5. Generate Number
  let prefix = "TASK";
  if (targetTable === "incident") prefix = "INC";
  else if (targetTable === "change_request") prefix = "CHG";
  else if (targetTable === "problem") prefix = "PRB";
  else if (targetTable.startsWith("u_")) prefix = "U";

  const recordNumber = await getNextNumber(prefix);
  let createdRecord: any = null;

  // 6. Validate Foreign Keys
  let validUserId: string | null = null;
  if (user.id) {
    const u = await db.user.findUnique({ where: { id: user.id } });
    if (u) validUserId = u.id;
  }

  let validGroupId: string | null = null;
  const rawGid = currentRecord.assignment_group_id || currentRecord.assignmentGroupId;
  if (rawGid) {
    const g = await db.group.findUnique({ where: { id: rawGid } });
    if (g) validGroupId = g.id;
  }

  let validAssignedToId: string | null = null;
  const rawAssigned = currentRecord.assigned_to_id || currentRecord.assignedToId;
  if (rawAssigned) {
    const u = await db.user.findUnique({ where: { id: rawAssigned } });
    if (u) validAssignedToId = u.id;
  }

  let validCiId: string | null = null;
  const rawCi = currentRecord.cmdb_ci_id || currentRecord.cmdbCiId;
  if (rawCi) {
    const c = await db.configurationItem.findUnique({ where: { id: rawCi } });
    if (c) validCiId = c.id;
  }

  // 7. Insert record into database
  if (targetTable === "incident") {
    const task = await db.task.create({
      data: {
        number: recordNumber,
        sysClassName: "incident",
        shortDescription: currentRecord.short_description || "Incident Report",
        description: currentRecord.description || null,
        priority: Number(currentRecord.priority || 3),
        state: Number(currentRecord.state || 1),
        impact: Number(currentRecord.impact || 2),
        urgency: Number(currentRecord.urgency || 2),
        openedById: validUserId,
        cmdbCiId: validCiId,
        assignmentGroupId: validGroupId,
        assignedToId: validAssignedToId,
      },
    });

    const inc = await db.incident.create({
      data: {
        taskId: task.id,
        callerId: validUserId,
        callerName: currentRecord.caller_name || user.name || "Self-Service Caller",
        callerEmail: currentRecord.caller_email || user.email || null,
        category: currentRecord.category || "inquiry",
        subcategory: currentRecord.subcategory || null,
        cmdbCiId: validCiId,
      },
    });
    createdRecord = { ...task, ...inc };
  } else if (targetTable === "change_request") {
    const task = await db.task.create({
      data: {
        number: recordNumber,
        sysClassName: "change_request",
        shortDescription: currentRecord.short_description || "Change Request",
        description: currentRecord.description || null,
        priority: Number(currentRecord.priority || 3),
        state: Number(currentRecord.state || 1),
        impact: Number(currentRecord.impact || 2),
        urgency: Number(currentRecord.urgency || 2),
        openedById: user.id || null,
        cmdbCiId: currentRecord.cmdb_ci_id || null,
        assignmentGroupId: currentRecord.assignment_group_id || null,
      },
    });

    const chg = await db.changeRequest.create({
      data: {
        taskId: task.id,
        changeType: currentRecord.change_type || "normal",
        risk: currentRecord.risk || "moderate",
        cmdbCiId: currentRecord.cmdb_ci_id || null,
        implementationPlan: currentRecord.implementation_plan || null,
        backoutPlan: currentRecord.backout_plan || null,
        testPlan: currentRecord.test_plan || null,
      },
    });
    createdRecord = { ...task, ...chg };
  } else if (targetTable === "problem") {
    const task = await db.task.create({
      data: {
        number: recordNumber,
        sysClassName: "problem",
        shortDescription: currentRecord.short_description || "Problem Investigation",
        description: currentRecord.description || null,
        priority: Number(currentRecord.priority || 3),
        state: Number(currentRecord.state || 1),
        openedById: user.id || null,
      },
    });
    const prb = await db.problem.create({
      data: {
        taskId: task.id,
        rootCause: currentRecord.root_cause || null,
        workaround: currentRecord.workaround || null,
      },
    });
    createdRecord = { ...task, ...prb };
  } else {
    // Dynamic Custom Table storage
    const customRec = await db.sysCustomRecord.create({
      data: {
        tableName: targetTable,
        dataJson: JSON.stringify({
          number: recordNumber,
          ...currentRecord,
          sys_created_on: new Date().toISOString(),
          sys_created_by: user.name || "Self-Service",
        }),
      },
    });
    createdRecord = { id: customRec.id, number: recordNumber, ...currentRecord };
  }

  // 7. Fire Events & Notifications
  try {
    await enqueueEvent(
      `${targetTable}.created`,
      targetTable,
      createdRecord.id || createdRecord.taskId,
      recordNumber,
      user.name || "Self-Service"
    );
  } catch (e) {
    console.warn("Event queue notification error:", e);
  }

  // 8. After-insert Business Rules & Flows
  await executeBusinessRules(targetTable, "after_insert", createdRecord);
  try {
    await triggerFlows(targetTable, createdRecord);
  } catch (e) {
    console.warn("Flow trigger error:", e);
  }

  // 9. Resolve redirect URL
  let redirectUrl = producer.redirectUrl || `/workspace/${targetTable}/${createdRecord.id || createdRecord.taskId}`;
  redirectUrl = redirectUrl.replace("{id}", createdRecord.id || createdRecord.taskId).replace("{number}", recordNumber);

  return {
    success: true,
    record: createdRecord,
    table: targetTable,
    number: recordNumber,
    redirectUrl,
  };
}
