import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createDbSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { GET as getWatchtower } from "@/app/api/now/watchtower/route";
import {
  GET as getMorningChecks,
  POST as postMorningCheck,
} from "@/app/api/now/morning-checks/route";
import {
  PATCH as patchMorningCheck,
  DELETE as deleteMorningCheck,
} from "@/app/api/now/morning-checks/[id]/route";

describe("Watchtower Attention Cockpit & Shift Morning Checks Operational Rounds", () => {
  let adminToken: string;
  let adminUserId: string;

  const createdCheckIds: string[] = [];
  const createdIncidentIds: string[] = [];

  beforeAll(async () => {
    let admin = await db.user.findFirst({ where: { role: "admin" } });
    if (!admin) {
      admin = await db.user.create({
        data: {
          userName: "watchtower_admin",
          name: "Watchtower Admin",
          email: "watchtower@servicemeow.local",
          role: "admin",
          passwordHash: "mock_hash",
        },
      });
    }
    adminUserId = admin.id;
    const sessionRes = await createDbSession(adminUserId);
    adminToken = sessionRes.token;
  });

  afterAll(async () => {
    if (createdCheckIds.length > 0) {
      await db.cmnMorningCheck.deleteMany({
        where: { id: { in: createdCheckIds } },
      });
    }
    if (createdIncidentIds.length > 0) {
      await db.incident.deleteMany({
        where: { taskId: { in: createdIncidentIds } },
      });
      await db.task.deleteMany({
        where: { id: { in: createdIncidentIds } },
      });
    }
  });

  const makeAuthRequest = (url: string, method: string, body?: any) => {
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "x-user-role": "admin",
        "x-user-id": adminUserId,
      },
    };
    if (body) {
      init.body = JSON.stringify(body);
    }
    return new NextRequest(url, init);
  };

  it("calculates real-time operational health index and attention streams in Watchtower", async () => {
    const req = makeAuthRequest("http://localhost:3000/api/now/watchtower", "GET");
    const res = await getWatchtower(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.metrics).toBeDefined();
    expect(typeof data.metrics.healthScore).toBe("number");
    expect(data.metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(data.metrics.healthScore).toBeLessThanOrEqual(100);

    expect(data.attentionStreams).toBeDefined();
    expect(Array.isArray(data.attentionStreams.criticalIncidents)).toBe(true);
    expect(Array.isArray(data.attentionStreams.breachingSlas)).toBe(true);
    expect(Array.isArray(data.attentionStreams.pendingApprovals)).toBe(true);
    expect(Array.isArray(data.attentionStreams.activeProblems)).toBe(true);
    expect(Array.isArray(data.attentionStreams.degradedCis)).toBe(true);
    expect(Array.isArray(data.attentionStreams.failingMorningChecks)).toBe(true);
  });

  it("performs operational rounds: creates, inspects, updates status, and escalates to Incident", async () => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Create a morning check for Datacenter UPS & Generator
    const postReq = makeAuthRequest("http://localhost:3000/api/now/morning-checks", "POST", {
      title: "DC-01 Backup Diesel Generator & ATS Transfer Switch",
      category: "DATACENTER",
      shift: "MORNING",
      checkDate: today,
      status: "PENDING",
      notes: "Verify fuel level > 90% and ATS battery voltage nominal.",
    });
    const postRes = await postMorningCheck(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    const checkId = postData.check.id;
    createdCheckIds.push(checkId);

    // 2. Query morning checks for today
    const getReq = makeAuthRequest(
      `http://localhost:3000/api/now/morning-checks?date=${today}&shift=MORNING&category=DATACENTER`,
      "GET"
    );
    const getRes = await getMorningChecks(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    const found = getData.checks.find((c: any) => c.id === checkId);
    expect(found).toBeDefined();
    expect(found.title).toBe("DC-01 Backup Diesel Generator & ATS Transfer Switch");
    expect(found.status).toBe("PENDING");

    // 3. Mark check as FAIL due to battery voltage drop
    const patchReq = makeAuthRequest(
      `http://localhost:3000/api/now/morning-checks/${checkId}`,
      "PATCH",
      {
        status: "FAIL",
        notes: "ATS Battery charger fault: Voltage dropped to 10.8V. Generator cannot crank automatically.",
        inspectedById: adminUserId,
      }
    );
    const patchRes = await patchMorningCheck(patchReq, {
      params: Promise.resolve({ id: checkId }),
    });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.check.status).toBe("FAIL");

    // 4. 1-Click Escalate to Critical Incident
    const escalateReq = makeAuthRequest(
      `http://localhost:3000/api/now/morning-checks/${checkId}`,
      "PATCH",
      {
        escalateToIncident: true,
        incidentPayload: {
          short_description: "CRITICAL: DC-01 Generator ATS Charger Fault",
          description: "ATS battery voltage low. Emergency maintenance dispatch required immediately.",
          priority: 1,
          impact: 1,
          urgency: 1,
          category: "datacenter",
        },
      }
    );
    const escalateRes = await patchMorningCheck(escalateReq, {
      params: Promise.resolve({ id: checkId }),
    });
    expect(escalateRes.status).toBe(200);
    const escalateData = await escalateRes.json();
    expect(escalateData.check.incidentId).toBeDefined();
    expect(escalateData.incident).toBeDefined();
    expect(escalateData.incident.task.priority).toBe(1);
    createdIncidentIds.push(escalateData.incident.taskId || escalateData.incident.id);

    // 5. Verify the check is now linked to the incident in the database
    const dbCheck = await db.cmnMorningCheck.findUnique({
      where: { id: checkId },
    });
    expect(dbCheck?.incidentId).toBe(escalateData.incident.id);
    const dbInc = await db.incident.findUnique({
      where: { id: escalateData.incident.id },
      include: { task: true },
    });
    expect(dbInc?.task.priority).toBe(1);
  });
});
