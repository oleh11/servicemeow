import { db } from "./db";

export interface EnqueueEventOptions {
  parm1?: string;
  parm2?: string;
  userId?: string;
}

export async function enqueueEvent(
  name: string,
  tableName: string,
  instanceId: string,
  parm1?: string,
  parm2?: string
) {
  const event = await db.sysEvent.create({
    data: {
      name,
      tableName,
      instanceId,
      parm1: parm1 || null,
      parm2: parm2 || null,
      processed: false,
    },
  });

  // Immediately process for this event
  await processEvent(event.id);
  const updated = await db.sysEvent.findUnique({ where: { id: event.id } });
  return updated || event;
}

export async function processEvent(eventId: string) {
  const event = await db.sysEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.processed) return;

  // Find matching notifications
  const notifications = await db.sysEmailNotification.findMany({
    where: {
      active: true,
      tableName: event.tableName,
      eventTrigger: event.name,
    },
  });

  // Fetch record for variable token replacement
  let recordData: any = {};
  if (event.tableName === "incident") {
    const inc = await db.incident.findFirst({
      where: {
        OR: [{ id: event.instanceId }, { taskId: event.instanceId }],
      },
      include: {
        task: true,
        caller: true,
      },
    });
    if (inc) {
      recordData = {
        number: inc.task.number,
        short_description: inc.task.shortDescription,
        description: inc.task.description || "",
        priority: String(inc.task.priority),
        state: String(inc.task.state),
        caller_id: inc.caller?.name || inc.callerName || "Unknown Caller",
        category: inc.category,
      };
    }
  } else if (event.tableName === "change_request") {
    const chg = await db.changeRequest.findFirst({
      where: {
        OR: [{ id: event.instanceId }, { taskId: event.instanceId }],
      },
      include: { task: true },
    });
    if (chg) {
      recordData = {
        number: chg.task.number,
        short_description: chg.task.shortDescription,
        change_type: chg.changeType,
        risk: chg.risk,
      };
    }
  }

  // Token replacement helper
  const replaceTokens = (template: string) => {
    return template.replace(/\$\{([^}]+)\}/g, (_, field) => {
      if (field === "parm1") return event.parm1 || "";
      if (field === "parm2") return event.parm2 || "";
      return recordData[field] !== undefined ? String(recordData[field]) : "";
    });
  };

  for (const notif of notifications) {
    const renderedSubject = replaceTokens(notif.subject);
    const renderedBody = replaceTokens(notif.bodyTemplate);

    // If incident/task, log an automated activity note about email dispatch
    if (event.tableName === "incident" || event.tableName === "change_request" || event.tableName === "task") {
      try {
        const taskExists = await db.task.findUnique({ where: { id: event.instanceId } });
        if (taskExists) {
          await db.activityNote.create({
            data: {
              taskId: event.instanceId,
              noteType: "work_note",
              content: `[Automated Notification: ${notif.name}]\nSubject: ${renderedSubject}\nRecipients: [Roles: ${notif.recipientRoles}]\n\n${renderedBody}`,
            },
          });
        }
      } catch (err) {
        // Ignored
      }
    }
  }

  // Mark event as processed
  await db.sysEvent.update({
    where: { id: event.id },
    data: {
      processed: true,
      processedAt: new Date(),
    },
  });
}
