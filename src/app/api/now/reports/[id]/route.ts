import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.sysReport.findUnique({
      where: { id },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ result: report });
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

    const updated = await db.sysReport.update({
      where: { id },
      data: {
        name: body.name,
        tableName: body.tableName,
        chartType: body.chartType,
        groupByField: body.groupByField,
        filterQuery: body.filterQuery,
        roles: body.roles,
        colorPalette: body.colorPalette,
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
    await db.sysReport.delete({ where: { id } });
    return NextResponse.json({ result: { deleted: true, id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
