import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { state, comments } = body;

    const approval = await db.approvalRecord.findUnique({
      where: { id },
      include: { task: { include: { changeRequest: true } } },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval record not found" }, { status: 404 });
    }

    // Only designated approver or platform administrator can record approval decisions
    if (!session.isAdmin && session.user.id !== approval.approverId) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to decide this approval record" },
        { status: 403 }
      );
    }

    const updated = await db.approvalRecord.update({
      where: { id },
      data: {
        state,
        comments: comments || approval.comments,
      },
    });

    if (approval.task.changeRequest) {
      await db.changeRequest.update({
        where: { taskId: approval.taskId },
        data: {
          cabApprovalState: state,
        },
      });

      await db.activityNote.create({
        data: {
          taskId: approval.taskId,
          authorId: session.user.id,
          noteType: "work_note",
          content: `[APPROVAL DECISION] ${state.toUpperCase()} by ${session.user.name}: ${comments || "No comments provided"}`,
        },
      });
    }

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
