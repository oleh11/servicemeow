import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateSet = await db.sysUpdateSet.findUnique({
      where: { id },
    });

    if (!updateSet) {
      return NextResponse.json({ error: "Update set not found" }, { status: 404 });
    }

    return NextResponse.json({ result: updateSet });
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

    if (body.isCurrent || body.state === "in_progress") {
      const { setActiveUpdateSet } = await import("@/lib/update-set");
      await setActiveUpdateSet(id);
    }

    const updated = await db.sysUpdateSet.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.application !== undefined ? { application: body.application } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.isCurrent !== undefined ? { isCurrent: body.isCurrent } : {}),
      },
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
    await db.sysUpdateSet.delete({ where: { id } });
    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
