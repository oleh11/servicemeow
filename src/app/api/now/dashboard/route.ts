import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const windowParam = searchParams.get("window") || "7d";

    const now = new Date();
    let startDate: Date;
    if (windowParam === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (windowParam === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // 7d default
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. KPI Metrics
    const [
      totalOpenTasks,
      criticalP1s,
      allSlas,
      resolvedToday,
      unassignedOpen,
      incidentsInWindow,
      allIncidentsByState,
    ] = await Promise.all([
      db.task.count({
        where: { state: { in: [1, 2, 3] } },
      }),
      db.task.count({
        where: { state: { in: [1, 2, 3] }, priority: 1 },
      }),
      db.slaInstance.findMany({
        include: { slaDefinition: true },
      }),
      db.task.count({
        where: {
          state: { in: [6, 7] },
          updatedAt: { gte: todayStart },
        },
      }),
      db.task.count({
        where: { state: { in: [1, 2, 3] }, assignedToId: null },
      }),
      db.task.findMany({
        where: {
          sysClassName: "incident",
          createdAt: { gte: startDate },
        },
        include: { incident: true },
      }),
      db.task.findMany({
        where: {
          sysClassName: "incident",
        },
        include: { incident: true },
      }),
    ]);

    // SLA At-Risk count: in_progress with < 60 mins remaining or > 75% elapsed
    let slaAtRisk = 0;
    let achievedSlas = 0;
    let breachedSlas = 0;

    for (const sla of allSlas) {
      if (sla.state === "achieved") achievedSlas++;
      else if (sla.state === "breached") breachedSlas++;
      else if (sla.state === "in_progress") {
        const totalDuration = sla.breachTime.getTime() - sla.startTime.getTime();
        const elapsed = now.getTime() - sla.startTime.getTime();
        const remainingMs = sla.breachTime.getTime() - now.getTime();
        if (remainingMs <= 0) {
          breachedSlas++;
        } else if (remainingMs < 60 * 60 * 1000 || (totalDuration > 0 && elapsed / totalDuration >= 0.75)) {
          slaAtRisk++;
        }
      }
    }

    const totalFinishedSlas = achievedSlas + breachedSlas;
    const slaCompliancePercent = totalFinishedSlas > 0
      ? Math.round((achievedSlas / totalFinishedSlas) * 1000) / 10
      : 100;

    // Incidents by Priority (P1 - P5)
    const priorityCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    incidentsInWindow.forEach((inc) => {
      if (priorityCounts[inc.priority] !== undefined) {
        priorityCounts[inc.priority]++;
      } else {
        priorityCounts[3]++;
      }
    });

    // Incidents by State: 1 (New), 2 (In Progress), 3 (On Hold), 6 (Resolved), 7 (Closed)
    const stateCounts: Record<string, number> = {
      New: 0,
      "In Progress": 0,
      "On Hold": 0,
      Resolved: 0,
      Closed: 0,
    };
    allIncidentsByState.forEach((inc) => {
      if (inc.state === 1) stateCounts["New"]++;
      else if (inc.state === 2) stateCounts["In Progress"]++;
      else if (inc.state === 3) stateCounts["On Hold"]++;
      else if (inc.state === 6) stateCounts["Resolved"]++;
      else if (inc.state === 7) stateCounts["Closed"]++;
    });

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    incidentsInWindow.forEach((inc) => {
      const cat = inc.incident?.category || "inquiry";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return NextResponse.json({
      result: {
        window: windowParam,
        kpi: {
          totalOpenTasks,
          criticalP1s,
          slaAtRisk,
          resolvedToday,
          unassignedOpen,
        },
        charts: {
          priorities: [
            { label: "P1 - Critical", priority: 1, count: priorityCounts[1], color: "#ef4444" },
            { label: "P2 - High", priority: 2, count: priorityCounts[2], color: "#f97316" },
            { label: "P3 - Moderate", priority: 3, count: priorityCounts[3], color: "#eab308" },
            { label: "P4 - Low", priority: 4, count: priorityCounts[4], color: "#3b82f6" },
            { label: "P5 - Planning", priority: 5, count: priorityCounts[5], color: "#64748b" },
          ],
          states: [
            { label: "New", count: stateCounts["New"], color: "#3b82f6" },
            { label: "In Progress", count: stateCounts["In Progress"], color: "#10b981" },
            { label: "On Hold", count: stateCounts["On Hold"], color: "#f59e0b" },
            { label: "Resolved", count: stateCounts["Resolved"], color: "#6366f1" },
            { label: "Closed", count: stateCounts["Closed"], color: "#475569" },
          ],
          categories: Object.entries(categoryCounts).map(([cat, count]) => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            count,
          })),
          sla: {
            compliancePercent: slaCompliancePercent,
            achieved: achievedSlas,
            breached: breachedSlas,
            atRisk: slaAtRisk,
          },
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
