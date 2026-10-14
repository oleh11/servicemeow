import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tableName,
      recordId,
      fileName,
      contentType = "application/octet-stream",
      byteSize = 0,
      base64Data,
      uploadedById,
      uploadedByName,
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
        uploadedById: uploadedById || null,
        uploadedByName: uploadedByName || "User",
      },
    });

    // Also log an activity note if this belongs to a task
    try {
      await db.activityNote.create({
        data: {
          taskId: recordId,
          noteType: "work_note",
          content: `📎 Attached file: ${fileName} (${Math.round((attachment.byteSize / 1024) * 10) / 10} KB)`,
          authorId: uploadedById || null,
        },
      });
    } catch (e) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
