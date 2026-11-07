import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  MAX_ATTACHMENT_BASE64_CHARS,
  MAX_ATTACHMENT_BYTES,
  getTaskRelation,
  isFulfiller,
} from "@/lib/attachment-access";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const table = request.nextUrl.searchParams.get("table");
    const recordId = request.nextUrl.searchParams.get("record_id");

    const where: any = {};
    if (table) where.tableName = table;
    if (recordId) where.recordId = recordId;

    // Non-fulfillers see their own uploads, or everything on a ticket they requested
    if (!isFulfiller(session)) {
      const ownTicket = recordId ? (await getTaskRelation(session.user.id, recordId)).isRequester : false;
      if (!ownTicket) where.uploadedById = session.user.id;
    }

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
      take: 200,
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
    const { tableName, recordId, fileName, contentType = "application/octet-stream", base64Data } = body;

    if (!tableName || !recordId || !fileName || typeof base64Data !== "string" || !base64Data) {
      return NextResponse.json(
        { error: "tableName, recordId, fileName, and base64Data are required." },
        { status: 400 }
      );
    }
    if (base64Data.length > MAX_ATTACHMENT_BASE64_CHARS) {
      return NextResponse.json(
        { error: `Attachment exceeds the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit.` },
        { status: 413 }
      );
    }

    // Employees may only attach files to tickets they requested (or to non-ticket records like catalog forms)
    const relation = await getTaskRelation(session.user.id, recordId);
    if (relation.isTask && !relation.isRequester && !isFulfiller(session)) {
      return NextResponse.json({ error: "You can only attach files to your own tickets" }, { status: 403 });
    }

    // Size is computed from the data, never trusted from the client
    const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
    const byteSize = Math.max(0, Math.floor((base64Data.length * 3) / 4) - padding);

    const attachment = await db.sysAttachment.create({
      data: {
        tableName,
        recordId,
        fileName,
        contentType,
        byteSize,
        base64Data,
        uploadedById: session.user.id,
        uploadedByName: session.user.name,
      },
    });

    // Also log an activity note if this belongs to a task
    if (relation.isTask) {
      await db.activityNote.create({
        data: {
          taskId: recordId,
          noteType: "work_note",
          content: `📎 Attached file: ${fileName} (${Math.round((attachment.byteSize / 1024) * 10) / 10} KB)`,
          authorId: session.user.id,
        },
      });
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
