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

describe("Agile, CMDB, Problem & Knowledge System Integration", () => {
  let adminToken: string;
  let adminUserId: string;
  let testSpace: any;
  let testRack: any;

  // Track created IDs for test cleanup
  const createdCiIds: string[] = [];
  const createdTaskIds: string[] = [];
  const createdKbIds: string[] = [];
  const createdKbbIds: string[] = [];
  const createdSprintIds: string[] = [];

  beforeAll(async () => {
    // 1. Resolve or create admin user for session
    let admin = await db.user.findFirst({
      where: { role: "admin" },
    });

    if (!admin) {
      admin = await db.user.create({
        data: {
          userName: "test_admin",
          name: "Test Administrator",
          email: "admin_test@servicemeow.local",
          role: "admin",
          passwordHash: "mock_hash",
        },
      });
    }

    adminUserId = admin.id;
    const sessionRes = await createDbSession(adminUserId);
    adminToken = sessionRes.token;

    // 2. Fetch sample space & rack if available
    testSpace = await db.cmnSpace.findFirst();
    testRack = await db.cmdbRack.findFirst();
  });

  afterAll(async () => {
    // Cleanup Configuration Items
    if (createdCiIds.length > 0) {
      await db.configurationItem.deleteMany({
        where: { id: { in: createdCiIds } },
      });
    }

    // Cleanup Tasks (Incident, Problem, Story, Epic)
    if (createdTaskIds.length > 0) {
      await db.problem.deleteMany({
        where: { taskId: { in: createdTaskIds } },
      });
      await db.task.deleteMany({
        where: { id: { in: createdTaskIds } },
      });
    }

    // Cleanup Knowledge Articles
    if (createdKbIds.length > 0) {
      await db.knowledgeArticle.deleteMany({
        where: { id: { in: createdKbIds } },
      });
    }

    // Cleanup Custom Records (Sprint, Knowledge Base)
    const customIds = [...createdKbbIds, ...createdSprintIds];
    if (customIds.length > 0) {
      await db.sysCustomRecord.deleteMany({
        where: { id: { in: customIds } },
      });
    }
  });

  const makeAuthRequest = (url: string, method: string, body?: any) => {
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    };
    if (body) {
      init.body = JSON.stringify(body);
    }
    return new NextRequest(url, init);
  };

  // =========================================================================
  // 1. CMDB CI Creation & Spatial/Rack Placement
  // =========================================================================
  it("creates and retrieves a CMDB CI with spatial location and rack units", async () => {
    const postReq = makeAuthRequest("http://localhost:3000/api/now/table/cmdb_ci", "POST", {
      name: "prod-core-db-01.internal",
      ci_class: "cmdb_ci_server",
      status: "operational",
      operational_status: "in_service",
      environment: "production",
      asset_tag: "AST-99410",
      ip_address: "10.200.4.15",
      host_name: "prod-core-db-01",
      tier: "tier_1",
      owner: "Database Reliability Engineering",
      space_id: testSpace?.id || undefined,
      rack_id: testRack?.id || undefined,
      rack_unit_start: 12,
      rack_unit_height: 4,
    });

    const postRes = await postTable(postReq, { params: Promise.resolve({ table: "cmdb_ci" }) });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.result).toBeDefined();
    expect(postData.result.id).toBeDefined();
    expect(postData.result.name).toBe("prod-core-db-01.internal");
    expect(postData.result.assetTag || postData.result.asset_tag).toBe("AST-99410");

    const ciId = postData.result.id;
    createdCiIds.push(ciId);

    // Retrieve via GET [id]
    const getReq = makeAuthRequest(`http://localhost:3000/api/now/table/cmdb_ci/${ciId}`, "GET");
    const getRes = await getRecord(getReq, { params: Promise.resolve({ table: "cmdb_ci", id: ciId }) });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.result.name).toBe("prod-core-db-01.internal");
    expect(getData.result.rackUnitStart).toBe(12);
    expect(getData.result.rackUnitHeight).toBe(4);
  });

  // =========================================================================
  // 2. Problem Creation, Root Cause, Workaround & KEDB
  // =========================================================================
  it("creates a Problem record with root cause, workaround and updates KEDB state", async () => {
    const postReq = makeAuthRequest("http://localhost:3000/api/now/table/problem", "POST", {
      short_description: "Intermittent HTTP 504 Gateway Timeouts in Billing Service",
      description: "Billing microservice thread pool exhaustion occurs during batch reconciliation.",
      priority: "2",
      root_cause: "Unbounded worker thread allocation without semaphore backpressure.",
      workaround: "Temporarily scale billing worker replicas to 8 and restart pod during peak load.",
      is_known_error: true,
      assignment_group: "Platform Architecture",
      assigned_to: "Database Reliability Engineering",
    });

    const postRes = await postTable(postReq, { params: Promise.resolve({ table: "problem" }) });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.result).toBeDefined();
    expect(postData.result.number).toMatch(/^PRB/);
    expect(postData.result.short_description).toContain("Intermittent HTTP 504");
    expect(postData.result.is_known_error).toBe(true);

    const prbId = postData.result.id;
    createdTaskIds.push(prbId);

    // Verify GET problem
    const getReq = makeAuthRequest(`http://localhost:3000/api/now/table/problem/${prbId}`, "GET");
    const getRes = await getRecord(getReq, { params: Promise.resolve({ table: "problem", id: prbId }) });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.result.root_cause).toContain("Unbounded worker thread");
    expect(getData.result.workaround).toContain("scale billing worker");

    // Patch Problem with permanent fix
    const patchReq = makeAuthRequest(`http://localhost:3000/api/now/table/problem/${prbId}`, "PATCH", {
      workaround: "Upgraded connection pooling to HikariCP with max-pool-size=20.",
      state: "4", // Root Cause Identified
    });
    const patchRes = await patchRecord(patchReq, { params: Promise.resolve({ table: "problem", id: prbId }) });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.result.workaround).toContain("HikariCP");
  });

  // =========================================================================
  // 3. Knowledge Article Creation, Retrieval & Voting
  // =========================================================================
  it("creates a Knowledge Article with markdown content and records helpful votes", async () => {
    const postReq = makeAuthRequest("http://localhost:3000/api/now/table/kb_knowledge", "POST", {
      title: "Troubleshooting Core Database High Replication Lag",
      category: "Database",
      content: "### Steps to Mitigate Lag\n1. Inspect replication slots.\n2. Verify WAL sender bandwidth.",
      is_published: true,
      author_id: adminUserId,
    });

    const postRes = await postTable(postReq, { params: Promise.resolve({ table: "kb_knowledge" }) });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.result.number).toMatch(/^KB/);
    expect(postData.result.title).toBe("Troubleshooting Core Database High Replication Lag");

    const kbId = postData.result.id;
    createdKbIds.push(kbId);

    // Patch helpful votes
    const patchReq = makeAuthRequest(`http://localhost:3000/api/now/table/kb_knowledge/${kbId}`, "PATCH", {
      helpful_votes: 15,
      views: 120,
    });
    const patchRes = await patchRecord(patchReq, { params: Promise.resolve({ table: "kb_knowledge", id: kbId }) });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.result.helpful_votes).toBe(15);
    expect(patchData.result.views).toBe(120);
  });

  // =========================================================================
  // 4. Knowledge Base (Repository) Creation & Retrieval
  // =========================================================================
  it("creates and retrieves a Knowledge Base repository", async () => {
    const postReq = makeAuthRequest("http://localhost:3000/api/now/table/kb_knowledge_base", "POST", {
      name: "Enterprise Architecture Runbooks",
      description: "Official engineering standards, disaster recovery SOPs, and system topologies.",
      owner: "System Administrator",
      active: true,
    });

    const postRes = await postTable(postReq, { params: Promise.resolve({ table: "kb_knowledge_base" }) });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.result.number).toMatch(/^KBB/);
    expect(postData.result.name).toBe("Enterprise Architecture Runbooks");

    const kbbId = postData.result.id;
    createdKbbIds.push(kbbId);

    const getReq = makeAuthRequest("http://localhost:3000/api/now/table/kb_knowledge_base", "GET");
    const getRes = await getTable(getReq, { params: Promise.resolve({ table: "kb_knowledge_base" }) });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    const found = (getData.result || []).find((k: any) => k.id === kbbId || k.name === "Enterprise Architecture Runbooks");
    expect(found).toBeDefined();
  });

  // =========================================================================
  // 5. Agile Epics, Sprints, and Stories
  // =========================================================================
  it("creates an Agile Epic, Sprint, and Story with Fibonacci points and state transitions", async () => {
    // A. Create Epic
    const epicReq = makeAuthRequest("http://localhost:3000/api/now/table/rm_epic", "POST", {
      short_description: "Next-Gen Intelligent Ops Platform",
      description: "Deliver unified ITIL ESM workspace with real-time CAD spatial management.",
      priority: "1",
      owner: "VP of Enterprise Engineering",
    });
    const epicRes = await postTable(epicReq, { params: Promise.resolve({ table: "rm_epic" }) });
    expect(epicRes.status).toBe(201);
    const epicData = await epicRes.json();
    expect(epicData.result.number).toMatch(/^EPIC/);
    createdTaskIds.push(epicData.result.id);

    // B. Create Sprint
    const sprintReq = makeAuthRequest("http://localhost:3000/api/now/table/rm_sprint", "POST", {
      name: "Sprint 42 - Quantum Leap",
      state: "active",
      start_date: "2026-10-01",
      end_date: "2026-10-15",
      capacity_points: 60,
      goal: "Complete Swiss Grid workspace forms and CMDB hardware rack integrations.",
    });
    const sprintRes = await postTable(sprintReq, { params: Promise.resolve({ table: "rm_sprint" }) });
    expect(sprintRes.status).toBe(201);
    const sprintData = await sprintRes.json();
    expect(sprintData.result.number).toMatch(/^SPNT/);
    expect(sprintData.result.name).toBe("Sprint 42 - Quantum Leap");
    createdSprintIds.push(sprintData.result.id);

    // C. Create Story linked to Sprint and Epic
    const storyReq = makeAuthRequest("http://localhost:3000/api/now/table/rm_story", "POST", {
      short_description: "Refactor Agile Board to use Swiss Grid Modal Dialogs",
      description: "Replace all legacy inputs with clean, high-contrast monospace modals.",
      story_points: 8,
      sprint_id: sprintData.result.id,
      sprint_name: sprintData.result.name,
      epic_name: epicData.result.short_description,
      priority: "2",
      assigned_to: "System Administrator",
      acceptance_criteria: "GIVEN the agile board, WHEN clicking + New Sprint, THEN a Swiss Grid modal opens.",
    });
    const storyRes = await postTable(storyReq, { params: Promise.resolve({ table: "rm_story" }) });
    expect(storyRes.status).toBe(201);
    const storyData = await storyRes.json();
    expect(storyData.result.number).toMatch(/^STRY/);
    expect(storyData.result.story_points).toBe(8);
    expect(storyData.result.sprint_name).toBe("Sprint 42 - Quantum Leap");

    const storyId = storyData.result.id;
    createdTaskIds.push(storyId);

    // D. Transition Story State to '3' (Work in Progress)
    const patchStoryReq = makeAuthRequest(`http://localhost:3000/api/now/table/rm_story/${storyId}`, "PATCH", {
      state: "3",
      story_points: 13,
    });
    const patchStoryRes = await patchRecord(patchStoryReq, { params: Promise.resolve({ table: "rm_story", id: storyId }) });
    expect(patchStoryRes.status).toBe(200);
    const patchStoryData = await patchStoryRes.json();
    expect(String(patchStoryData.result.state)).toBe("3");
    expect(Number(patchStoryData.result.story_points)).toBe(13);
  });
});
