import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createDbSession, getServerSession } from "@/lib/auth";
import { POST as createRecord, GET as listRecords } from "@/app/api/now/table/[table]/route";
import {
  GET as getRecord,
  PATCH as patchRecord,
  DELETE as deleteRecord,
} from "@/app/api/now/table/[table]/[id]/route";
import { GET as getStatus, PATCH as patchStatus } from "@/app/api/now/service-status/route";
import { PATCH as patchReservation, DELETE as deleteReservation } from "@/app/api/now/reservations/[id]/route";
import { GET as listAttachments, POST as uploadAttachment } from "@/app/api/now/attachments/route";
import { GET as getAttachment } from "@/app/api/now/attachments/[id]/route";
import { POST as draftResponse } from "@/app/api/now/ai/draft-response/route";

const BASE = "http://localhost:3000";
const suffix = Date.now().toString(36);

describe("Authorization hardening", () => {
  let alice: any; // employee, requester of `aliceIncident`
  let bob: any; // another employee
  let agent: any; // itil fulfiller
  let aliceToken: string;
  let bobToken: string;
  let agentToken: string;
  let aliceIncident: any;
  let aclId: string;
  let reservationId: string | null = null;
  const taskIds: string[] = [];
  const attachmentIds: string[] = [];

  const req = (path: string, method: string, token?: string, body?: unknown) =>
    new NextRequest(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  const params = <T,>(p: T) => ({ params: Promise.resolve(p) });

  beforeAll(async () => {
    const mkUser = (name: string, role: string) =>
      db.user.create({
        data: { userName: `${name}_${suffix}`, name: `${name} ${suffix}`, email: `${name}_${suffix}@test.local`, role },
      });
    alice = await mkUser("alice", "employee");
    bob = await mkUser("bob", "employee");
    agent = await mkUser("agent", "itil");
    aliceToken = (await createDbSession(alice.id)).token;
    bobToken = (await createDbSession(bob.id)).token;
    agentToken = (await createDbSession(agent.id)).token;

    // The seed has no ACL rows; add the standard "incident writes need itil" rule for this test
    aclId = (
      await db.sysSecurityAcl.create({
        data: { name: `incident.write.test_${suffix}`, operation: "write", tableName: "incident", roleRequired: "itil" },
      })
    ).id;

    const res = await createRecord(
      req("/api/now/table/incident", "POST", aliceToken, { short_description: "Laptop broken", impact: 3, urgency: 3 }),
      params({ table: "incident" })
    );
    expect(res.status).toBe(201);
    const created = await res.json();
    aliceIncident = await db.task.findFirst({ where: { number: created.result.number } });
    taskIds.push(aliceIncident.id);
    await db.activityNote.create({
      data: { taskId: aliceIncident.id, noteType: "work_note", content: "internal: suspect user error", authorId: agent.id },
    });
  });

  afterAll(async () => {
    await db.sysAttachment.deleteMany({ where: { id: { in: attachmentIds } } });
    if (reservationId) await db.cmnReservation.deleteMany({ where: { id: reservationId } });
    await db.activityNote.deleteMany({ where: { taskId: { in: taskIds } } });
    await db.slaInstance.deleteMany({ where: { taskId: { in: taskIds } } });
    await db.incident.deleteMany({ where: { taskId: { in: taskIds } } });
    await db.changeRequest.deleteMany({ where: { taskId: { in: taskIds } } });
    await db.task.deleteMany({ where: { id: { in: taskIds } } });
    await db.sysSecurityAcl.deleteMany({ where: { id: aclId } });
    await db.user.deleteMany({ where: { id: { in: [alice.id, bob.id, agent.id] } } });
  });

  describe("service status", () => {
    it("rejects unauthenticated writes", async () => {
      const svc = await db.cmnService.findFirst();
      const res = await patchStatus(req("/api/now/service-status", "PATCH", undefined, { id: svc?.id, status: "major_outage" }));
      expect(res.status).toBe(401);
    });

    it("exposes only display fields of active incidents publicly", async () => {
      const res = await getStatus(req("/api/now/service-status", "GET"));
      const json = await res.json();
      for (const inc of json.result.activeIncidents) {
        expect(Object.keys(inc).sort()).toEqual(["id", "number", "priority", "shortDescription"]);
      }
    });
  });

  describe("table API record class checks", () => {
    it("blocks editing someone else's incident through /table/task", async () => {
      const res = await patchRecord(
        req(`/api/now/table/task/${aliceIncident.id}`, "PATCH", bobToken, { short_description: "pwned" }),
        params({ table: "task", id: aliceIncident.id })
      );
      expect(res.status).toBe(403);
    });

    it("blocks a requester from changing workflow fields through /table/task", async () => {
      const res = await patchRecord(
        req(`/api/now/table/task/${aliceIncident.id}`, "PATCH", aliceToken, { state: 7 }),
        params({ table: "task", id: aliceIncident.id })
      );
      expect(res.status).toBe(403);
    });

    it("lets the requester reply on their own ticket, attributed to them", async () => {
      const res = await patchRecord(
        req(`/api/now/table/task/${aliceIncident.id}`, "PATCH", aliceToken, {
          author_id: agent.id, // spoof attempt: should be ignored
          customer_comment: "Still broken",
        }),
        params({ table: "task", id: aliceIncident.id })
      );
      expect(res.status).toBe(200);
      const note = await db.activityNote.findFirst({
        where: { taskId: aliceIncident.id, noteType: "customer_comment" },
        orderBy: { createdAt: "desc" },
      });
      expect(note?.authorId).toBe(alice.id);
    });

    it("lets a fulfiller edit through /table/task", async () => {
      const res = await patchRecord(
        req(`/api/now/table/task/${aliceIncident.id}`, "PATCH", agentToken, { short_description: "Laptop broken (triaged)" }),
        params({ table: "task", id: aliceIncident.id })
      );
      expect(res.status).toBe(200);
    });

    it("returns 404 when the URL table doesn't match the record's class", async () => {
      const res = await patchRecord(
        req(`/api/now/table/problem/${aliceIncident.id}`, "PATCH", agentToken, { short_description: "x" }),
        params({ table: "problem", id: aliceIncident.id })
      );
      expect(res.status).toBe(404);
    });

    it("does not delete a record through an unrelated table name", async () => {
      const res = await deleteRecord(
        req(`/api/now/table/not_a_table/${aliceIncident.id}`, "DELETE", bobToken),
        params({ table: "not_a_table", id: aliceIncident.id })
      );
      expect(res.status).toBe(404);
      expect(await db.task.findUnique({ where: { id: aliceIncident.id } })).not.toBeNull();
    });

    it("hides work notes from employees but not from fulfillers", async () => {
      const asAlice = await (
        await getRecord(req(`/api/now/table/task/${aliceIncident.id}`, "GET", aliceToken), params({ table: "task", id: aliceIncident.id }))
      ).json();
      expect(asAlice.result.activityNotes.some((n: any) => n.noteType === "work_note")).toBe(false);

      const asAgent = await (
        await getRecord(req(`/api/now/table/task/${aliceIncident.id}`, "GET", agentToken), params({ table: "task", id: aliceIncident.id }))
      ).json();
      expect(asAgent.result.activityNotes.some((n: any) => n.noteType === "work_note")).toBe(true);
    });

    it("tolerates non-numeric pagination parameters", async () => {
      const res = await listRecords(
        req("/api/now/table/incident?sysparm_limit=abc&sysparm_offset=-5", "GET", agentToken),
        params({ table: "incident" })
      );
      expect(res.status).toBe(200);
    });
  });

  describe("create-time mass assignment", () => {
    it("ignores priority, assignment and caller set by an employee", async () => {
      const res = await createRecord(
        req("/api/now/table/incident", "POST", bobToken, {
          short_description: "Make me P1",
          impact: 3,
          urgency: 3,
          priority: 1,
          state: 6,
          caller_id: alice.id,
          opened_by_id: alice.id,
        }),
        params({ table: "incident" })
      );
      expect(res.status).toBe(201);
      const { result } = await res.json();
      const task = await db.task.findFirst({ where: { number: result.number }, include: { incident: true } });
      taskIds.push(task!.id);
      expect(task!.priority).not.toBe(1);
      expect(task!.state).toBe(1);
      expect(task!.openedById).toBe(bob.id);
      expect(task!.incident?.callerId).toBe(bob.id);
    });

    it("does not let an employee create a pre-approved change", async () => {
      const res = await createRecord(
        req("/api/now/table/change_request", "POST", bobToken, {
          short_description: "Sneaky change",
          cab_approval_state: "approved",
          cab_required: false,
        }),
        params({ table: "change_request" })
      );
      expect(res.status).toBe(201);
      const { result } = await res.json();
      const task = await db.task.findFirst({ where: { number: result.number }, include: { changeRequest: true } });
      taskIds.push(task!.id);
      expect(task!.changeRequest?.cabApprovalState).toBe("requested");
      expect(task!.changeRequest?.cabRequired).toBe(true);
    });
  });

  describe("sessions", () => {
    it("invalidates sessions of a deactivated user", async () => {
      const temp = await db.user.create({
        data: { userName: `temp_${suffix}`, name: "Temp", email: `temp_${suffix}@test.local`, role: "employee" },
      });
      const { token } = await createDbSession(temp.id);
      expect(await getServerSession(req("/api/auth/me", "GET", token))).not.toBeNull();

      await db.user.update({ where: { id: temp.id }, data: { active: false } });
      expect(await getServerSession(req("/api/auth/me", "GET", token))).toBeNull();
      await db.user.delete({ where: { id: temp.id } });
    });
  });

  describe("reservations", () => {
    it("only the owner or a manager can change or cancel a booking", async () => {
      const space = await db.cmnSpace.findFirst();
      expect(space).toBeTruthy();
      const start = new Date(Date.now() + 400 * 24 * 3600 * 1000);
      const reservation = await db.cmnReservation.create({
        data: {
          number: `RESTEST${suffix}`,
          subject: "Alice's 1:1",
          spaceId: space!.id,
          reservedById: alice.id,
          startTime: start,
          endTime: new Date(start.getTime() + 3600 * 1000),
        },
      });
      reservationId = reservation.id;

      const bobPatch = await patchReservation(
        req(`/api/now/reservations/${reservation.id}`, "PATCH", bobToken, { reservedById: bob.id }),
        params({ id: reservation.id })
      );
      expect(bobPatch.status).toBe(403);
      const bobDelete = await deleteReservation(
        req(`/api/now/reservations/${reservation.id}`, "DELETE", bobToken),
        params({ id: reservation.id })
      );
      expect(bobDelete.status).toBe(403);

      const alicePatch = await patchReservation(
        req(`/api/now/reservations/${reservation.id}`, "PATCH", aliceToken, { subject: "Alice's 1:1 (moved)", reservedById: bob.id }),
        params({ id: reservation.id })
      );
      expect(alicePatch.status).toBe(200);
      const after = await db.cmnReservation.findUnique({ where: { id: reservation.id } });
      expect(after?.subject).toBe("Alice's 1:1 (moved)");
      expect(after?.reservedById).toBe(alice.id); // non-managers can't reassign
    });
  });

  describe("attachments", () => {
    it("restricts viewing to the uploader, the ticket's requester and fulfillers", async () => {
      const up = await uploadAttachment(
        req("/api/now/attachments", "POST", aliceToken, {
          tableName: "incident",
          recordId: aliceIncident.id,
          fileName: "screenshot.png",
          contentType: "image/png",
          byteSize: 999999999, // ignored: size comes from the data
          base64Data: Buffer.from("hello world").toString("base64"),
        })
      );
      expect(up.status).toBe(201);
      const { result } = await up.json();
      attachmentIds.push(result.id);
      expect(result.byteSize).toBe(11);

      const fetchAs = (token: string) =>
        getAttachment(req(`/api/now/attachments/${result.id}`, "GET", token), params({ id: result.id }));
      expect((await fetchAs(aliceToken)).status).toBe(200);
      expect((await fetchAs(agentToken)).status).toBe(200);
      expect((await fetchAs(bobToken)).status).toBe(404);

      const bobList = await (
        await listAttachments(req(`/api/now/attachments?table=incident&record_id=${aliceIncident.id}`, "GET", bobToken))
      ).json();
      expect(bobList.result).toHaveLength(0);
    });

    it("blocks uploads to someone else's ticket and oversized files", async () => {
      const onAlice = await uploadAttachment(
        req("/api/now/attachments", "POST", bobToken, {
          tableName: "incident",
          recordId: aliceIncident.id,
          fileName: "x.txt",
          base64Data: "aGk=",
        })
      );
      expect(onAlice.status).toBe(403);

      const huge = await uploadAttachment(
        req("/api/now/attachments", "POST", aliceToken, {
          tableName: "incident",
          recordId: aliceIncident.id,
          fileName: "huge.bin",
          base64Data: "A".repeat(14_000_001),
        })
      );
      expect(huge.status).toBe(413);
    });
  });

  it("keeps AI drafts (which include work notes) fulfiller-only", async () => {
    const res = await draftResponse(req("/api/now/ai/draft-response", "POST", bobToken, { taskId: aliceIncident.id }));
    expect(res.status).toBe(403);
  });
});
