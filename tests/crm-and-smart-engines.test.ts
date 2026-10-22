import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { autoAssignTask } from "@/lib/assignment-engine";
import { evaluateChangeRisk } from "@/lib/change-risk-engine";
import { POST as handleDraftResponse } from "@/app/api/now/ai/draft-response/route";
import { NextRequest } from "next/server";
import { signSessionToken } from "@/lib/auth-token";

describe("CRM, Auto-Assignment & Change Risk Engines", () => {
  let adminUser: any;
  let itilUser: any;
  let testGroup: any;
  let testTask: any;
  let adminSessionCookie: string;

  beforeEach(async () => {
    // Lookup admin and itil users
    adminUser = await db.user.findFirst({ where: { role: "admin" } });
    itilUser = await db.user.findFirst({ where: { role: "itil" } });

    // Lookup an assignment group
    testGroup = await db.group.findFirst();

    // Create a base incident task for testing
    const testNum = Math.floor(Math.random() * 800000 + 100000);
    testTask = await db.task.create({
      data: {
        number: `INC_CRM_${testNum}`,
        sysClassName: "incident",
        shortDescription: "Core Gateway Fiber Switch BGP Session Dropped",
        description: "Primary fiber uplink to ISP dropped 100% of packets during routine BGP refresh.",
        priority: 1,
        impact: 1,
        urgency: 1,
        state: 1,
        assignmentGroupId: testGroup?.id,
      },
    });

    await db.incident.create({
      data: {
        taskId: testTask.id,
        category: "network",
        severity: 1,
        callerName: "Dr. Catherine Howard",
        callerEmail: "catherine.howard@acmehealth.com",
      },
    });

    const session = await db.sysUserSession.create({
      data: {
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    const token = await signSessionToken({
      sessionId: session.id,
      userId: adminUser.id,
      role: adminUser.role,
      impersonatedUserId: null,
      exp: Date.now() + 86400000,
    });
    adminSessionCookie = `servicemeow_session=${token}`;
  });

  // 1. CRM Lifecycle Tests
  it("creates, queries, and updates CRM Organizations, Contacts, and Deals", async () => {
    // Create Organization
    const org = await db.crmOrganization.create({
      data: {
        name: `Cyberdyne Systems ${Date.now()}`,
        domain: "cyberdyne.net",
        industry: "Autonomous Robotics",
        tier: "enterprise",
        status: "active",
        healthScore: 99,
        assignedToId: adminUser.id,
      },
    });
    expect(org.id).toBeDefined();
    expect(org.healthScore).toBe(99);

    // Create Contact
    const contact = await db.crmContact.create({
      data: {
        firstName: "Miles",
        lastName: "Dyson",
        name: "Dr. Miles Dyson",
        email: `miles.dyson.${Date.now()}@cyberdyne.net`,
        title: "Director of Special Projects",
        isPrimary: true,
        organizationId: org.id,
      },
    });
    expect(contact.id).toBeDefined();
    expect(contact.organizationId).toBe(org.id);

    // Create Deal
    const deal = await db.crmDeal.create({
      data: {
        title: "Neural Net Processor CAD Floorplan Project",
        amount: 350000.0,
        stage: "proposal",
        probability: 60,
        organizationId: org.id,
        contactId: contact.id,
        assignedToId: adminUser.id,
      },
    });
    expect(deal.id).toBeDefined();
    expect(deal.amount).toBe(350000.0);
    expect(deal.stage).toBe("proposal");

    // Advance Deal Stage
    const updatedDeal = await db.crmDeal.update({
      where: { id: deal.id },
      data: { stage: "won", probability: 100 },
    });
    expect(updatedDeal.stage).toBe("won");
    expect(updatedDeal.probability).toBe(100);

    // Verify Organization Relations
    const fetchedOrg = await db.crmOrganization.findUnique({
      where: { id: org.id },
      include: { contacts: true, deals: true },
    });
    expect(fetchedOrg?.contacts.length).toBe(1);
    expect(fetchedOrg?.deals.length).toBe(1);
  });

  // 2. Automated Assignment Engine Tests (Frappe CRM pattern)
  it("auto-assigns tasks to active group members using load-balancing", async () => {
    if (!testGroup) return;

    // Ensure at least one member in the group
    let member = await db.userGroupMember.findFirst({
      where: { groupId: testGroup.id },
    });
    if (!member) {
      member = await db.userGroupMember.create({
        data: {
          groupId: testGroup.id,
          userId: itilUser.id,
        },
      });
    }

    const result = await autoAssignTask(testTask.id, testGroup.id);
    expect(result.assigned).toBe(true);
    expect(result.assignedToId).toBeDefined();

    // Verify task record was updated in database
    const assignedTask = await db.task.findUnique({
      where: { id: testTask.id },
      select: { assignedToId: true },
    });
    expect(assignedTask?.assignedToId).toBe(result.assignedToId);

    // Verify an automated assignment audit note was recorded
    const notes = await db.activityNote.findMany({
      where: { taskId: testTask.id },
    });
    const assignmentNote = notes.find((n) => n.content.includes("[Assignment Engine]"));
    expect(assignmentNote).toBeDefined();
  });

  // 3. AI Smart Response Drafting Engine Tests (CompAI CRM pattern)
  it("generates empathetic and technical customer draft replies based on ticket context", async () => {
    // Ingest diagnostic fact
    await db.taskEvidence.create({
      data: {
        taskId: testTask.id,
        claimField: "network.bgp_peer",
        claimValue: "AS65001 session flapping due to MTU mismatch",
        evidenceKind: "ci.ping_failure",
        rawObservation: "Synthetic probes show intermittent ICMP loss",
        status: "accepted",
      },
    });

    // Ingest an internal troubleshooting work note
    await db.activityNote.create({
      data: {
        taskId: testTask.id,
        authorId: adminUser.id,
        noteType: "work_note",
        content: "Core switch MTU clamped to 1500; BGP keepalives stabilizing.",
      },
    });

    // Request AI empathetic response draft
    const reqEmpathetic = new NextRequest("http://localhost:3000/api/now/ai/draft-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        taskId: testTask.id,
        tone: "empathetic",
      }),
    });

    const resEmpathetic = await handleDraftResponse(reqEmpathetic);
    expect(resEmpathetic.status).toBe(200);
    const dataEmpathetic = await resEmpathetic.json();
    expect(dataEmpathetic.result.draft).toContain("Dr. Catherine Howard");
    expect(dataEmpathetic.result.draft).toContain("Core Gateway Fiber Switch");
    expect(dataEmpathetic.result.draft).toContain("MTU mismatch");

    // Request AI technical response draft
    const reqTechnical = new NextRequest("http://localhost:3000/api/now/ai/draft-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        taskId: testTask.id,
        tone: "technical",
      }),
    });

    const resTechnical = await handleDraftResponse(reqTechnical);
    expect(resTechnical.status).toBe(200);
    const dataTechnical = await resTechnical.json();
    expect(dataTechnical.result.draft).toContain("STATUS ADVISORY");
    expect(dataTechnical.result.draft).toContain("[VERIFIED]");
  });

  // 4. Change Risk Scoring & Collision Detection Tests (FreeITSM pattern)
  it("quantitatively assesses Change Request risk based on CI tier, emergency type, and duration", async () => {
    // Create a Mission Critical CI
    const criticalCi = await db.configurationItem.create({
      data: {
        name: `Core-Database-Cluster-${Date.now()}`,
        ciClass: "database",
        tier: "Tier 1 - Mission Critical",
        operationalStatus: "operational",
        status: "in_service",
      },
    });

    // 1. Standard low-risk change
    const lowRiskEval = await evaluateChangeRisk({
      changeType: "standard",
      cmdbCiId: criticalCi.id,
      plannedStart: new Date("2026-11-01T02:00:00Z"),
      plannedEnd: new Date("2026-11-01T03:00:00Z"), // 1 hour
    });
    expect(lowRiskEval.riskScore).toBeGreaterThanOrEqual(40);
    expect(lowRiskEval.factors.some((f) => f.factor === "CI_TIER_1_CRITICAL")).toBe(true);

    // 2. Emergency change with extended duration (> 24 hrs)
    const emergencyEval = await evaluateChangeRisk({
      changeType: "emergency",
      cmdbCiId: criticalCi.id,
      plannedStart: new Date("2026-11-01T00:00:00Z"),
      plannedEnd: new Date("2026-11-02T12:00:00Z"), // 36 hours
    });
    // Emergency (40) + Tier 1 (35) + >24h (25) = 100
    expect(emergencyEval.riskScore).toBe(100);
    expect(emergencyEval.riskLevel).toBe("very_high");
    expect(emergencyEval.cabRecommended).toBe(true);

    // 3. Collision detection between overlapping changes
    const changeTask1 = await db.task.create({
      data: {
        number: `CHG_COLL_${Math.floor(Math.random() * 800000 + 100000)}`,
        sysClassName: "change_request",
        shortDescription: "Kernel patching DB-01",
        state: 1, // New / Active
      },
    });
    const change1 = await db.changeRequest.create({
      data: {
        taskId: changeTask1.id,
        cmdbCiId: criticalCi.id,
        changeType: "normal",
        plannedStart: new Date("2026-11-05T10:00:00Z"),
        plannedEnd: new Date("2026-11-05T16:00:00Z"),
      },
    });

    // Evaluate second change targeting same CI during overlapping window
    const collidingEval = await evaluateChangeRisk({
      changeType: "normal",
      cmdbCiId: criticalCi.id,
      plannedStart: new Date("2026-11-05T12:00:00Z"),
      plannedEnd: new Date("2026-11-05T18:00:00Z"),
    });

    expect(collidingEval.conflictingChanges.length).toBeGreaterThan(0);
    expect(collidingEval.conflictingChanges[0].number).toBe(changeTask1.number);
    expect(collidingEval.factors.some((f) => f.factor === "CONCURRENT_CI_COLLISION")).toBe(true);
  });
});
