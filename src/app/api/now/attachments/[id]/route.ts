import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { canViewAttachment } from "@/lib/attachment-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const attachment = await db.sysAttachment.findUnique({
      where: { id },
    });

    // Same 404 whether missing or not visible, so ids can't be probed
    if (!attachment || !(await canViewAttachment(session, attachment))) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json({ result: attachment });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const attachment = await db.sysAttachment.findUnique({ where: { id } });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Only admin or the original uploader can delete an attachment
    if (!session.isAdmin && session.user.id !== attachment.uploadedById) {
      return NextResponse.json({ error: "Forbidden: Cannot delete this attachment" }, { status: 403 });
    }

    await db.sysAttachment.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
