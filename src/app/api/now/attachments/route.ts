import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const table = request.nextUrl.searchParams.get("table");
    const recordId = request.nextUrl.searchParams.get("record_id");

    const where: any = {};
    if (table) where.tableName = table;
    if (recordId) where.recordId = recordId;

    const attachments = await db.sysAttachment.findMany({
      where,
      select: {
        id: true,
        tableName: true,
        recordId: true,
        fileName: true,
        contentType: true,
        byteSize: true,
        uploadedById: true,
        uploadedByName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ result: attachments });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const {
      tableName,
      recordId,
      fileName,
      contentType = "application/octet-stream",
      byteSize = 0,
      base64Data,
    } = body;

    if (!tableName || !recordId || !fileName || !base64Data) {
      return NextResponse.json(
        { error: "tableName, recordId, fileName, and base64Data are required." },
        { status: 400 }
      );
    }

    const attachment = await db.sysAttachment.create({
      data: {
        tableName,
        recordId,
        fileName,
        contentType,
        byteSize: Number(byteSize) || Math.floor((base64Data.length * 3) / 4),
        base64Data,
        uploadedById: session.user.id,
        uploadedByName: session.user.name,
      },
    });

    // Also log an activity note if this belongs to a task
    try {
      await db.activityNote.create({
        data: {
          taskId: recordId,
          noteType: "work_note",
          content: `📎 Attached file: ${fileName} (${Math.round((attachment.byteSize / 1024) * 10) / 10} KB)`,
          authorId: session.user.id,
        },
      });
    } catch {
      // Ignored if recordId is not a task id
    }

    return NextResponse.json(
      {
        result: {
          id: attachment.id,
          fileName: attachment.fileName,
          byteSize: attachment.byteSize,
          contentType: attachment.contentType,
          createdAt: attachment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
