import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);

    // Parallel query attention streams
    const [
      criticalIncidents,
      unassignedIncidents,
      slaBreaches,
      pendingApprovals,
      activeProblems,
      degradedCis,
      failingMorningChecks,
      totalActiveIncidents,
    ] = await Promise.all([
      // 1. Critical P1 & High P2 Active Incidents
      db.task.findMany({
        where: {
          sysClassName: "incident",
          active: true,
          priority: { in: [1, 2] },
          state: { notIn: [6, 7, 8] },
        },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          assignmentGroup: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 10,
      }),

      // 2. Unassigned Active Incidents
      db.task.findMany({
        where: {
          sysClassName: "incident",
          active: true,
          assignedToId: null,
          state: { notIn: [6, 7, 8] },
        },
        include: {
          assignmentGroup: { select: { id: true, name: true } },
        },
        orderBy: { openedAt: "desc" },
        take: 10,
      }),

      // 3. SLA Breaching or Near-Breach
      db.slaInstance.findMany({
        where: {
          state: "in_progress",
          breachTime: { lte: oneHourAhead },
        },
        include: {
          task: {
            select: {
              id: true,
              number: true,
              shortDescription: true,
              priority: true,
              assignedTo: { select: { id: true, name: true } },
            },
          },
          slaDefinition: { select: { id: true, name: true, targetDurationMinutes: true } },
        },
        orderBy: { breachTime: "asc" },
        take: 10,
      }),

      // 4. Pending Change Approvals
      db.approvalRecord.findMany({
        where: {
          state: "requested",
        },
        include: {
          task: {
            select: {
              id: true,
              number: true,
              shortDescription: true,
              priority: true,
              changeRequest: { select: { risk: true, changeType: true } },
            },
          },
          approver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 5. Active Problems Requiring Root Cause or Workaround
      db.problem.findMany({
        where: {
          task: {
            active: true,
            state: { notIn: [6, 7, 8] },
          },
        },
        include: {
          task: {
            select: {
              id: true,
              number: true,
              shortDescription: true,
              priority: true,
              state: true,
              assignedTo: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { task: { createdAt: "desc" } },
        take: 10,
      }),

      // 6. Degraded or In-Maintenance CMDB Hardware
      db.configurationItem.findMany({
        where: {
          operationalStatus: { in: ["degraded", "in_maintenance", "retired", "non_operational"] },
        },
        select: {
          id: true,
          name: true,
          ciClass: true,
          operationalStatus: true,
          environment: true,
          ipAddress: true,
          rackUnitStart: true,
          rack: { select: { id: true, name: true } },
          space: { select: { id: true, name: true } },
        },
        take: 10,
      }),

      // 7. Failing or Degraded Morning Health Checks
      db.cmnMorningCheck.findMany({
        where: {
          status: { in: ["fail", "degraded", "FAIL", "DEGRADED"] },
        },
        include: {
          checkedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 8. Total Active Incidents Count
      db.task.count({
        where: {
          sysClassName: "incident",
          active: true,
          state: { notIn: [6, 7, 8] },
        },
      }),
    ]);

    // Calculate Operational Health Score (0-100)
    let healthScore = 100;
    healthScore -= criticalIncidents.length * 15;
    healthScore -= slaBreaches.filter((s) => new Date(s.breachTime) <= now).length * 10;
    healthScore -= failingMorningChecks.filter((m) => m.status.toLowerCase() === "fail").length * 10;
    healthScore -= degradedCis.length * 5;
    healthScore = Math.max(10, Math.min(100, healthScore));

    const metrics = {
      totalOpenIncidents: totalActiveIncidents,
      p1P2Incidents: criticalIncidents.length,
      breachingSlas: slaBreaches.length,
      pendingApprovals: pendingApprovals.length,
      activeProblemsWithoutWorkaround: activeProblems.filter((p) => !p.workaround).length,
      degradedCis: degradedCis.length,
      failingMorningChecks: failingMorningChecks.length,
      healthScore,
    };

    const attentionStreams = {
      criticalIncidents: criticalIncidents.map((inc) => ({
        id: inc.id,
        number: inc.number,
        shortDescription: inc.shortDescription,
        priority: inc.priority,
        state: inc.state,
        assignedTo: inc.assignedTo?.name || null,
        sysCreatedAt: inc.createdAt.toISOString(),
      })),
      breachingSlas: slaBreaches.map((sla) => {
        const breachDate = new Date(sla.breachTime);
        const timeRemainingHours = (breachDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const targetHours = (sla.slaDefinition?.targetDurationMinutes || 60) / 60;
        const percentRemaining = Math.max(
          0,
          Math.min(100, Math.round((timeRemainingHours / targetHours) * 100))
        );
        return {
          id: sla.id,
          taskNumber: sla.task?.number || "TASK",
          slaName: sla.slaDefinition?.name || "Incident SLA",
          targetHours,
          timeRemainingHours: Math.max(0, parseFloat(timeRemainingHours.toFixed(2))),
          percentRemaining,
        };
      }),
      pendingApprovals: pendingApprovals.map((app) => ({
        id: app.id,
        changeNumber: app.task?.number || "CHG",
        changeTitle: app.task?.shortDescription || "Change Request",
        requestedBy: app.approver?.name || app.approver?.email || "Requester",
        risk: app.task?.changeRequest?.risk || "Moderate",
        type: app.task?.changeRequest?.changeType || "Normal",
        sysCreatedAt: app.createdAt.toISOString(),
      })),
      activeProblems: activeProblems.map((prob) => ({
        id: prob.id,
        number: prob.task?.number || "PRB",
        shortDescription: prob.task?.shortDescription || "Problem",
        priority: prob.task?.priority || 2,
        hasWorkaround: Boolean(prob.workaround),
        hasRootCause: Boolean(prob.rootCause),
      })),
      degradedCis: degradedCis.map((ci) => ({
        id: ci.id,
        name: ci.name,
        category: ci.ciClass,
        status: ci.operationalStatus,
        ipAddress: ci.ipAddress || null,
        location: ci.space?.name || null,
      })),
      failingMorningChecks: failingMorningChecks.map((chk) => ({
        id: chk.id,
        title: chk.title,
        category: chk.category,
        status: chk.status.toUpperCase(),
        shift: chk.shift,
        inspectedBy: chk.checkedBy?.name || null,
        notes: chk.notes || null,
      })),
    };

    return NextResponse.json({
      metrics,
      attentionStreams,
      result: {
        timestamp: now.toISOString(),
        healthScore,
        counts: metrics,
        attentionStreams,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch Watchtower cockpit data" },
      { status: 500 }
    );
  }
}
