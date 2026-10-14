import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await db.sysAppApplication.findUnique({
      where: { id },
      include: {
        app: true,
        modules: { orderBy: { order: "asc" } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application menu not found" }, { status: 404 });
    }

    return NextResponse.json({ result: application });
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

    const updated = await db.sysAppApplication.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.roles !== undefined ? { roles: body.roles } : {}),
        ...(body.order !== undefined ? { order: Number(body.order) } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.appId !== undefined ? { appId: body.appId } : {}),
      },
      include: { modules: true, app: true },
    });

    // Capture modification in currently active Update Set
    await recordUpdateChange({
      type: "sys_app_application",
      action: "update",
      recordId: updated.id,
      name: updated.title,
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
    const existing = await db.sysAppApplication.findUnique({ where: { id } });

    if (existing) {
      await db.sysAppApplication.delete({ where: { id } });

      await recordUpdateChange({
        type: "sys_app_application",
        action: "delete",
        recordId: id,
        name: existing.title,
        data: existing,
      });
    }

    return NextResponse.json({ result: { success: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
