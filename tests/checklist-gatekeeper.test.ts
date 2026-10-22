import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createDbSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { GET as getTable, POST as postTable } from "@/app/api/now/table/[table]/route";
import {
  GET as getRecord,
  PATCH as patchRecord,
  DELETE as deleteRecord,
} from "@/app/api/now/table/[table]/[id]/route";

describe("Mandatory SOP Checklist & Hermes Evidence Gatekeeper Engine", () => {
  let adminToken: string;
  let adminUserId: string;

  const createdTaskIds: string[] = [];
  const createdChecklistIds: string[] = [];
  const createdEvidenceIds: string[] = [];

  beforeAll(async () => {
    let admin = await db.user.findFirst({ where: { role: "admin" } });
    if (!admin) {
      admin = await db.user.create({
        data: {
          userName: "gatekeeper_admin",
          name: "Gatekeeper Administrator",
          email: "gatekeeper@servicemeow.local",
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
    // Cleanup evidence
    if (createdEvidenceIds.length > 0) {
      await db.taskEvidence.deleteMany({
        where: { id: { in: createdEvidenceIds } },
      });
    }

    // Cleanup checklist items
    if (createdChecklistIds.length > 0) {
      await db.taskChecklistItem.deleteMany({
        where: { id: { in: createdChecklistIds } },
      });
    }

    // Cleanup tasks
    if (createdTaskIds.length > 0) {
      await db.incident.deleteMany({
        where: { taskId: { in: createdTaskIds } },
      });
      await db.task.deleteMany({
        where: { id: { in: createdTaskIds } },
      });
    }
  });

  const makeAuthRequest = (url: string, method: string, body?: any) => {
    return new NextRequest(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "x-user-role": "admin",
        "x-user-id": adminUserId,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  };

  it("enforces SOP gatekeeper: blocks task resolution when mandatory checklist items are incomplete", async () => {
    // 1. Create an incident task
    const postTaskReq = makeAuthRequest("http://localhost:3000/api/now/table/incident", "POST", {
      short_description: "Core Redis cluster memory saturation incident",
      description: "Incident to test mandatory SOP gatekeeper verification.",
      priority: 1,
      state: 1, // New
    });
    const postTaskRes = await postTable(postTaskReq, { params: Promise.resolve({ table: "incident" }) });
    expect(postTaskRes.status).toBe(201);
    const taskData = await postTaskRes.json();
    const taskId = taskData.result.sys_id;
    createdTaskIds.push(taskId);

    // 2. Add a Mandatory Checklist Item (incomplete)
    const postCheckReq = makeAuthRequest("http://localhost:3000/api/now/table/task_checklist_item", "POST", {
      task_id: taskId,
      title: "Verify Redis memory defragmentation completes with zero keyspace loss",
      is_mandatory: true,
      order: 1,
    });
    const postCheckRes = await postTable(postCheckReq, { params: Promise.resolve({ table: "task_checklist_item" }) });
    expect(postCheckRes.status).toBe(201);
    const checkData = await postCheckRes.json();
    const checkId = checkData.result.sys_id;
    createdChecklistIds.push(checkId);

    // 3. Attempt to transition task to State 6 (Resolved) without completing mandatory item
    const patchReq = makeAuthRequest(`http://localhost:3000/api/now/table/incident/${taskId}`, "PATCH", {
      state: 6, // Resolved
      close_notes: "Attempted early resolution without running defragmentation check.",
    });
    const patchRes = await patchRecord(patchReq, { params: Promise.resolve({ table: "incident", id: taskId }) });

    // Gatekeeper MUST halt transition with HTTP 422 Unprocessable Entity
    expect(patchRes.status).toBe(422);
    const errJson = await patchRes.json();
    expect(errJson.error).toBe("MANDATORY_CHECKLIST_INCOMPLETE");
    expect(errJson.incomplete_items).toContain(
      "Verify Redis memory defragmentation completes with zero keyspace loss"
    );

    // 4. Verify in DB that state was NOT changed
    const taskInDb = await db.task.findUnique({ where: { id: taskId } });
    expect(taskInDb?.state).toBe(1);

    // 5. Complete the mandatory checklist item
    const completeCheckReq = makeAuthRequest(
      `http://localhost:3000/api/now/table/task_checklist_item/${checkId}`,
      "PATCH",
      {
        is_completed: true,
        completed_by_id: adminUserId,
      }
    );
    const completeCheckRes = await patchRecord(completeCheckReq, {
      params: Promise.resolve({ table: "task_checklist_item", id: checkId }),
    });
    expect(completeCheckRes.status).toBe(200);

    // 6. Attempt resolution again — should now succeed cleanly!
    const patchSuccessReq = makeAuthRequest(`http://localhost:3000/api/now/table/incident/${taskId}`, "PATCH", {
      state: 6,
      close_notes: "Defragmentation verified complete. Redis memory footprint normalized.",
    });
    const patchSuccessRes = await patchRecord(patchSuccessReq, {
      params: Promise.resolve({ table: "incident", id: taskId }),
    });
    expect(patchSuccessRes.status).toBe(200);

    const resolvedTaskInDb = await db.task.findUnique({ where: { id: taskId } });
    expect(resolvedTaskInDb?.state).toBe(6);
  });

  it("permits resolution when incomplete items are non-mandatory (optional)", async () => {
    // 1. Create a task
    const postTaskReq = makeAuthRequest("http://localhost:3000/api/now/table/incident", "POST", {
      short_description: "Non-critical batch export delayed",
      priority: 4,
      state: 1,
    });
    const postTaskRes = await postTable(postTaskReq, { params: Promise.resolve({ table: "incident" }) });
    const taskData = await postTaskRes.json();
    const taskId = taskData.result.sys_id;
    createdTaskIds.push(taskId);

    // 2. Add an OPTIONAL checklist item (is_mandatory: false)
    const postCheckReq = makeAuthRequest("http://localhost:3000/api/now/table/task_checklist_item", "POST", {
      task_id: taskId,
      title: "Archive export logs to long-term S3 bucket (optional step)",
      is_mandatory: false,
      order: 1,
    });
    const postCheckRes = await postTable(postCheckReq, { params: Promise.resolve({ table: "task_checklist_item" }) });
    const checkData = await postCheckRes.json();
    createdChecklistIds.push(checkData.result.sys_id);

    // 3. Resolve task with optional item still incomplete — MUST succeed!
    const patchReq = makeAuthRequest(`http://localhost:3000/api/now/table/incident/${taskId}`, "PATCH", {
      state: 6,
      close_notes: "Batch export reran manually.",
    });
    const patchRes = await patchRecord(patchReq, { params: Promise.resolve({ table: "incident", id: taskId }) });
    expect(patchRes.status).toBe(200);

    const taskInDb = await db.task.findUnique({ where: { id: taskId } });
    expect(taskInDb?.state).toBe(6);
  });

  it("creates, logs, and verifies Hermes AI diagnostic evidence records", async () => {
    // 1. Create task
    const postTaskReq = makeAuthRequest("http://localhost:3000/api/now/table/incident", "POST", {
      short_description: "Postgres connection pool maxed at 500 connections",
      priority: 2,
    });
    const postTaskRes = await postTable(postTaskReq, { params: Promise.resolve({ table: "incident" }) });
    const taskData = await postTaskRes.json();
    const taskId = taskData.result.sys_id;
    createdTaskIds.push(taskId);

    // 2. Log diagnostic evidence
    const postEvidenceReq = makeAuthRequest("http://localhost:3000/api/now/table/task_evidence", "POST", {
      task_id: taskId,
      evidence_kind: "log.stacktrace",
      is_decisive: true,
      confidence_score: 0.98,
      observation_summary: "FATAL: remaining connection slots reserved for non-replication superuser",
      raw_evidence_payload: "org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved\n  at com.zaxxer.hikari.pool.PoolBase.newConnection(PoolBase.java:364)",
      proposed_fact_field: "workaround",
      proposed_fact_value: "Restart PgBouncer connection pooler daemon and flush idle leases",
    });
    const postEvidenceRes = await postTable(postEvidenceReq, {
      params: Promise.resolve({ table: "task_evidence" }),
    });
    expect(postEvidenceRes.status).toBe(201);
    const evidenceData = await postEvidenceRes.json();
    const evidenceId = evidenceData.result.sys_id;
    createdEvidenceIds.push(evidenceId);

    // 3. Retrieve evidence via GET
    const getEvidenceReq = makeAuthRequest(
      `http://localhost:3000/api/now/table/task_evidence?sysparm_query=task_id=${taskId}`,
      "GET"
    );
    const getEvidenceRes = await getTable(getEvidenceReq, {
      params: Promise.resolve({ table: "task_evidence" }),
    });
    expect(getEvidenceRes.status).toBe(200);
    const getJson = await getEvidenceRes.json();
    expect(getJson.result.length).toBe(1);
    expect(getJson.result[0].evidenceKind).toBe("log.stacktrace");
    expect(getJson.result[0].isDecisive).toBe(true);

    // 4. Operator accepts fact
    const patchEvidenceReq = makeAuthRequest(
      `http://localhost:3000/api/now/table/task_evidence/${evidenceId}`,
      "PATCH",
      {
        is_accepted: true,
        decided_by_id: adminUserId,
      }
    );
    const patchEvidenceRes = await patchRecord(patchEvidenceReq, {
      params: Promise.resolve({ table: "task_evidence", id: evidenceId }),
    });
    expect(patchEvidenceRes.status).toBe(200);
    const patchJson = await patchEvidenceRes.json();
    expect(patchJson.result.isAccepted).toBe(true);

    const evidenceInDb = await db.taskEvidence.findUnique({ where: { id: evidenceId } });
    expect(evidenceInDb?.status).toBe("accepted");
    expect(evidenceInDb?.decidedById).toBe(adminUserId);
  });
});
