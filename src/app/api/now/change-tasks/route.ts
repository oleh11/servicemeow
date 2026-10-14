import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getNextNumber } from "@/lib/numbering";

export async function GET(request: NextRequest) {
  try {
    const changeId = request.nextUrl.searchParams.get("change_id");
    const where: any = {};
    if (changeId) {
      where.OR = [
        { changeRequestId: changeId },
        { changeRequest: { taskId: changeId } },
      ];
    }

    const tasks = await db.changeTask.findMany({
      where,
      include: {
        task: true,
        changeRequest: { include: { task: true } },
      },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ result: tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      changeRequestId,
      shortDescription,
      taskType = "implementation",
      sequence = 1,
      required = true,
      assignedToId,
      assignmentGroupId,
    } = body;

    if (!changeRequestId || !shortDescription) {
      return NextResponse.json(
        { error: "changeRequestId and shortDescription are required." },
        { status: 400 }
      );
    }

    // Find actual changeRequest cuid if taskId was passed
    const chg = await db.changeRequest.findFirst({
      where: {
        OR: [{ id: changeRequestId }, { taskId: changeRequestId }],
      },
    });

    if (!chg) {
      return NextResponse.json(
        { error: `Change Request with ID '${changeRequestId}' not found.` },
        { status: 404 }
      );
    }

    const ctaskNumber = await getNextNumber("CTASK");
    const baseTask = await db.task.create({
      data: {
        number: ctaskNumber,
        sysClassName: "change_task",
        shortDescription,
        priority: 3,
        state: 1, // New
        assignedToId: assignedToId || null,
        assignmentGroupId: assignmentGroupId || null,
      },
    });

    const changeTask = await db.changeTask.create({
      data: {
        taskId: baseTask.id,
        changeRequestId: chg.id,
        taskType,
        sequence: Number(sequence) || 1,
        required: Boolean(required),
      },
      include: {
        task: true,
      },
    });

    return NextResponse.json({ result: changeTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
