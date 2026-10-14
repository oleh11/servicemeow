import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const producer = await db.sysRecordProducer.findUnique({
      where: { id },
      include: {
        variables: {
          orderBy: { order: "asc" },
        },
        uiPolicies: {
          include: { actions: true },
        },
      },
    });

    if (!producer) {
      return NextResponse.json({ error: "Record Producer not found" }, { status: 404 });
    }

    return NextResponse.json({ result: producer });
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

    const updated = await db.sysRecordProducer.update({
      where: { id },
      data: {
        name: body.name,
        shortDescription: body.shortDescription,
        description: body.description,
        category: body.category,
        targetTable: body.targetTable,
        producerScript: body.producerScript,
        redirectUrl: body.redirectUrl,
        icon: body.icon,
        active: body.active,
      },
      include: {
        variables: { orderBy: { order: "asc" } },
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
    await db.sysRecordProducer.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
