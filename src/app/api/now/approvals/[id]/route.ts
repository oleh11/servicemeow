import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { state, comments } = body; // state: "approved" | "rejected"

    const approval = await db.approvalRecord.findUnique({
      where: { id },
      include: { task: { include: { changeRequest: true } } },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval record not found" }, { status: 404 });
    }

    const updated = await db.approvalRecord.update({
      where: { id },
      data: {
        state,
        comments: comments || approval.comments,
      },
    });

    // If it's a change request, update the change's cabApprovalState
    if (approval.task.changeRequest) {
      await db.changeRequest.update({
        where: { taskId: approval.taskId },
        data: {
          cabApprovalState: state,
        },
      });

      // Add a work note to the task timeline
      await db.activityNote.create({
        data: {
          taskId: approval.taskId,
          authorId: approval.approverId,
          noteType: "work_note",
          content: `[APPROVAL DECISION] ${state.toUpperCase()}: ${comments || "No comments provided"}`,
        },
      });
    }

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
