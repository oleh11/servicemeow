import { db } from "./db";

export interface ChangeConflictResult {
  conflictsFound: boolean;
  conflicts: any[];
}

export async function detectChangeConflicts(changeId: string): Promise<ChangeConflictResult> {
  const change = await db.changeRequest.findFirst({
    where: {
      OR: [{ id: changeId }, { taskId: changeId }],
    },
    include: {
      task: true,
      cmdbCi: true,
    },
  });

  if (!change || !change.plannedStart || !change.plannedEnd || !change.cmdbCiId) {
    return { conflictsFound: false, conflicts: [] };
  }

  // Delete older conflicts for this change
  await db.changeConflict.deleteMany({
    where: { changeId: change.id },
  });

  // Query overlapping active changes targeting the same CI
  const overlappingChanges = await db.changeRequest.findMany({
    where: {
      id: { not: change.id },
      cmdbCiId: change.cmdbCiId,
      task: {
        state: { in: [1, 2, 3] }, // Active states
      },
      plannedStart: {
        lt: change.plannedEnd,
      },
      plannedEnd: {
        gt: change.plannedStart,
      },
    },
    include: {
      task: true,
      cmdbCi: true,
    },
  });

  const createdConflicts = [];

  for (const other of overlappingChanges) {
    const details = `CI Schedule Collision: Conflicting change ${other.task.number} ("${other.task.shortDescription}") is scheduled on the same CI (${change.cmdbCi?.name}) from ${other.plannedStart?.toISOString()} to ${other.plannedEnd?.toISOString()}.`;
    const conflict = await db.changeConflict.create({
      data: {
        changeId: change.id,
        conflictingChangeId: other.id,
        ciId: change.cmdbCiId,
        conflictType: "ci_window_overlap",
        details,
      },
    });
    createdConflicts.push(conflict);
  }

  return {
    conflictsFound: createdConflicts.length > 0,
    conflicts: createdConflicts,
  };
}

export async function validateChangeClosureGating(changeId: string): Promise<{
  canClose: boolean;
  blockingTasks: any[];
  message?: string;
}> {
  const change = await db.changeRequest.findFirst({
    where: {
      OR: [{ id: changeId }, { taskId: changeId }],
    },
  });

  if (!change) return { canClose: true, blockingTasks: [] };

  // Find required change tasks that are not closed
  const tasks = await db.changeTask.findMany({
    where: {
      changeRequestId: change.id,
      required: true,
    },
    include: {
      task: true,
    },
  });

  // Task states: 7 is Closed, 6 is Resolved
  const openRequiredTasks = tasks.filter((t) => t.task.state !== 7 && t.task.state !== 6);

  if (openRequiredTasks.length > 0) {
    const taskNumbers = openRequiredTasks.map((t) => t.task.number).join(", ");
    return {
      canClose: false,
      blockingTasks: openRequiredTasks,
      message: `Change cannot be closed: Required Change Tasks must be completed first (${taskNumbers}).`,
    };
  }

  return { canClose: true, blockingTasks: [] };
}
