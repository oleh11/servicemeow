import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);

    let table = "incident";
    let groupField = "priority";
    let report: any = null;

    if (id === "adhoc") {
      table = (url.searchParams.get("table") || "incident").toLowerCase();
      groupField = url.searchParams.get("group_by") || "priority";
    } else {
      report = await db.sysReport.findUnique({
        where: { id },
      });

      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      table = report.tableName.toLowerCase();
      groupField = report.groupByField || "priority";
    }

    // Fetch records
    let records: any[] = [];
    if (table === "incident") {
      const incs = await db.incident.findMany({
        include: { task: true },
      });
      records = incs.map((i) => ({
        ...i,
        ...i.task,
        priority: String(i.task?.priority ?? "3"),
        state: String(i.task?.state ?? "1"),
      }));
    } else if (table === "change_request") {
      const chgs = await db.changeRequest.findMany({
        include: { task: true },
      });
      records = chgs.map((c) => ({
        ...c,
        ...c.task,
        priority: String(c.task?.priority ?? "3"),
        state: String(c.task?.state ?? "1"),
      }));
    } else if (table === "task") {
      records = await db.task.findMany();
    } else if (table === "cmdb_ci") {
      records = await db.configurationItem.findMany();
    } else {
      const customs = await db.sysCustomRecord.findMany({
        where: { tableName: table },
      });
      records = customs.map((c) => {
        try {
          return { id: c.id, ...JSON.parse(c.dataJson) };
        } catch {
          return { id: c.id };
        }
      });
    }

    // Dynamic grouping count
    const countsMap: Record<string, number> = {};
    for (const rec of records) {
      const keyVal = rec[groupField] !== undefined && rec[groupField] !== null ? String(rec[groupField]) : "Unspecified";
      countsMap[keyVal] = (countsMap[keyVal] || 0) + 1;
    }

    const aggregated = Object.entries(countsMap).map(([key, count]) => ({
      label: key,
      value: count,
      count: count,
    }));

    return NextResponse.json({
      result: {
        report,
        totalRecords: records.length,
        data: aggregated,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
