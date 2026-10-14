import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await db.sysApp.findUnique({
      where: { id },
      include: {
        applicationMenus: {
          include: { modules: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ result: app });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.sysApp.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.version !== undefined ? { version: body.version } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.vendor !== undefined ? { vendor: body.vendor } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
      include: { applicationMenus: true },
    });

    await recordUpdateChange({
      type: "sys_app",
      action: "update",
      recordId: updated.id,
      name: updated.name,
      data: updated,
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.sysApp.findUnique({ where: { id } });

    if (existing) {
      await db.sysApp.delete({ where: { id } });

      await recordUpdateChange({
        type: "sys_app",
        action: "delete",
        recordId: id,
        name: existing.name,
        data: existing,
      });
    }

    return NextResponse.json({ result: { success: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
