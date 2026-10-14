import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/approvals -> returns approval records with task and requester details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state"); // "requested", "approved", "rejected", or all
    const approverId = searchParams.get("approverId");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
