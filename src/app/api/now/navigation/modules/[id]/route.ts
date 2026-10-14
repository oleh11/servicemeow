import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moduleItem = await db.sysAppModule.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!moduleItem) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({ result: moduleItem });
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

    const updated = await db.sysAppModule.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.order !== undefined ? { order: Number(body.order) } : {}),
        ...(body.roles !== undefined ? { roles: body.roles } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.linkType !== undefined ? { linkType: body.linkType } : {}),
        ...(body.tableName !== undefined ? { tableName: body.tableName } : {}),
        ...(body.filterQuery !== undefined ? { filterQuery: body.filterQuery } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
      },
      include: { application: true },
    });

    await recordUpdateChange({
      type: "sys_app_module",
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
    const existing = await db.sysAppModule.findUnique({ where: { id } });

    if (existing) {
      await db.sysAppModule.delete({ where: { id } });

      await recordUpdateChange({
        type: "sys_app_module",
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
