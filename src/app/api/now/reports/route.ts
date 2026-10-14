import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const reports = await db.sysReport.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tableName, chartType, groupByField, filterQuery, roles, colorPalette } = body;

    if (!name || !tableName || !groupByField) {
      return NextResponse.json(
        { error: "name, tableName, and groupByField are required." },
        { status: 400 }
      );
    }

    const report = await db.sysReport.create({
      data: {
        name,
        tableName: tableName || "incident",
        chartType: chartType || "bar",
        groupByField: groupByField || "priority",
        filterQuery: filterQuery || null,
        roles: roles || "itil,admin",
        colorPalette: colorPalette || "polaris",
      },
    });

    return NextResponse.json({ result: report }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
