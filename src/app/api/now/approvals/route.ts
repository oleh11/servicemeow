import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/now/approvals -> returns approval records with task and requester details
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const approverId = searchParams.get("approverId") || (session.isAdmin ? undefined : session.user.id);

    const where: any = {};
    if (state && state !== "all") {
      where.state = state;
    }
    if (approverId) {
      where.approverId = approverId;
    }

    const approvals = await db.approvalRecord.findMany({
      where,
      include: {
        approver: true,
        task: {
          include: {
            changeRequest: true,
            incident: true,
            openedBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ result: approvals });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
