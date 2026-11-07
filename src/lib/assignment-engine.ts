import { db } from "@/lib/db";

export interface AutoAssignResult {
  assigned: boolean;
  assignedToId?: string;
  assignedToName?: string;
  agentTicketCount?: number;
  reason?: string;
}

/**
 * ServiceMeow Automated Assignment Engine (Inspired by Frappe CRM assignment rules)
 * Evaluates active members of an assignment group and assigns the ticket to
 * the technician with the lowest active workload (Load-Balancing algorithm).
 */
export async function autoAssignTask(
  taskId: string,
  groupId?: string | null
): Promise<AutoAssignResult> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { id: true, number: true, assignmentGroupId: true, assignedToId: true },
    });

    if (!task) {
      return { assigned: false, reason: "TASK_NOT_FOUND" };
    }

    const targetGroupId = groupId || task.assignmentGroupId;
    if (!targetGroupId) {
      return { assigned: false, reason: "NO_ASSIGNMENT_GROUP" };
    }

    // Fetch active members of the group
    const members = await db.userGroupMember.findMany({
      where: { groupId: targetGroupId },
      include: {
        user: { select: { id: true, name: true, active: true } },
      },
    });

    const activeMembers = members.filter((m) => m.user && m.user.active);
    if (activeMembers.length === 0) {
      return { assigned: false, reason: "NO_ACTIVE_GROUP_MEMBERS" };
    }

    // If only one member, assign directly
    if (activeMembers.length === 1) {
      const singleUser = activeMembers[0].user;
      await db.task.update({
        where: { id: taskId },
        data: { assignedToId: singleUser.id },
      });

      await db.activityNote.create({
        data: {
          taskId,
          noteType: "work_note",
          content: `🤖 [Assignment Engine] Auto-assigned to ${singleUser.name} (Sole active group member).`,
        },
      });

      return {
        assigned: true,
        assignedToId: singleUser.id,
        assignedToName: singleUser.name,
        agentTicketCount: 0,
      };
    }

    // Count open tasks for each candidate agent (states 1, 2, 3)
    const candidatesWithCounts = await Promise.all(
      activeMembers.map(async (m) => {
        const openCount = await db.task.count({
          where: {
            assignedToId: m.user.id,
            state: { in: [1, 2, 3] }, // New, In Progress, On Hold
            active: true,
          },
        });
        return {
          user: m.user,
          openCount,
        };
      })
    );

    // Sort by open ticket count ascending (least loaded agent first)
    candidatesWithCounts.sort((a, b) => a.openCount - b.openCount);
    const selected = candidatesWithCounts[0];

    // Update task
    await db.task.update({
      where: { id: taskId },
      data: { assignedToId: selected.user.id },
    });

    // Record system audit work note
    await db.activityNote.create({
      data: {
        taskId,
        noteType: "work_note",
        content: `🤖 [Assignment Engine] Auto-assigned to ${selected.user.name} via Load-Balancing Engine (Active Queue: ${selected.openCount} tasks).`,
      },
    });

    return {
      assigned: true,
      assignedToId: selected.user.id,
      assignedToName: selected.user.name,
      agentTicketCount: selected.openCount,
    };
  } catch (error: any) {
    console.error("Assignment Engine error:", error);
    return { assigned: false, reason: error.message };
  }
}
