import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const include = await db.sysScriptInclude.findUnique({
      where: { id },
    });
    if (!include) {
      return NextResponse.json({ error: "Script Include not found" }, { status: 404 });
    }
    return NextResponse.json({ result: include });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const updated = await db.sysScriptInclude.update({
      where: { id },
      data: {
        name: body.name,
        apiName: body.apiName,
        script: body.script,
        clientCallable: body.clientCallable !== undefined ? Boolean(body.clientCallable) : undefined,
        description: body.description,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "sys_script_include",
      action: "update",
      recordId: updated.id,
      name: updated.name,
      data: updated,
    });

    return NextResponse.json({ result: updated });
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
    await requireAdmin(request);
    const { id } = await params;
    const existing = await db.sysScriptInclude.findUnique({ where: { id } });
    if (existing) {
      await db.sysScriptInclude.delete({ where: { id } });
      const { recordUpdateChange } = await import("@/lib/update-set");
      await recordUpdateChange({
        type: "sys_script_include",
        action: "delete",
        recordId: id,
        name: existing.name,
        data: existing,
      });
    }
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
