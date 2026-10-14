import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ServiceMeow Database (Purr-fect Enterprise ITIL)...");

  // Clear existing data
  await prisma.sysHubFlowExecution.deleteMany();
  await prisma.sysHubFlow.deleteMany();
  await prisma.sysUiPolicyAction.deleteMany();
  await prisma.sysUiPolicy.deleteMany();
  await prisma.sysScript.deleteMany();
  await prisma.activityNote.deleteMany();
  await prisma.slaInstance.deleteMany();
  await prisma.slaDefinition.deleteMany();
  await prisma.approvalRecord.deleteMany();
  await prisma.catalogTask.deleteMany();
  await prisma.requestedItem.deleteMany();
  await prisma.request.deleteMany();
  await prisma.catalogVariable.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.cIRelation.deleteMany();
  await prisma.configurationItem.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.userGroupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sysChoice.deleteMany();
  await prisma.sysDictionary.deleteMany();
  await prisma.sysDbObject.deleteMany();

  // 1. Data Dictionary Tables (The Now Meta-Schema)
  console.log("Creating System Data Dictionary...");
  await prisma.sysDbObject.createMany({
    data: [
      { name: "task", label: "Task", superClass: null, description: "Base polymorphic task record" },
      { name: "incident", label: "Incident", superClass: "task", description: "Unplanned interruption or reduction in quality of an IT service" },
      { name: "change_request", label: "Change Request", superClass: "task", description: "Addition, modification, or removal of anything that could affect IT services" },
      { name: "problem", label: "Problem", superClass: "task", description: "Cause or potential cause of one or more incidents" },
      { name: "sc_request", label: "Request", superClass: "task", description: "Parent service catalog request order" },
      { name: "sc_req_item", label: "Requested Item", superClass: "task", description: "Individual requested catalog item" },
      { name: "sc_task", label: "Catalog Task", superClass: "task", description: "Fulfillment work unit for catalog items" },
      { name: "cmdb_ci", label: "Configuration Item", superClass: null, description: "Any component that needs to be managed to deliver an IT service" },
      { name: "kb_knowledge", label: "Knowledge Article", superClass: null, description: "Curated self-service technical and how-to guides" },
      { name: "sys_user", label: "User [sys_user]", superClass: null, description: "Platform users, engineers, and customer personas" },
      { name: "sys_user_group", label: "Group [sys_user_group]", superClass: null, description: "Assignment groups and escalation rosters" },
      { name: "sys_script", label: "Business Rule [sys_script]", superClass: null, description: "Server-side business logic and event automation" },
      { name: "sys_ui_policy", label: "UI Policy [sys_ui_policy]", superClass: null, description: "Client-side form visibility, mandatory and read-only behavior" },
      { name: "sys_hub_flow", label: "Flow [sys_hub_flow]", superClass: null, description: "ServiceMeow Flow Designer automated approval and notification workflows" },
    ],
  });

  // 2. System Dictionary Fields
  await prisma.sysDictionary.createMany({
    data: [
      // Task base fields
      { tableName: "task", columnName: "number", columnLabel: "Number", columnType: "string", isReadOnly: true },
      { tableName: "task", columnName: "short_description", columnLabel: "Short Description", columnType: "string", isMandatory: true },
      { tableName: "task", columnName: "priority", columnLabel: "Priority", columnType: "choice", defaultVal: "3" },
      { tableName: "task", columnName: "state", columnLabel: "State", columnType: "choice", defaultVal: "1" },
      { tableName: "task", columnName: "impact", columnLabel: "Impact", columnType: "choice", defaultVal: "2" },
      { tableName: "task", columnName: "urgency", columnLabel: "Urgency", columnType: "choice", defaultVal: "2" },
      { tableName: "task", columnName: "assigned_to", columnLabel: "Assigned to", columnType: "reference", referenceTable: "sys_user" },
      { tableName: "task", columnName: "assignment_group", columnLabel: "Assignment group", columnType: "reference", referenceTable: "sys_user_group" },
      // Incident fields
      { tableName: "incident", columnName: "caller_id", columnLabel: "Caller", columnType: "reference", referenceTable: "sys_user", isMandatory: true },
      { tableName: "incident", columnName: "category", columnLabel: "Category", columnType: "choice", defaultVal: "inquiry" },
      { tableName: "incident", columnName: "subcategory", columnLabel: "Subcategory", columnType: "string" },
      { tableName: "incident", columnName: "cmdb_ci", columnLabel: "Configuration Item", columnType: "reference", referenceTable: "cmdb_ci" },
      { tableName: "incident", columnName: "hold_reason", columnLabel: "On Hold Reason", columnType: "choice" },
      // Change fields
      { tableName: "change_request", columnName: "change_type", columnLabel: "Type", columnType: "choice", defaultVal: "normal" },
      { tableName: "change_request", columnName: "risk", columnLabel: "Risk", columnType: "choice", defaultVal: "moderate" },
      { tableName: "change_request", columnName: "cab_required", columnLabel: "CAB Approval Required", columnType: "boolean", defaultVal: "true" },
      { tableName: "change_request", columnName: "planned_start", columnLabel: "Planned Start Date", columnType: "datetime" },
      { tableName: "change_request", columnName: "planned_end", columnLabel: "Planned End Date", columnType: "datetime" },
    ],
  });

  // 3. System Choices
  await prisma.sysChoice.createMany({
    data: [
      // Incident State
      { tableName: "incident", columnName: "state", label: "New", value: "1", sequence: 10 },
      { tableName: "incident", columnName: "state", label: "In Progress", value: "2", sequence: 20 },
      { tableName: "incident", columnName: "state", label: "On Hold", value: "3", sequence: 30 },
      { tableName: "incident", columnName: "state", label: "Resolved", value: "6", sequence: 60 },
      { tableName: "incident", columnName: "state", label: "Closed", value: "7", sequence: 70 },
      { tableName: "incident", columnName: "state", label: "Canceled", value: "8", sequence: 80 },
      // Incident Category
      { tableName: "incident", columnName: "category", label: "Inquiry / Help", value: "inquiry", sequence: 10 },
      { tableName: "incident", columnName: "category", label: "Software", value: "software", sequence: 20 },
      { tableName: "incident", columnName: "category", label: "Hardware", value: "hardware", sequence: 30 },
      { tableName: "incident", columnName: "category", label: "Network", value: "network", sequence: 40 },
      { tableName: "incident", columnName: "category", label: "Database", value: "database", sequence: 50 },
      // Priority
      { tableName: "task", columnName: "priority", label: "1 - Critical", value: "1", sequence: 10 },
      { tableName: "task", columnName: "priority", label: "2 - High", value: "2", sequence: 20 },
      { tableName: "task", columnName: "priority", label: "3 - Moderate", value: "3", sequence: 30 },
      { tableName: "task", columnName: "priority", label: "4 - Low", value: "4", sequence: 40 },
      { tableName: "task", columnName: "priority", label: "5 - Planning", value: "5", sequence: 50 },
    ],
  });

  // 4. Users
  console.log("Creating System Users & Groups...");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const defaultPasswordHash = await bcrypt.hash("ServiceMeow!2026", 10);

  const adminUser = await prisma.user.create({
    data: {
      userName: "admin",
      email: "admin@servicemeow.io",
      name: "Felix Vance (Admin Cat)",
      title: "Platform Superadmin & Head Cat",
      department: "IT Infrastructure",
      role: "admin",
      passwordHash: adminPasswordHash,
      avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=128&h=128&fit=crop&crop=faces",
    },
  });

  const itilUser = await prisma.user.create({
    data: {
      userName: "sarah.jenkins",
      email: "sarah.jenkins@servicemeow.io",
      name: "Sarah 'Whiskers' Jenkins",
      title: "Senior ITIL Incident Commander",
      department: "Global Service Desk",
      role: "itil",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces",
    },
  });

  const cabUser = await prisma.user.create({
    data: {
      userName: "marcus.vance",
      email: "marcus.vance@servicemeow.io",
      name: "Marcus 'Sharp Claws' Vance",
      title: "CAB Governance Chair & Change Director",
      department: "IT Governance",
      role: "cab_approver",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
    },
  });

  const callerAlex = await prisma.user.create({
    data: {
      userName: "alex.chen",
      email: "alex.chen@servicemeow.io",
      name: "Alex 'Paws' Chen",
      title: "Staff Software Architect",
      department: "Core Engineering",
      role: "employee",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
    },
  });

  const callerEmily = await prisma.user.create({
    data: {
      userName: "emily.watson",
      email: "emily.watson@servicemeow.io",
      name: "Emily 'Purr' Watson",
      title: "Director of Brand Marketing",
      department: "Global Marketing",
      role: "employee",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=faces",
    },
  });

  // Groups
  const groupServiceDesk = await prisma.group.create({
    data: {
      name: "Global Service Desk Tier 1",
      description: "First line ticket triage and immediate incident response",
      roles: "itil",
      managerId: itilUser.id,
    },
  });

  const groupSRE = await prisma.group.create({
    data: {
      name: "Cloud Infrastructure & SRE",
      description: "Production kubernetes, networking and observability",
      roles: "itil",
      managerId: itilUser.id,
    },
  });

  const groupDBA = await prisma.group.create({
    data: {
      name: "Database Administration",
      description: "PostgreSQL, Redis, and high availability storage engines",
      roles: "itil",
      managerId: adminUser.id,
    },
  });

  const groupCAB = await prisma.group.create({
    data: {
      name: "Change Advisory Board (CAB)",
      description: "Enterprise IT change authorization and risk review board",
      roles: "cab_approver",
      managerId: cabUser.id,
    },
  });

  // Add memberships
  await prisma.userGroupMember.createMany({
    data: [
      { userId: itilUser.id, groupId: groupServiceDesk.id },
      { userId: itilUser.id, groupId: groupSRE.id },
      { userId: cabUser.id, groupId: groupCAB.id },
      { userId: adminUser.id, groupId: groupDBA.id },
    ],
  });

  // 5. CMDB Configuration Items
  console.log("Creating CMDB Configuration Items & Topology...");
  const ciPortal = await prisma.configurationItem.create({
    data: {
      name: "Customer E-Commerce Portal",
      ciClass: "business_service",
      status: "in_service",
      environment: "production",
      tier: "Tier 1 - Mission Critical",
      owner: "Alex Chen",
    },
  });

  const ciERP = await prisma.configurationItem.create({
    data: {
      name: "SAP Enterprise ERP Core Billing",
      ciClass: "business_service",
      status: "in_service",
      environment: "production",
      tier: "Tier 1 - Mission Critical",
      owner: "Finance Ops",
    },
  });

  const ciK8s = await prisma.configurationItem.create({
    data: {
      name: "prod-web-ingress-k8s",
      ciClass: "server",
      status: "in_service",
      environment: "production",
      ipAddress: "10.0.1.15",
      hostName: "ingress-k8s-us-east.prod.internal",
      tier: "Tier 1",
    },
  });

  const ciPostgres = await prisma.configurationItem.create({
    data: {
      name: "prod-db-postgres-primary",
      ciClass: "database",
      status: "in_service",
      environment: "production",
      ipAddress: "10.0.4.50",
      hostName: "pg-primary.prod.internal",
      tier: "Tier 1",
    },
  });

  const ciRedis = await prisma.configurationItem.create({
    data: {
      name: "prod-cache-redis-01",
      ciClass: "database",
      status: "in_service",
      environment: "production",
      ipAddress: "10.0.4.60",
      hostName: "redis-cache.prod.internal",
      tier: "Tier 2",
    },
  });

  const ciVPN = await prisma.configurationItem.create({
    data: {
      name: "GlobalProtect Corporate VPN Gateway",
      ciClass: "network",
      status: "in_service",
      environment: "production",
      ipAddress: "198.51.100.1",
      hostName: "vpn-gw-east.corp.internal",
      tier: "Tier 1",
    },
  });

  const ciAuth = await prisma.configurationItem.create({
    data: {
      name: "Auth0 Corporate SSO & Identity",
      ciClass: "application",
      status: "in_service",
      environment: "production",
      tier: "Tier 1",
    },
  });

  // CMDB Relationships (Topology tree)
  await prisma.cIRelation.createMany({
    data: [
      { parentCiId: ciPortal.id, childCiId: ciK8s.id, relationType: "Depends on" },
      { parentCiId: ciPortal.id, childCiId: ciAuth.id, relationType: "Depends on" },
      { parentCiId: ciK8s.id, childCiId: ciPostgres.id, relationType: "Connects to" },
      { parentCiId: ciK8s.id, childCiId: ciRedis.id, relationType: "Connects to" },
      { parentCiId: ciERP.id, childCiId: ciPostgres.id, relationType: "Depends on" },
      { parentCiId: ciVPN.id, childCiId: ciAuth.id, relationType: "Authenticates via" },
    ],
  });

  // 6. SLA Definitions
  console.log("Creating SLA Definitions...");
  const slaP1Resolution = await prisma.slaDefinition.create({
    data: {
      name: "Priority 1 - Critical Resolution SLA (1 Hour)",
      targetTable: "incident",
      targetDurationMinutes: 60,
      priorityTarget: 1,
      stage: "resolution",
    },
  });

  const slaP2Resolution = await prisma.slaDefinition.create({
    data: {
      name: "Priority 2 - High Resolution SLA (4 Hours)",
      targetTable: "incident",
      targetDurationMinutes: 240,
      priorityTarget: 2,
      stage: "resolution",
    },
  });

  const slaP3Resolution = await prisma.slaDefinition.create({
    data: {
      name: "Priority 3 - Moderate Resolution SLA (24 Hours)",
      targetTable: "incident",
      targetDurationMinutes: 1440,
      priorityTarget: 3,
      stage: "resolution",
    },
  });

  // 7. Service Catalog Items
  console.log("Creating Service Catalog Items...");
  const catMacBook = await prisma.catalogItem.create({
    data: {
      name: "Apple MacBook Pro 16\" (M3 Max, 64GB Unified RAM)",
      shortDescription: "High-performance developer workstation with Apple Silicon M3 Max.",
      description: "Standard engineering configuration: 16-inch Liquid Retina XDR display, 64GB Unified Memory, 140W USB-C Power Adapter. Includes IT security pre-provisioning.",
      category: "Hardware",
      price: 3499.0,
      icon: "Laptop",
      deliveryDays: 3,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catMacBook.id,
        name: "storage",
        label: "Internal NVMe Storage Option",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["1TB SSD (Included)", "2TB SSD (+$400)", "4TB SSD (+$1,000)"]),
        order: 1,
      },
      {
        catalogItemId: catMacBook.id,
        name: "monitor_bundle",
        label: "Include Dual 4K Dell 27\" Hub Displays",
        varType: "checkbox",
        isMandatory: false,
        order: 2,
      },
      {
        catalogItemId: catMacBook.id,
        name: "shipping_office",
        label: "Shipment Office Location",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["San Francisco HQ", "New York Hub", "London Office", "Remote / Home Office"]),
        order: 3,
      },
    ],
  });

  const catAWS = await prisma.catalogItem.create({
    data: {
      name: "AWS Cloud Sandbox & Production IAM Role",
      shortDescription: "Provision developer sandbox account or role-based production access.",
      description: "Automated AWS IAM Identity Center entitlement provisioning. Requires manager or CAB sign-off for Production Developer roles.",
      category: "Cloud Services",
      price: 0.0,
      icon: "Cloud",
      deliveryDays: 1,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catAWS.id,
        name: "aws_account",
        label: "Target AWS Environment",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Dev Sandbox (Instant)", "Staging Cluster", "Production Restricted (CAB Approval Required)"]),
        order: 1,
      },
      {
        catalogItemId: catAWS.id,
        name: "role_requested",
        label: "Permission Set",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["ReadOnly / ViewOnlyAccess", "DeveloperAccess", "PowerUserAccess", "AdministratorAccess"]),
        order: 2,
      },
      {
        catalogItemId: catAWS.id,
        name: "justification",
        label: "Business Justification",
        varType: "string",
        isMandatory: true,
        order: 3,
      },
    ],
  });

  const catErgo = await prisma.catalogItem.create({
    data: {
      name: "Herman Miller Embody Ergonomic Office Chair",
      shortDescription: "Health-positive ergonomic seating for remote or office staff.",
      description: "Fully adjustable ergonomic desk chair engineered with rhythm fabric and sync-tilt mechanism.",
      category: "Hardware",
      price: 1695.0,
      icon: "Armchair",
      deliveryDays: 5,
    },
  });

  const catJetBrains = await prisma.catalogItem.create({
    data: {
      name: "JetBrains All Products Pack Corporate Subscription",
      shortDescription: "Full access to IntelliJ IDEA Ultimate, WebStorm, PyCharm, and GoLand.",
      description: "Annual single-developer floating corporate license managed through JetBrains Team Hub.",
      category: "Software",
      price: 289.0,
      icon: "Code",
      deliveryDays: 1,
    },
  });

  // 8. Incidents
  console.log("Creating Seed Incidents & Tasks...");
  // INC0001001 (P1 - Critical, In Progress, SLA tracking)
  const task1 = await prisma.task.create({
    data: {
      number: "INC0001001",
      sysClassName: "incident",
      shortDescription: "GlobalProtect Corporate VPN Gateway connection timeouts in US-East",
      description: "Multiple remote engineers in the US-East region reporting TLS handshake dropouts and 100% packet loss during authentication attempts against vpn-gw-east.corp.internal.",
      priority: 1,
      state: 2, // In Progress
      impact: 1,
      urgency: 1,
      assignedToId: itilUser.id,
      assignmentGroupId: groupServiceDesk.id,
      openedById: callerAlex.id,
      openedAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    },
  });

  await prisma.incident.create({
    data: {
      taskId: task1.id,
      callerId: callerAlex.id,
      callerName: "Alex Chen",
      callerEmail: "alex.chen@opennow.io",
      category: "network",
      subcategory: "vpn",
      severity: 1,
      cmdbCiId: ciVPN.id,
    },
  });

  // SLA instance for INC0001001 (1 Hour target, 35 mins elapsed)
  await prisma.slaInstance.create({
    data: {
      slaDefinitionId: slaP1Resolution.id,
      taskId: task1.id,
      startTime: task1.openedAt,
      breachTime: new Date(task1.openedAt.getTime() + 60 * 60 * 1000), // 60 mins from open
      state: "in_progress",
    },
  });

  // Activity Notes for INC0001001
  await prisma.activityNote.createMany({
    data: [
      {
        taskId: task1.id,
        authorId: callerAlex.id,
        noteType: "customer_comment",
        content: "Cannot connect to staging or dev databases since 21:45 UTC. Impacting entire core platform squad.",
        createdAt: new Date(Date.now() - 34 * 60 * 1000),
      },
      {
        taskId: task1.id,
        authorId: itilUser.id,
        noteType: "work_note",
        content: "[INVESTIGATION] Ping diagnostics show gateway active, but RADIUS auth backend latency spike to 4,200ms. Routing failover to gateway secondary.",
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        taskId: task1.id,
        authorId: itilUser.id,
        noteType: "customer_comment",
        content: "Hi Alex, our Network SRE team has engaged the network provider and initiated DNS failover to the secondary node. We will update within 15 minutes.",
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ],
  });

  // INC0001002 (P2 - High, On Hold: awaiting vendor, Database)
  const task2 = await prisma.task.create({
    data: {
      number: "INC0001002",
      sysClassName: "incident",
      shortDescription: "PostgreSQL read-replica replication lag exceeding 45 minutes",
      description: "Customer portal queries against replica are returning stale inventory states due to replication stream stall on WAL receiver.",
      priority: 2,
      state: 3, // On Hold
      impact: 2,
      urgency: 1,
      assignedToId: adminUser.id,
      assignmentGroupId: groupDBA.id,
      openedById: itilUser.id,
      openedAt: new Date(Date.now() - 120 * 60 * 1000),
    },
  });

  await prisma.incident.create({
    data: {
      taskId: task2.id,
      callerId: itilUser.id,
      callerName: "Sarah Jenkins",
      callerEmail: "sarah.jenkins@opennow.io",
      category: "database",
      subcategory: "replication",
      holdReason: "awaiting_vendor",
      severity: 2,
      cmdbCiId: ciPostgres.id,
    },
  });

  await prisma.slaInstance.create({
    data: {
      slaDefinitionId: slaP2Resolution.id,
      taskId: task2.id,
      startTime: task2.openedAt,
      breachTime: new Date(task2.openedAt.getTime() + 240 * 60 * 1000),
      state: "paused",
    },
  });

  // INC0001003 (P3 - Resolved)
  const task3 = await prisma.task.create({
    data: {
      number: "INC0001003",
      sysClassName: "incident",
      shortDescription: "Marketing team unable to upload SVG hero banners to CMS",
      description: "Media library returned MIME validation error 'image/svg+xml not in permitted whitelist'.",
      priority: 3,
      state: 6, // Resolved
      impact: 2,
      urgency: 3,
      assignedToId: itilUser.id,
      assignmentGroupId: groupServiceDesk.id,
      openedById: callerEmily.id,
      openedAt: new Date(Date.now() - 360 * 60 * 1000),
      closedAt: new Date(Date.now() - 60 * 60 * 1000),
      closeCode: "Solved (Permanently)",
      closeNotes: "Updated CMS security policy to sanitize and whitelist SVG vector uploads.",
    },
  });

  await prisma.incident.create({
    data: {
      taskId: task3.id,
      callerId: callerEmily.id,
      callerName: "Emily Watson",
      callerEmail: "emily.watson@opennow.io",
      category: "software",
      subcategory: "cms",
      severity: 3,
      cmdbCiId: ciPortal.id,
    },
  });

  // 9. Change Requests
  console.log("Creating Change Requests...");
  // CHG0001001 (Normal Change, High Risk, CAB Approval Requested)
  const taskChg1 = await prisma.task.create({
    data: {
      number: "CHG0001001",
      sysClassName: "change_request",
      shortDescription: "PostgreSQL Database Engine Upgrade from v15 to v16 with Zero-Downtime Logical Replication",
      description: "Upgrade core database cluster to PostgreSQL 16.2 to enable vacuum improvements and parallel query enhancements for ERP billing queries.",
      priority: 2,
      state: 2, // In Progress (Assess/Authorize)
      impact: 1,
      urgency: 2,
      assignedToId: adminUser.id,
      assignmentGroupId: groupDBA.id,
      openedById: adminUser.id,
    },
  });

  await prisma.changeRequest.create({
    data: {
      taskId: taskChg1.id,
      changeType: "normal",
      risk: "high",
      cabRequired: true,
      cabApprovalState: "requested",
      plannedStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      plannedEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      implementationPlan: "1. Provision parallel PG 16 instance. 2. Establish bidirectional logical replication stream. 3. Sync sequences and verify checksums. 4. Flip DNS alias.",
      backoutPlan: "In the event of verification failure prior to cutover, disconnect replica and maintain primary on PG 15 without data loss.",
      testPlan: "Run automated synthetic transaction suite against staging mirror with 5,000 simulated concurrent orders.",
      cmdbCiId: ciPostgres.id,
    },
  });

  // Approval record for CHG0001001
  await prisma.approvalRecord.create({
    data: {
      taskId: taskChg1.id,
      approverId: cabUser.id,
      state: "requested",
      approvalType: "cab",
      comments: "Awaiting final review of backout roll-back duration during Thursday CAB meeting.",
    },
  });

  // 10. Problems
  console.log("Creating Problem Records...");
  const taskPrb1 = await prisma.task.create({
    data: {
      number: "PRB0001001",
      sysClassName: "problem",
      shortDescription: "Intermittent connection reset timeouts under high packet load on VPN gateway",
      description: "Under sustained throughput (>850 Mbps), kernel crypto buffer exhausts ring descriptors leading to packet drop.",
      priority: 2,
      state: 2, // In Progress
      impact: 2,
      urgency: 2,
      assignedToId: itilUser.id,
      assignmentGroupId: groupSRE.id,
      openedById: itilUser.id,
    },
  });

  await prisma.problem.create({
    data: {
      taskId: taskPrb1.id,
      rootCause: "Insufficient ring descriptor buffer in Linux kernel e1000e network driver under AES-NI acceleration.",
      workaround: "Split incoming traffic across dual interface bonds and enable MTU clamping at 1420.",
      isKnownError: true,
    },
  });

  // 11. Knowledge Articles
  console.log("Creating Knowledge Articles...");
  await prisma.knowledgeArticle.createMany({
    data: [
      {
        number: "KB0001001",
        title: "How to configure GlobalProtect VPN client on macOS & Windows",
        category: "Network",
        content: `### Overview
This article provides step-by-step instructions for connecting to the corporate network using Palo Alto GlobalProtect.

### Prerequisites
- Active Okta / Auth0 corporate credentials
- Hardware token or Authenticator app registered

### Steps to Connect
1. Download GlobalProtect from the internal software portal.
2. Enter the portal address: **vpn-gw-east.corp.internal**
3. When prompted, complete your single sign-on authentication.
4. Verify the shield icon turns blue with the status **Connected**.

### Troubleshooting Common Errors
- **Connection Timeout**: Ensure you are not connected to another VPN or captive Wi-Fi portal.
- **Certificate Warning**: Download and trust the root internal CA certificate via Keychain or Certificate Manager.`,
        authorId: itilUser.id,
        views: 1420,
        helpfulVotes: 98,
        isPublished: true,
      },
      {
        number: "KB0001002",
        title: "Developer Guide: Requesting Temporary Elevated Cloud Access via AWS IAM",
        category: "Cloud Services",
        content: `### Policy Summary
Production cloud access requires zero-standing-privilege (ZSP) enforcement. All write permissions to production AWS accounts must be requested through OpenNow Service Catalog.

### Approval Requirements
- **Sandbox**: Auto-approved within 5 minutes.
- **Staging**: Team lead approval required.
- **Production**: CAB approval + ticket link required.

### Session Duration
All elevated IAM roles expire after 4 hours. Re-authentication with MFA is required to renew.`,
        authorId: adminUser.id,
        views: 890,
        helpfulVotes: 74,
        isPublished: true,
      },
      {
        number: "KB0001003",
        title: "Workstation Hardware Refresh Policy & Procurement Schedule",
        category: "Hardware",
        content: `### Refresh Eligibility
- Engineering and Design staff are eligible for hardware refresh every 24 months.
- General business and administrative staff are eligible every 36 months.

### Standard Equipment
Laptops are provisioned with 3-year AppleCare+ or Dell ProSupport Plus with next-business-day on-site repair.`,
        authorId: itilUser.id,
        views: 630,
        helpfulVotes: 45,
        isPublished: true,
      },
    ],
  });

  // 12. Business Rules (sys_script)
  console.log("Creating ServiceMeow Business Rules (sys_script)...");
  await prisma.sysScript.createMany({
    data: [
      {
        name: "Auto-assign Network Incidents to SRE",
        tableName: "incident",
        when: "before_insert",
        order: 100,
        filterConditions: JSON.stringify([{ field: "category", operator: "=", value: "network" }]),
        actionsJson: JSON.stringify({
          setFields: { assignmentGroupId: groupSRE.id },
          addWorkNote: "🐾 [ServiceMeow Business Rule: sys_script] Auto-assigned to Cloud Infrastructure & SRE based on Network classification.",
        }),
        description: "Routes incoming network tickets immediately to SRE infrastructure squad.",
        script: "// ServiceMeow Script\nif (current.category == 'network') { current.assignment_group = 'Cloud Infrastructure & SRE'; }",
      },
      {
        name: "P1 Major Cat-Astrophe Auto Work Note",
        tableName: "incident",
        when: "after_insert",
        order: 50,
        filterConditions: JSON.stringify([{ field: "priority", operator: "=", value: "1" }]),
        actionsJson: JSON.stringify({
          addWorkNote: "🚨 [ServiceMeow Business Rule: sys_script] P1 Critical Incident detected! Automated SRE war-room bridge initiated and SLA countdown activated.",
        }),
        description: "Inserts automated audit trail and alerts responders for P1 issues.",
        script: "// ServiceMeow Script\nif (current.priority == 1) { gs.addInfoMessage('P1 Cat-Alarm initiated!'); }",
      },
      {
        name: "High Risk Change CAB Enforcement",
        tableName: "change_request",
        when: "before_insert",
        order: 100,
        filterConditions: JSON.stringify([{ field: "risk", operator: "=", value: "high" }]),
        actionsJson: JSON.stringify({
          setFields: { cabRequired: true, cabApprovalState: "requested" },
          addWorkNote: "🔒 [ServiceMeow Business Rule: sys_script] High-risk change flagged for mandatory CAB review before deployment.",
        }),
        description: "Enforces CAB approval requirement whenever change risk is High.",
      },
      {
        name: "Incident Resolution Work Note",
        tableName: "incident",
        when: "after_update",
        order: 200,
        filterConditions: JSON.stringify([{ field: "state", operator: "=", value: "6" }]),
        actionsJson: JSON.stringify({
          addWorkNote: "✅ [ServiceMeow Business Rule: sys_script] State set to Resolved. Solution validated against close notes policy.",
        }),
        description: "Logs confirmation note when an incident is successfully resolved.",
      },
    ],
  });

  // 13. UI Policies (sys_ui_policy)
  console.log("Creating ServiceMeow UI Policies (sys_ui_policy)...");
  const uiPolicyResolve = await prisma.sysUiPolicy.create({
    data: {
      name: "Make Close Notes Mandatory on Resolve",
      tableName: "incident",
      conditionField: "state",
      conditionOperator: "=",
      conditionValue: "6",
      reverseIfFalse: true,
      shortDescription: "Ensures technician inputs resolution close notes when state is changed to Resolved.",
    },
  });

  await prisma.sysUiPolicyAction.createMany({
    data: [
      {
        uiPolicyId: uiPolicyResolve.id,
        fieldName: "close_notes",
        mandatory: "true",
        visible: "true",
      },
      {
        uiPolicyId: uiPolicyResolve.id,
        fieldName: "close_code",
        mandatory: "true",
        visible: "true",
      },
    ],
  });

  const uiPolicyCategory = await prisma.sysUiPolicy.create({
    data: {
      name: "Show Subcategory for Software & Network",
      tableName: "incident",
      conditionField: "category",
      conditionOperator: "in",
      conditionValue: "software,network",
      reverseIfFalse: true,
      shortDescription: "Dynamically unhides subcategory dropdown when category is Software or Network.",
    },
  });

  await prisma.sysUiPolicyAction.createMany({
    data: [
      {
        uiPolicyId: uiPolicyCategory.id,
        fieldName: "subcategory",
        mandatory: "ignore",
        visible: "true",
      },
    ],
  });

  const uiPolicyClosed = await prisma.sysUiPolicy.create({
    data: {
      name: "Lock Incident Fields When Closed",
      tableName: "incident",
      conditionField: "state",
      conditionOperator: "=",
      conditionValue: "7",
      reverseIfFalse: true,
      shortDescription: "Freezes form fields to Read-Only when an incident is fully Closed.",
    },
  });

  await prisma.sysUiPolicyAction.createMany({
    data: [
      { uiPolicyId: uiPolicyClosed.id, fieldName: "short_description", readOnly: "true" },
      { uiPolicyId: uiPolicyClosed.id, fieldName: "category", readOnly: "true" },
      { uiPolicyId: uiPolicyClosed.id, fieldName: "impact", readOnly: "true" },
      { uiPolicyId: uiPolicyClosed.id, fieldName: "urgency", readOnly: "true" },
    ],
  });

  // 14. Hub Flows (sys_hub_flow)
  console.log("Creating ServiceMeow Hub Flows (sys_hub_flow)...");
  await prisma.sysHubFlow.createMany({
    data: [
      {
        name: "P1 Major Incident Auto-Triage & Cat-Swarm Flow",
        triggerTable: "incident",
        triggerCondition: "priority=1",
        active: true,
        description: "Automated multi-step incident escalation dispatching notifications, emergency CAB review, and audit notes.",
        stepsJson: JSON.stringify([
          {
            step: 1,
            action: "notification",
            title: "Alert On-Call Paws",
            detail: "Dispatch emergency notification to Cloud Infrastructure & SRE on-call engineers via Slack/PagerDuty",
          },
          {
            step: 2,
            action: "create_approval",
            title: "Incident Commander Review",
            detail: "Require Major Incident Commander sign-off on remediation plan",
          },
          {
            step: 3,
            action: "work_note",
            title: "Audit Trail Stamp",
            detail: "🐾 P1 Cat-Swarm Flow successfully triggered. 1-Hour SLA countdown in progress.",
          },
        ]),
      },
      {
        name: "High-Risk Change CAB Review & Approval Workflow",
        triggerTable: "change_request",
        triggerCondition: "risk=high",
        active: true,
        description: "Change management governance flow routing high-risk releases through formal CAB director sign-off.",
        stepsJson: JSON.stringify([
          {
            step: 1,
            action: "create_approval",
            title: "Mandatory CAB Review",
            detail: "Assign review task to CAB Director (Marcus Vance) for security & rollback audit",
          },
          {
            step: 2,
            action: "notification",
            title: "Pre-Release Notification",
            detail: "Broadcast scheduled maintenance window to stakeholder distribution list",
          },
          {
            step: 3,
            action: "work_note",
            title: "Audit Log Stamp",
            detail: "Governance workflow initiated. Backout and test plans attached.",
          },
        ]),
      },
    ],
  });

  console.log("ServiceMeow Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
