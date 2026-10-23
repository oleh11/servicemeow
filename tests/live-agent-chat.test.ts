import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { ChatService } from "@/lib/chat-service";
import { chatBus } from "@/lib/chat-bus";
import { signSessionToken } from "@/lib/auth-token";
import { NextRequest } from "next/server";
import {
  POST as handleChatSessionPost,
  GET as handleChatSessionGet,
  PATCH as handleChatSessionPatch,
} from "@/app/api/now/chat/session/route";
import { POST as handleChatMessagePost, GET as handleChatMessageGet } from "@/app/api/now/chat/message/route";
import { POST as handleChatAgentPost, GET as handleChatAgentGet } from "@/app/api/now/chat/agent/route";
import { POST as handleChatConfigPost, GET as handleChatConfigGet } from "@/app/api/now/chat/config/route";

describe("Omnichannel Live Agent Chat Subsystem", () => {
  let employeeUser: any;
  let itilUser: any;
  let adminUser: any;
  let employeeCookie: string;
  let itilCookie: string;
  let adminCookie: string;

  beforeEach(async () => {
    // 1. Ensure test users exist
    adminUser = await db.user.findFirst({ where: { role: "admin" } });
    itilUser = await db.user.findFirst({ where: { role: "itil" } });
    employeeUser = await db.user.findFirst({ where: { role: "employee" } });

    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          userName: "test_admin",
          email: "admin_test@servicemeow.io",
          name: "Test Admin",
          role: "admin",
        },
      });
    }

    if (!itilUser) {
      itilUser = await db.user.create({
        data: {
          userName: "test_itil",
          email: "itil_test@servicemeow.io",
          name: "Test ITIL Agent",
          role: "itil",
        },
      });
    }

    if (!employeeUser) {
      employeeUser = await db.user.create({
        data: {
          userName: "test_employee",
          email: "employee_test@servicemeow.io",
          name: "Test Employee",
          role: "employee",
        },
      });
    }

    // 2. Generate signed test sessions
    const empSession = await db.sysUserSession.create({
      data: {
        userId: employeeUser.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const empToken = await signSessionToken({
      sessionId: empSession.id,
      userId: employeeUser.id,
      role: employeeUser.role,
      impersonatedUserId: null,
      exp: Date.now() + 86400000,
    });
    employeeCookie = `servicemeow_session=${empToken}`;

    const itilSession = await db.sysUserSession.create({
      data: {
        userId: itilUser.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const itilToken = await signSessionToken({
      sessionId: itilSession.id,
      userId: itilUser.id,
      role: itilUser.role,
      impersonatedUserId: null,
      exp: Date.now() + 86400000,
    });
    itilCookie = `servicemeow_session=${itilToken}`;

    const admSession = await db.sysUserSession.create({
      data: {
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const admToken = await signSessionToken({
      sessionId: admSession.id,
      userId: adminUser.id,
      role: adminUser.role,
      impersonatedUserId: null,
      exp: Date.now() + 86400000,
    });
    adminCookie = `servicemeow_session=${admToken}`;

    await ChatService.ensureDefaults();
  });

  describe("1. Service Layer Core & Routing Lifecycle", () => {
    it("ensures default queues and canned responses are seeded", async () => {
      const queues = await db.sysLiveChatQueue.findMany();
      expect(queues.length).toBeGreaterThanOrEqual(2);
      expect(queues.some((q) => q.code === "it_service_desk")).toBe(true);

      const canned = await db.sysCannedResponse.findMany();
      expect(canned.length).toBeGreaterThanOrEqual(4);
      expect(canned.some((c) => c.shortcut === "/greet")).toBe(true);
      expect(canned.some((c) => c.shortcut === "/resolve")).toBe(true);
    });

    it("initiates a queued chat session with welcome and initial question messages", async () => {
      const queue = await db.sysLiveChatQueue.findFirst({ where: { active: true } });
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        queueId: queue?.id,
        initialQuestion: "Corporate VPN authentication failing with error 403",
        subject: "VPN Failure",
      });

      expect(channel).toBeDefined();
      expect(channel.number).toMatch(/^CHAT\d+$/);
      expect(channel.state).toBe("queued");
      expect(channel.requesterId).toBe(employeeUser.id);

      // Check messages
      const msgs = await db.sysLiveChatMessage.findMany({ where: { channelId: channel.id } });
      expect(msgs.length).toBe(2);
      expect(msgs[0].senderType).toBe("requester");
      expect(msgs[0].body).toContain("VPN authentication failing");
      expect(msgs[1].senderType).toBe("system");
    });

    it("allows fulfiller to accept a chat and increments presence count", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Need display adapter",
      });

      const updated = await ChatService.acceptChat(channel.id, itilUser.id);
      expect(updated.state).toBe("active");
      expect(updated.assignedToId).toBe(itilUser.id);
      expect(updated.acceptedAt).toBeDefined();

      const presence = await db.sysLiveChatPresence.findUnique({ where: { userId: itilUser.id } });
      expect(presence?.activeChatsCount).toBeGreaterThanOrEqual(1);
    });

    it("enforces internal note privacy (requesters cannot see whisper notes)", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Printer offline",
      });
      await ChatService.acceptChat(channel.id, itilUser.id);

      // Fulfiller posts public message
      await ChatService.sendMessage({
        channelId: channel.id,
        senderId: itilUser.id,
        senderName: itilUser.name,
        senderType: "agent",
        body: "Hello! Checking printer connectivity.",
        isInternal: false,
      });

      // Fulfiller posts internal whisper note
      await ChatService.sendMessage({
        channelId: channel.id,
        senderId: itilUser.id,
        senderName: itilUser.name,
        senderType: "agent",
        body: "Note: Switch port Gi0/12 is flapping, possible physical cable fault.",
        isInternal: true,
      });

      // Requester view: isInternal = false only
      const requesterMsgs = await ChatService.getChannelMessages(channel.id, true);
      expect(requesterMsgs.some((m) => m.body.includes("Gi0/12"))).toBe(false);
      expect(requesterMsgs.some((m) => m.body.includes("connectivity"))).toBe(true);

      // Fulfiller view: all messages including internal notes
      const fulfillerMsgs = await ChatService.getChannelMessages(channel.id, false);
      expect(fulfillerMsgs.some((m) => m.body.includes("Gi0/12"))).toBe(true);
    });

    it("creates an ITIL Incident from a live chat channel with full transcript", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Production SAP ERP server timeout",
        subject: "ERP Timeout",
      });
      await ChatService.acceptChat(channel.id, itilUser.id);

      await ChatService.sendMessage({
        channelId: channel.id,
        senderId: itilUser.id,
        senderName: itilUser.name,
        senderType: "agent",
        body: "Escalating to Tier 2 database operations.",
        isInternal: false,
      });

      const task = await ChatService.createIncidentFromChat(channel.id, itilUser.id);
      expect(task).toBeDefined();
      expect(task.number).toMatch(/^INC\d+$/);
      expect(task.sysClassName).toBe("incident");
      expect(task.description).toContain("Production SAP ERP server timeout");
      expect(task.description).toContain("Tier 2 database operations");

      // Verify channel has linked incidentId
      const refreshedChannel = await db.sysLiveChatChannel.findUnique({ where: { id: channel.id } });
      expect(refreshedChannel?.incidentId).toBe(task.number);
    });

    it("resolves chat, decrements active chats count, and records CSAT rating", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Access to Figma granted",
      });
      await ChatService.acceptChat(channel.id, itilUser.id);

      const beforePresence = await db.sysLiveChatPresence.findUnique({ where: { userId: itilUser.id } });
      const initialCount = beforePresence?.activeChatsCount || 1;

      const resolved = await ChatService.resolveChat(channel.id, itilUser.id, 5, "Exceptional and lightning-fast help!");
      expect(resolved.state).toBe("resolved");
      expect(resolved.rating).toBe(5);
      expect(resolved.feedback).toBe("Exceptional and lightning-fast help!");

      const afterPresence = await db.sysLiveChatPresence.findUnique({ where: { userId: itilUser.id } });
      expect(afterPresence?.activeChatsCount).toBeLessThan(initialCount + 1);
    });

    it("manages agent presence status", async () => {
      const presence = await ChatService.setAgentPresence(itilUser.id, "busy");
      expect(presence.status).toBe("busy");

      const onlinePresence = await ChatService.setAgentPresence(itilUser.id, "online");
      expect(onlinePresence.status).toBe("online");
    });
  });

  describe("2. HTTP API Route Handlers", () => {
    it("POST /api/now/chat/session initiates session for authenticated requester", async () => {
      const req = new NextRequest("http://localhost:3000/api/now/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: employeeCookie,
        },
        body: JSON.stringify({
          initialQuestion: "Cannot log in to Jira after MFA reset",
          subject: "Jira MFA",
        }),
      });

      const res = await handleChatSessionPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.channel).toBeDefined();
      expect(data.channel.number).toMatch(/^CHAT\d+$/);
    });

    it("POST /api/now/chat/message posts message and blocks employees from posting internal notes", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Screen flickering",
      });

      // Employee tries to post an internal note
      const empReq = new NextRequest("http://localhost:3000/api/now/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: employeeCookie,
        },
        body: JSON.stringify({
          channelId: channel.id,
          body: "Employee message",
          isInternal: true, // Should be forced to false
        }),
      });

      const empRes = await handleChatMessagePost(empReq);
      expect(empRes.status).toBe(201);
      const empData = await empRes.json();
      expect(empData.message.isInternal).toBe(false);
      expect(empData.message.senderType).toBe("requester");

      // ITIL fulfiller posts internal note
      const itilReq = new NextRequest("http://localhost:3000/api/now/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: itilCookie,
        },
        body: JSON.stringify({
          channelId: channel.id,
          body: "Agent internal hardware check",
          isInternal: true,
        }),
      });

      const itilRes = await handleChatMessagePost(itilReq);
      expect(itilRes.status).toBe(201);
      const itilData = await itilRes.json();
      expect(itilData.message.isInternal).toBe(true);
      expect(itilData.message.senderType).toBe("agent");
    });

    it("POST /api/now/chat/agent supports accept, presence, resolve and create_incident", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "API Gateway 502 Bad Gateway",
      });

      // 1. Presence
      const presReq = new NextRequest("http://localhost:3000/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: itilCookie },
        body: JSON.stringify({ action: "presence", status: "online" }),
      });
      const presRes = await handleChatAgentPost(presReq);
      expect(presRes.status).toBe(200);

      // 2. Accept
      const acceptReq = new NextRequest("http://localhost:3000/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: itilCookie },
        body: JSON.stringify({ action: "accept", channelId: channel.id }),
      });
      const acceptRes = await handleChatAgentPost(acceptReq);
      expect(acceptRes.status).toBe(200);

      // 3. Create Incident
      const incReq = new NextRequest("http://localhost:3000/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: itilCookie },
        body: JSON.stringify({ action: "create_incident", channelId: channel.id }),
      });
      const incRes = await handleChatAgentPost(incReq);
      expect(incRes.status).toBe(200);
      const incData = await incRes.json();
      expect(incData.task.number).toMatch(/^INC\d+$/);

      // 4. Resolve
      const resolveReq = new NextRequest("http://localhost:3000/api/now/chat/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: itilCookie },
        body: JSON.stringify({ action: "resolve", channelId: channel.id, rating: 5 }),
      });
      const resolveRes = await handleChatAgentPost(resolveReq);
      expect(resolveRes.status).toBe(200);
    });

    it("Configurator Studio /api/now/chat/config manages queues and canned macros", async () => {
      // 1. Read config
      const getReq = new NextRequest("http://localhost:3000/api/now/chat/config", {
        headers: { Cookie: adminCookie },
      });
      const getRes = await handleChatConfigGet(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.queues).toBeDefined();
      expect(getData.cannedResponses).toBeDefined();

      // 2. Create Custom Queue
      const queueReq = new NextRequest("http://localhost:3000/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          entity: "queue",
          action: "create",
          data: {
            name: "Cloud Architecture Review",
            code: `cloud_arch_${Date.now()}`,
            description: "Live review for cloud design and capacity planning",
            maxWaitSeconds: 600,
            priority: 2,
          },
        }),
      });
      const queueRes = await handleChatConfigPost(queueReq);
      expect(queueRes.status).toBe(201);
      const queueData = await queueRes.json();
      expect(queueData.queue.name).toBe("Cloud Architecture Review");

      // 3. Create Custom Canned Macro
      const macroReq = new NextRequest("http://localhost:3000/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          entity: "canned",
          action: "create",
          data: {
            shortcut: `/cloud_${Date.now()}`,
            title: "Cloud Architecture Guidance",
            message: "Please review our Well-Architected framework checklist.",
            category: "troubleshooting",
          },
        }),
      });
      const macroRes = await handleChatConfigPost(macroReq);
      expect(macroRes.status).toBe(201);
    });

    it("blocks non-administrators from mutating chat config", async () => {
      const unauthorizedReq = new NextRequest("http://localhost:3000/api/now/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employeeCookie },
        body: JSON.stringify({
          entity: "config",
          data: { maxConcurrentChatsPerAgent: 10 },
        }),
      });

      const res = await handleChatConfigPost(unauthorizedReq);
      expect(res.status).toBe(403);
    });

    it("separates internal whisper notes into JournalEntry work_notes when creating an Incident", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "SSO login error 500 on corporate portal",
        subject: "SSO Login Error",
      });
      await ChatService.acceptChat(channel.id, itilUser.id);

      // Agent sends public reply
      await ChatService.sendMessage({
        channelId: channel.id,
        senderId: itilUser.id,
        senderName: itilUser.name,
        senderType: "agent",
        body: "Checking Okta identity provider logs now.",
        isInternal: false,
      });

      // Agent sends confidential internal whisper note
      const secretNote = "CONFIDENTIAL_WHISPER: Root certificate on IdP node-02 expired at 03:00 UTC.";
      await ChatService.sendMessage({
        channelId: channel.id,
        senderId: itilUser.id,
        senderName: itilUser.name,
        senderType: "agent",
        body: secretNote,
        isInternal: true,
      });

      const task = await ChatService.createIncidentFromChat(channel.id, itilUser.id);

      // Public description must NOT leak the internal whisper note
      expect(task.description).toContain("Checking Okta identity provider logs now.");
      expect(task.description).not.toContain("CONFIDENTIAL_WHISPER");

      // Internal whisper note must be saved as an internal ActivityNote work_note on the Incident
      const workNotes = await db.activityNote.findMany({
        where: { taskId: task.id, noteType: "work_note" },
      });
      expect(workNotes.length).toBe(1);
      expect(workNotes[0].noteType).toBe("work_note");
      expect(workNotes[0].content).toContain("CONFIDENTIAL_WHISPER");
    });

    it("allows employee requester to end their own chat and submit CSAT rating via PATCH /api/now/chat/session", async () => {
      const channel = await ChatService.initiateSession({
        requesterId: employeeUser.id,
        initialQuestion: "Need VPN token resync",
      });
      await ChatService.acceptChat(channel.id, itilUser.id);

      // 1. Employee ends the chat
      const endReq = new NextRequest("http://localhost:3000/api/now/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: employeeCookie },
        body: JSON.stringify({
          action: "resolve",
          channelId: channel.id,
        }),
      });
      const endRes = await handleChatSessionPatch(endReq);
      expect(endRes.status).toBe(200);
      const endData = await endRes.json();
      expect(endData.channel.state).toBe("resolved");

      // 2. Employee submits post-chat CSAT rating & feedback (idempotent resolve)
      const rateReq = new NextRequest("http://localhost:3000/api/now/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: employeeCookie },
        body: JSON.stringify({
          action: "rate",
          channelId: channel.id,
          rating: 5,
          feedback: "Super smooth resolution!",
        }),
      });
      const rateRes = await handleChatSessionPatch(rateReq);
      expect(rateRes.status).toBe(200);
      const rateData = await rateRes.json();
      expect(rateData.channel.rating).toBe(5);
      expect(rateData.channel.feedback).toBe("Super smooth resolution!");
    });
  });
});

