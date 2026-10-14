import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const script = await db.sysClientScript.findUnique({
      where: { id },
    });

    if (!script) {
      return NextResponse.json({ error: "Client script not found" }, { status: 404 });
    }

    return NextResponse.json({ result: script });
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

    const updated = await db.sysClientScript.update({
      where: { id },
      data: {
        name: body.name,
        tableName: body.tableName,
        type: body.type,
        fieldName: body.fieldName !== undefined ? body.fieldName : undefined,
        scriptBody: body.scriptBody,
        active: body.active !== undefined ? body.active : undefined,
        description: body.description !== undefined ? body.description : undefined,
      },
    });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script_client",
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
    const script = await db.sysClientScript.findUnique({ where: { id } });

    if (!script) {
      return NextResponse.json({ error: "Client script not found" }, { status: 404 });
    }

    await db.sysClientScript.delete({ where: { id } });

    // Record in active Update Set
    await recordUpdateChange({
      type: "sys_script_client",
      action: "delete",
      recordId: id,
      name: script.name,
      data: script,
    });

    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
