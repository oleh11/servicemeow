import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    try {
      const match = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL=["']?([^"'\r\n]+)/m);
      if (match) process.env.DATABASE_URL = match[1];
    } catch {}
  }
  if (!process.env.DATABASE_URL) {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    process.env.DATABASE_URL = `file:${dbPath}`;
  }
}

// Seed passwords come from the environment; if unset, a random one is generated and
// printed once. There are no shared, hardcoded default passwords.
function seedPassword(envVar: string, label: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 8) return fromEnv;
  const generated = randomBytes(12).toString("base64url");
  console.log(`  [seed] ${label} password (set ${envVar} to choose your own): ${generated}`);
  return generated;
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ServiceMeow Database (Purr-fect Enterprise ITIL)...");

  // Clear existing data
  await prisma.sysCustomRecord.deleteMany();
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
  await prisma.cmnLocation.deleteMany();
  await prisma.cmnReservation.deleteMany();
  await prisma.cmnSpace.deleteMany();
  await prisma.cmnFloor.deleteMany();
  await prisma.cmnBuilding.deleteMany();
  await prisma.cmnCampus.deleteMany();
  await prisma.cmnState.deleteMany();
  await prisma.cmnRegion.deleteMany();
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
      { name: "cmn_region", label: "Region [cmn_region]", superClass: null, description: "Tier 1: Continental or macro-geographic administrative region" },
      { name: "cmn_state", label: "State / Province [cmn_state]", superClass: null, description: "Tier 2: State, province, or primary geographic subdivision" },
      { name: "cmn_campus", label: "Campus [cmn_campus]", superClass: null, description: "Tier 3: Corporate or clinical campus facility complex" },
      { name: "cmn_building", label: "Building [cmn_building]", superClass: null, description: "Tier 4: Physical architectural structure within a campus" },
      { name: "cmn_floor", label: "Floor / Level [cmn_floor]", superClass: null, description: "Tier 5: Vertical architectural floor level within a building" },
      { name: "cmn_space", label: "Space / Room [cmn_space]", superClass: null, description: "Tier 6: Individual functional room, operating suite, or workspace zone" },
      { name: "cmn_reservation", label: "Space Reservation [cmn_reservation]", superClass: null, description: "Workplace space and desk reservation booking" },
      { name: "cmn_location", label: "Unified Location [cmn_location]", superClass: null, description: "Legacy unified location hierarchy linking all 6 spatial tiers" },
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
      // Spatial Hierarchy Fields
      { tableName: "cmn_region", columnName: "name", columnLabel: "Region Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_region", columnName: "code", columnLabel: "Region Code", columnType: "string", isMandatory: true },
      { tableName: "cmn_state", columnName: "name", columnLabel: "State / Province Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_state", columnName: "code", columnLabel: "State Code", columnType: "string", isMandatory: true },
      { tableName: "cmn_state", columnName: "region", columnLabel: "Parent Region", columnType: "reference", referenceTable: "cmn_region", isMandatory: true },
      { tableName: "cmn_campus", columnName: "name", columnLabel: "Campus Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_campus", columnName: "code", columnLabel: "Campus Code", columnType: "string", isMandatory: true },
      { tableName: "cmn_campus", columnName: "state", columnLabel: "State / Province", columnType: "reference", referenceTable: "cmn_state", isMandatory: true },
      { tableName: "cmn_building", columnName: "name", columnLabel: "Building Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_building", columnName: "code", columnLabel: "Building Code", columnType: "string", isMandatory: true },
      { tableName: "cmn_building", columnName: "campus", columnLabel: "Campus", columnType: "reference", referenceTable: "cmn_campus", isMandatory: true },
      { tableName: "cmn_building", columnName: "building_type", columnLabel: "Building Type", columnType: "choice" },
      { tableName: "cmn_floor", columnName: "name", columnLabel: "Floor Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_floor", columnName: "floor_number", columnLabel: "Floor Number", columnType: "integer", isMandatory: true },
      { tableName: "cmn_floor", columnName: "code", columnLabel: "Floor Code", columnType: "string", isMandatory: true },
      { tableName: "cmn_floor", columnName: "building", columnLabel: "Building", columnType: "reference", referenceTable: "cmn_building", isMandatory: true },
      { tableName: "cmn_space", columnName: "name", columnLabel: "Space Name", columnType: "string", isMandatory: true },
      { tableName: "cmn_space", columnName: "space_number", columnLabel: "Space / Room Number", columnType: "string", isMandatory: true },
      { tableName: "cmn_space", columnName: "floor", columnLabel: "Floor Level", columnType: "reference", referenceTable: "cmn_floor", isMandatory: true },
      { tableName: "cmn_space", columnName: "space_type", columnLabel: "Space Type", columnType: "choice", defaultVal: "Office" },
      { tableName: "cmn_space", columnName: "status", columnLabel: "Occupancy Status", columnType: "choice", defaultVal: "vacant" },
      { tableName: "cmn_space", columnName: "capacity", columnLabel: "Capacity", columnType: "integer", defaultVal: "1" },
      { tableName: "cmdb_ci", columnName: "space", columnLabel: "Space / Room", columnType: "reference", referenceTable: "cmn_space" },
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
      // Spatial Occupancy Status
      { tableName: "cmn_space", columnName: "status", label: "Occupied", value: "occupied", sequence: 10 },
      { tableName: "cmn_space", columnName: "status", label: "Vacant", value: "vacant", sequence: 20 },
      { tableName: "cmn_space", columnName: "status", label: "Reserved", value: "reserved", sequence: 30 },
      { tableName: "cmn_space", columnName: "status", label: "Maintenance", value: "maintenance", sequence: 40 },
      // Space Types
      { tableName: "cmn_space", columnName: "space_type", label: "Operating Room", value: "Operating Room", sequence: 10 },
      { tableName: "cmn_space", columnName: "space_type", label: "ICU / Clinical", value: "ICU / Clinical", sequence: 20 },
      { tableName: "cmn_space", columnName: "space_type", label: "Server Room / MDF", value: "Server Room", sequence: 30 },
      { tableName: "cmn_space", columnName: "space_type", label: "Conference Room", value: "Conference Room", sequence: 40 },
      { tableName: "cmn_space", columnName: "space_type", label: "Office", value: "Office", sequence: 50 },
      { tableName: "cmn_space", columnName: "space_type", label: "Laboratory", value: "Laboratory", sequence: 60 },
      // Building Types
      { tableName: "cmn_building", columnName: "building_type", label: "Hospital / Clinical", value: "Hospital / Clinical", sequence: 10 },
      { tableName: "cmn_building", columnName: "building_type", label: "Laboratory", value: "Laboratory", sequence: 20 },
      { tableName: "cmn_building", columnName: "building_type", label: "Office / Data Center", value: "Office / Data Center", sequence: 30 },
      { tableName: "cmn_building", columnName: "building_type", label: "Logistics / Warehouse", value: "Logistics / Warehouse", sequence: 40 },
    ],
  });

  // 4. Users
  console.log("Creating System Users & Groups...");
  const adminPasswordHash = await bcrypt.hash(seedPassword("SEED_ADMIN_PASSWORD", "Admin"), 10);
  const defaultPasswordHash = await bcrypt.hash(seedPassword("SEED_DEFAULT_PASSWORD", "Default (all non-admin users)"), 10);

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

  const workplaceUser = await prisma.user.create({
    data: {
      userName: "workplace.admin",
      email: "workplace.admin@servicemeow.io",
      name: "Morgan 'Blueprint' Reed",
      title: "Director of Real Estate & Workplace Technology",
      department: "Global Workplace Hub",
      role: "workplace_admin",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces",
    },
  });

  const catalogUser = await prisma.user.create({
    data: {
      userName: "catalog.admin",
      email: "catalog.admin@servicemeow.io",
      name: "Chloe 'Spec' Montgomery",
      title: "Principal Service Catalog Architect",
      department: "IT Service Catalog",
      role: "catalog_admin",
      passwordHash: defaultPasswordHash,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop&crop=faces",
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

  const groupWorkplace = await prisma.group.create({
    data: {
      name: "Workplace & Real Estate Operations",
      description: "Connected Workplace facility planning, spatial hierarchy, CAD blueprints, and room reservation governance",
      roles: "workplace_admin",
      managerId: workplaceUser.id,
    },
  });

  const groupCatalog = await prisma.group.create({
    data: {
      name: "Service Catalog Operations",
      description: "Catalog item authoring, record producers, variable mapping, and checkout workflows",
      roles: "catalog_admin",
      managerId: catalogUser.id,
    },
  });

  // Add memberships
  await prisma.userGroupMember.createMany({
    data: [
      { userId: itilUser.id, groupId: groupServiceDesk.id },
      { userId: itilUser.id, groupId: groupSRE.id },
      { userId: cabUser.id, groupId: groupCAB.id },
      { userId: adminUser.id, groupId: groupDBA.id },
      { userId: workplaceUser.id, groupId: groupWorkplace.id },
      { userId: catalogUser.id, groupId: groupCatalog.id },
    ],
  });

  // 5. 6-Tier Spatial Hierarchy (Connected Workplace / Enterprise Facility & Space Management)
  console.log("Creating 6-Tier Connected Workplace Spatial Hierarchy...");

  // Tier 1: Region
  const regionAmer = await prisma.cmnRegion.create({
    data: {
      name: "Americas",
      code: "AMER",
      description: "North, Central & South America corporate & healthcare territories",
      active: true,
    },
  });

  const regionEMEA = await prisma.cmnRegion.create({
    data: {
      name: "Europe, Middle East & Africa",
      code: "EMEA",
      description: "EMEA clinical centers & research institutes",
      active: true,
    },
  });

  // Tier 2: State / Province
  const stateCA = await prisma.cmnState.create({
    data: {
      name: "California",
      code: "US-CA",
      country: "United States",
      regionId: regionAmer.id,
    },
  });

  const stateNY = await prisma.cmnState.create({
    data: {
      name: "New York",
      code: "US-NY",
      country: "United States",
      regionId: regionAmer.id,
    },
  });

  const stateTX = await prisma.cmnState.create({
    data: {
      name: "Texas",
      code: "US-TX",
      country: "United States",
      regionId: regionAmer.id,
    },
  });

  // Tier 3: Campus
  const campusSV = await prisma.cmnCampus.create({
    data: {
      name: "Silicon Valley Innovation Campus",
      code: "SV-CAMPUS",
      stateId: stateCA.id,
      address: "100 Tech Enterprise Blvd",
      city: "San Jose",
      zipCode: "95134",
      latitude: 37.403,
      longitude: -121.944,
    },
  });

  const campusSFMed = await prisma.cmnCampus.create({
    data: {
      name: "San Francisco Mission Bay Medical Campus",
      code: "SF-MED-CAMPUS",
      stateId: stateCA.id,
      address: "1600 Owens Street",
      city: "San Francisco",
      zipCode: "94158",
      latitude: 37.768,
      longitude: -122.392,
    },
  });

  // Tier 4: Building
  const bldgSurg = await prisma.cmnBuilding.create({
    data: {
      name: "Pavilion A - Surgical & Critical Care",
      code: "BLDG-A-SURG",
      campusId: campusSFMed.id,
      buildingType: "Hospital / Clinical",
      floorsCount: 5,
      totalAreaSqFt: 185000,
    },
  });

  const bldgLabs = await prisma.cmnBuilding.create({
    data: {
      name: "Pavilion B - Diagnostic Research & Labs",
      code: "BLDG-B-LABS",
      campusId: campusSFMed.id,
      buildingType: "Laboratory",
      floorsCount: 4,
      totalAreaSqFt: 120000,
    },
  });

  const bldgTechTwr = await prisma.cmnBuilding.create({
    data: {
      name: "Tech Tower One - Operations & Data Center",
      code: "TECH-TWR-1",
      campusId: campusSV.id,
      buildingType: "Office / Data Center",
      floorsCount: 8,
      totalAreaSqFt: 250000,
    },
  });

  // Tier 5: Floor
  const flSurg01 = await prisma.cmnFloor.create({
    data: {
      name: "Level 1 - Emergency & Triage",
      floorNumber: 1,
      code: "L1-ER",
      buildingId: bldgSurg.id,
      areaSqFt: 35000,
    },
  });

  const flSurg02 = await prisma.cmnFloor.create({
    data: {
      name: "Level 2 - Intensive Care Unit (ICU)",
      floorNumber: 2,
      code: "L2-ICU",
      buildingId: bldgSurg.id,
      areaSqFt: 38000,
    },
  });

  const flSurg03 = await prisma.cmnFloor.create({
    data: {
      name: "Level 3 - Operating Suites & Surgery",
      floorNumber: 3,
      code: "L3-OR",
      buildingId: bldgSurg.id,
      areaSqFt: 40000,
    },
  });

  const flTech04 = await prisma.cmnFloor.create({
    data: {
      name: "Level 4 - Workplace Hub & Collaboration Center",
      floorNumber: 4,
      code: "L4-WH",
      buildingId: bldgTechTwr.id,
      floorplanSvgUrl: "/floorplans/tech_tower_l4.svg",
      floorplanImageUrl: "/floorplans/tech_tower_l4.svg",
      areaSqFt: 32000,
    },
  });

  // Enterprise Benchmark Building: World Technology Headquarters (HQ)
  const bldgHQ = await prisma.cmnBuilding.create({
    data: {
      name: "Corporate Headquarters Tower (HQ)",
      code: "HQ",
      campusId: campusSV.id,
      buildingType: "Corporate Office Complex",
      floorsCount: 20,
      totalAreaSqFt: 320000,
    },
  });

  const flHQ15 = await prisma.cmnFloor.create({
    data: {
      name: "Floor 15 - Engineering Operations",
      floorNumber: 15,
      code: "HQ15",
      buildingId: bldgHQ.id,
      floorplanSvgUrl: "/floorplans/hq_floor_18.svg",
      areaSqFt: 5373.24,
    },
  });

  const flHQ17 = await prisma.cmnFloor.create({
    data: {
      name: "Floor 17 - Systems & Hardware Architecture",
      floorNumber: 17,
      code: "HQ17",
      buildingId: bldgHQ.id,
      floorplanSvgUrl: "/floorplans/hq_floor_18.svg",
      areaSqFt: 5287.06,
    },
  });

  const flHQ18 = await prisma.cmnFloor.create({
    data: {
      name: "Floor 18 - Electronic Systems & Executive Wing",
      floorNumber: 18,
      code: "HQ18",
      buildingId: bldgHQ.id,
      floorplanSvgUrl: "/floorplans/hq_floor_18.svg",
      floorplanImageUrl: "/floorplans/hq_floor_18.svg",
      areaSqFt: 5136.79,
    },
  });

  const flHQ19 = await prisma.cmnFloor.create({
    data: {
      name: "Floor 19 - Product Strategy & Leadership",
      floorNumber: 19,
      code: "HQ19",
      buildingId: bldgHQ.id,
      floorplanSvgUrl: "/floorplans/hq_floor_18.svg",
      areaSqFt: 5447.06,
    },
  });

  const flHQB1 = await prisma.cmnFloor.create({
    data: {
      name: "Basement Level 1 - Central Logistics & Data Vault",
      floorNumber: -1,
      code: "HQB1",
      buildingId: bldgHQ.id,
      floorplanSvgUrl: "/floorplans/hq_floor_18.svg",
      areaSqFt: 6428.73,
    },
  });

  // Tier 6: Space / Room
  const spaceOR301 = await prisma.cmnSpace.create({
    data: {
      name: "Robotic Surgery Suite 1",
      spaceNumber: "OR-301",
      floorId: flSurg03.id,
      spaceType: "Operating Room",
      status: "occupied",
      capacity: 8,
      squareFeet: 650,
      department: "Surgical Services",
      svgElementId: "room-or-301",
    },
  });

  const spaceOR302 = await prisma.cmnSpace.create({
    data: {
      name: "Cardiovascular Surgery Suite 2",
      spaceNumber: "OR-302",
      floorId: flSurg03.id,
      spaceType: "Operating Room",
      status: "occupied",
      capacity: 10,
      squareFeet: 720,
      department: "Cardiology",
      svgElementId: "room-or-302",
    },
  });

  const spaceOR303 = await prisma.cmnSpace.create({
    data: {
      name: "Orthopedic Surgery Suite 3",
      spaceNumber: "OR-303",
      floorId: flSurg03.id,
      spaceType: "Operating Room",
      status: "vacant",
      capacity: 6,
      squareFeet: 580,
      department: "Orthopedics",
      svgElementId: "room-or-303",
    },
  });

  const spacePACU = await prisma.cmnSpace.create({
    data: {
      name: "Post-Anesthesia Care Recovery Unit",
      spaceNumber: "PACU-320",
      floorId: flSurg03.id,
      spaceType: "ICU / Clinical",
      status: "occupied",
      capacity: 12,
      squareFeet: 1200,
      department: "Anesthesiology",
      svgElementId: "room-pacu-320",
    },
  });

  const spaceICU201 = await prisma.cmnSpace.create({
    data: {
      name: "Trauma Intensive Care Unit Bed 1",
      spaceNumber: "ICU-201",
      floorId: flSurg02.id,
      spaceType: "ICU / Clinical",
      status: "occupied",
      capacity: 2,
      squareFeet: 350,
      department: "Critical Care",
      svgElementId: "room-icu-201",
    },
  });

  const spaceICU202 = await prisma.cmnSpace.create({
    data: {
      name: "Cardiac Intensive Care Unit Bed 2",
      spaceNumber: "ICU-202",
      floorId: flSurg02.id,
      spaceType: "ICU / Clinical",
      status: "vacant",
      capacity: 2,
      squareFeet: 350,
      department: "Critical Care",
      svgElementId: "room-icu-202",
    },
  });

  const spaceMDF401 = await prisma.cmnSpace.create({
    data: {
      name: "Main Data Center & Telecomm Vault",
      spaceNumber: "MDF-401",
      floorId: flTech04.id,
      spaceType: "Server Room",
      status: "occupied",
      capacity: 4,
      squareFeet: 3200,
      department: "IT Infrastructure",
      svgElementId: "room-mdf-401",
    },
  });

  const spaceCONF410 = await prisma.cmnSpace.create({
    data: {
      name: "Executive Boardroom 410",
      spaceNumber: "CONF-410",
      floorId: flTech04.id,
      spaceType: "Conference Room",
      status: "available",
      capacity: 20,
      squareFeet: 850,
      department: "Executive Leadership",
      svgElementId: "svg-room-conf-410",
      capabilities: JSON.stringify(["teams", "zoom", "whiteboard", "4k_projector"]),
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      floorplanX: 4.0,
      floorplanY: 9.1,
      floorplanWidth: 26.0,
      floorplanHeight: 34.1,
    },
  });

  const spaceCONF405 = await prisma.cmnSpace.create({
    data: {
      name: "Agile Teams Huddle 405",
      spaceNumber: "CONF-405",
      floorId: flTech04.id,
      spaceType: "Huddle Room",
      status: "available",
      capacity: 6,
      squareFeet: 280,
      department: "Engineering",
      svgElementId: "svg-room-conf-405",
      capabilities: JSON.stringify(["teams", "whiteboard"]),
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
      floorplanX: 33.0,
      floorplanY: 9.1,
      floorplanWidth: 19.0,
      floorplanHeight: 22.5,
    },
  });

  const spaceCONF408 = await prisma.cmnSpace.create({
    data: {
      name: "Zoom Studio Suite 408",
      spaceNumber: "CONF-408",
      floorId: flTech04.id,
      spaceType: "Video Suite",
      status: "available",
      capacity: 8,
      squareFeet: 360,
      department: "Product Marketing",
      svgElementId: "svg-room-conf-408",
      capabilities: JSON.stringify(["zoom", "whiteboard", "telepresence"]),
      imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
      floorplanX: 54.0,
      floorplanY: 9.1,
      floorplanWidth: 19.0,
      floorplanHeight: 22.5,
    },
  });

  const spaceCONF420 = await prisma.cmnSpace.create({
    data: {
      name: "Global Hybrid Arena 420",
      spaceNumber: "CONF-420",
      floorId: flTech04.id,
      spaceType: "Auditorium",
      status: "available",
      capacity: 60,
      squareFeet: 1800,
      department: "All-Hands Operations",
      svgElementId: "svg-room-conf-420",
      capabilities: JSON.stringify(["teams", "zoom", "telepresence", "4k_projector", "microphones"]),
      imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80",
      floorplanX: 75.0,
      floorplanY: 9.1,
      floorplanWidth: 21.0,
      floorplanHeight: 81.6,
    },
  });

  const spaceDESK401 = await prisma.cmnSpace.create({
    data: {
      name: "Ergonomic Standing Desk 401",
      spaceNumber: "DESK-401",
      floorId: flTech04.id,
      spaceType: "Hot Desk",
      status: "available",
      capacity: 1,
      squareFeet: 55,
      department: "Digital Workplace",
      svgElementId: "svg-desk-401",
      capabilities: JSON.stringify(["standing_desk", "teams", "dual_monitor"]),
      imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80",
      floorplanX: 34.5,
      floorplanY: 40.0,
      floorplanWidth: 10.5,
      floorplanHeight: 8.6,
    },
  });

  const spaceDESK402 = await prisma.cmnSpace.create({
    data: {
      name: "Ergonomic Standing Desk 402",
      spaceNumber: "DESK-402",
      floorId: flTech04.id,
      spaceType: "Hot Desk",
      status: "available",
      capacity: 1,
      squareFeet: 55,
      department: "Digital Workplace",
      svgElementId: "svg-desk-402",
      capabilities: JSON.stringify(["standing_desk", "zoom", "dual_monitor"]),
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      floorplanX: 47.0,
      floorplanY: 40.0,
      floorplanWidth: 10.5,
      floorplanHeight: 8.6,
    },
  });

  const spaceDESK403 = await prisma.cmnSpace.create({
    data: {
      name: "Ergonomic Standing Desk 403",
      spaceNumber: "DESK-403",
      floorId: flTech04.id,
      spaceType: "Hot Desk",
      status: "available",
      capacity: 1,
      squareFeet: 55,
      department: "Digital Workplace",
      svgElementId: "svg-desk-403",
      capabilities: JSON.stringify(["standing_desk", "teams", "zoom", "dual_monitor"]),
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      floorplanX: 59.5,
      floorplanY: 40.0,
      floorplanWidth: 10.5,
      floorplanHeight: 8.6,
    },
  });

  const spacePOD415 = await prisma.cmnSpace.create({
    data: {
      name: "Acoustic Quiet Pod 415",
      spaceNumber: "POD-415",
      floorId: flTech04.id,
      spaceType: "Focus Pod",
      status: "available",
      capacity: 2,
      squareFeet: 75,
      department: "Focus Zone",
      svgElementId: "svg-room-pod-415",
      capabilities: JSON.stringify(["teams", "zoom"]),
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      floorplanX: 4.0,
      floorplanY: 46.6,
      floorplanWidth: 13.0,
      floorplanHeight: 44.1,
    },
  });

  const spaceLAB430 = await prisma.cmnSpace.create({
    data: {
      name: "Hardware Prototyping & IoT Lab",
      spaceNumber: "LAB-430",
      floorId: flTech04.id,
      spaceType: "Innovation Lab",
      status: "available",
      capacity: 12,
      squareFeet: 720,
      department: "Hardware Engineering",
      svgElementId: "svg-room-lab-430",
      capabilities: JSON.stringify(["standing_desk", "whiteboard", "teams"]),
      imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
      floorplanX: 19.0,
      floorplanY: 53.3,
      floorplanWidth: 24.0,
      floorplanHeight: 37.5,
    },
  });

  const spaceLOUNGE450 = await prisma.cmnSpace.create({
    data: {
      name: "Commons & Team Lounge 450",
      spaceNumber: "LOUNGE-450",
      floorId: flTech04.id,
      spaceType: "Breakout Lounge",
      status: "available",
      capacity: 25,
      squareFeet: 920,
      department: "Employee Experience",
      svgElementId: "svg-room-lounge-450",
      capabilities: JSON.stringify(["whiteboard"]),
      imageUrl: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
      floorplanX: 45.0,
      floorplanY: 53.3,
      floorplanWidth: 28.0,
      floorplanHeight: 37.5,
    },
  });

  // ==============================================================
  // Enterprise Spatial Benchmark: 21 Spaces for HQ Floor 18 (Electronic Systems & Executive)
  // ==============================================================
  const hq18Spaces = [
    {
      name: "Electronic Systems Engineering Suite 101",
      spaceNumber: "101",
      spaceType: "Office",
      status: "occupied",
      capacity: 6,
      squareFeet: 420,
      department: "Electronic Systems",
      svgElementId: "room-101",
      floorplanX: 13.5,
      floorplanY: 17.5,
      floorplanWidth: 12.0,
      floorplanHeight: 14.5,
    },
    {
      name: "Electronic Systems Engineering Suite 102",
      spaceNumber: "102",
      spaceType: "Office",
      status: "occupied",
      capacity: 6,
      squareFeet: 430,
      department: "Electronic Systems",
      svgElementId: "room-102",
      floorplanX: 23.0,
      floorplanY: 11.5,
      floorplanWidth: 12.0,
      floorplanHeight: 15.0,
    },
    {
      name: "Electronic Systems Engineering Suite 103",
      spaceNumber: "103",
      spaceType: "Office",
      status: "occupied",
      capacity: 6,
      squareFeet: 430,
      department: "Electronic Systems",
      svgElementId: "room-103",
      floorplanX: 36.0,
      floorplanY: 11.5,
      floorplanWidth: 12.0,
      floorplanHeight: 15.0,
    },
    {
      name: "Agile Collaboration Suite 104",
      spaceNumber: "104",
      spaceType: "Meeting",
      status: "available",
      capacity: 8,
      squareFeet: 450,
      department: "Electronic Systems",
      svgElementId: "room-104",
      floorplanX: 49.5,
      floorplanY: 11.5,
      floorplanWidth: 12.0,
      floorplanHeight: 15.0,
    },
    {
      name: "Strategy Conference Room 105",
      spaceNumber: "105",
      spaceType: "Meeting",
      status: "available",
      capacity: 10,
      squareFeet: 480,
      department: "Electronic Systems",
      svgElementId: "room-105",
      floorplanX: 63.0,
      floorplanY: 17.5,
      floorplanWidth: 12.0,
      floorplanHeight: 14.5,
    },
    {
      name: "Electronic Systems Development 110",
      spaceNumber: "110",
      spaceType: "Office",
      status: "occupied",
      capacity: 4,
      squareFeet: 360,
      department: "Electronic Systems",
      svgElementId: "room-110",
      floorplanX: 63.5,
      floorplanY: 50.5,
      floorplanWidth: 11.5,
      floorplanHeight: 14.5,
    },
    {
      name: "Hardware Systems Verification Lab 111",
      spaceNumber: "111",
      spaceType: "Lab",
      status: "available",
      capacity: 8,
      squareFeet: 520,
      department: "Electronic Systems",
      svgElementId: "room-111",
      floorplanX: 63.5,
      floorplanY: 67.0,
      floorplanWidth: 11.5,
      floorplanHeight: 15.5,
    },
    {
      name: "Executive Vice President Suite 112",
      spaceNumber: "112",
      spaceType: "Executive",
      status: "available",
      capacity: 8,
      squareFeet: 680,
      department: "Executive Leadership",
      svgElementId: "room-112",
      floorplanX: 76.5,
      floorplanY: 67.0,
      floorplanWidth: 13.5,
      floorplanHeight: 16.5,
    },
    {
      name: "Electronic Systems Integration Bay 113",
      spaceNumber: "113",
      spaceType: "Workstation",
      status: "occupied",
      capacity: 4,
      squareFeet: 280,
      department: "Electronic Systems",
      svgElementId: "room-113",
      floorplanX: 54.0,
      floorplanY: 71.0,
      floorplanWidth: 8.5,
      floorplanHeight: 13.0,
    },
    {
      name: "Electronic Systems Integration Bay 114",
      spaceNumber: "114",
      spaceType: "Workstation",
      status: "available",
      capacity: 4,
      squareFeet: 280,
      department: "Electronic Systems",
      svgElementId: "room-114",
      floorplanX: 54.0,
      floorplanY: 84.5,
      floorplanWidth: 8.5,
      floorplanHeight: 10.0,
    },
    {
      name: "Electronic Systems Integration Bay 115",
      spaceNumber: "115",
      spaceType: "Workstation",
      status: "occupied",
      capacity: 4,
      squareFeet: 280,
      department: "Electronic Systems",
      svgElementId: "room-115",
      floorplanX: 44.5,
      floorplanY: 71.0,
      floorplanWidth: 8.5,
      floorplanHeight: 13.0,
    },
    {
      name: "Electronic Systems Integration Bay 116",
      spaceNumber: "116",
      spaceType: "Workstation",
      status: "available",
      capacity: 4,
      squareFeet: 280,
      department: "Electronic Systems",
      svgElementId: "room-116",
      floorplanX: 44.5,
      floorplanY: 84.5,
      floorplanWidth: 8.5,
      floorplanHeight: 10.0,
    },
    {
      name: "Agile Team Pod 117",
      spaceNumber: "117",
      spaceType: "Open Plan",
      status: "occupied",
      capacity: 10,
      squareFeet: 580,
      department: "Product Engineering",
      svgElementId: "room-117",
      floorplanX: 24.5,
      floorplanY: 69.5,
      floorplanWidth: 15.5,
      floorplanHeight: 16.0,
    },
    {
      name: "Software Systems Lab 118",
      spaceNumber: "118",
      spaceType: "Lab",
      status: "available",
      capacity: 8,
      squareFeet: 620,
      department: "Product Engineering",
      svgElementId: "room-118",
      floorplanX: 9.5,
      floorplanY: 62.5,
      floorplanWidth: 14.0,
      floorplanHeight: 19.5,
    },
    {
      name: "Electronic Systems Ops 120",
      spaceNumber: "120",
      spaceType: "Office",
      status: "occupied",
      capacity: 4,
      squareFeet: 310,
      department: "Electronic Systems",
      svgElementId: "room-120",
      floorplanX: 45.0,
      floorplanY: 39.0,
      floorplanWidth: 9.0,
      floorplanHeight: 10.0,
    },
    {
      name: "Restroom Facility Core 121",
      spaceNumber: "121",
      spaceType: "Service Area",
      status: "available",
      capacity: 12,
      squareFeet: 650,
      department: "Facilities",
      svgElementId: "room-121",
      floorplanX: 9.5,
      floorplanY: 38.0,
      floorplanWidth: 15.0,
      floorplanHeight: 20.0,
    },
    {
      name: "Executive Suite 130",
      spaceNumber: "130",
      spaceType: "Executive",
      status: "occupied",
      capacity: 6,
      squareFeet: 550,
      department: "Executive Leadership",
      svgElementId: "room-130",
      floorplanX: 76.5,
      floorplanY: 48.0,
      floorplanWidth: 13.5,
      floorplanHeight: 17.0,
    },
    {
      name: "Electronic Systems Office 135",
      spaceNumber: "135",
      spaceType: "Office",
      status: "occupied",
      capacity: 4,
      squareFeet: 360,
      department: "Electronic Systems",
      svgElementId: "room-135",
      floorplanX: 63.5,
      floorplanY: 33.5,
      floorplanWidth: 11.5,
      floorplanHeight: 15.0,
    },
    {
      name: "Executive Boardroom 136",
      spaceNumber: "136",
      spaceType: "Executive",
      status: "available",
      capacity: 14,
      squareFeet: 720,
      department: "Executive Leadership",
      svgElementId: "room-136",
      floorplanX: 76.5,
      floorplanY: 30.0,
      floorplanWidth: 13.5,
      floorplanHeight: 16.5,
    },
    {
      name: "Chief Executive Office 137",
      spaceNumber: "137",
      spaceType: "Executive",
      status: "occupied",
      capacity: 8,
      squareFeet: 750,
      department: "Executive Leadership",
      svgElementId: "room-137",
      floorplanX: 76.5,
      floorplanY: 11.5,
      floorplanWidth: 13.5,
      floorplanHeight: 16.5,
    },
    {
      name: "Primary Circulation Atrium 160",
      spaceNumber: "160",
      spaceType: "Primary Circulation Area",
      status: "available",
      capacity: 30,
      squareFeet: 2800,
      department: "Facilities",
      svgElementId: "room-160",
      floorplanX: 30.0,
      floorplanY: 29.0,
      floorplanWidth: 32.0,
      floorplanHeight: 28.0,
    },
  ];

  for (const spData of hq18Spaces) {
    await prisma.cmnSpace.create({
      data: {
        ...spData,
        floorId: flHQ18.id,
        capabilities: JSON.stringify(["teams", "zoom", "whiteboard", "high_speed_wifi"]),
      },
    });
  }

  // Cross-compatibility Unified CmnLocation records
  const locAmericas = await prisma.cmnLocation.create({
    data: {
      name: "Americas",
      locationType: "region",
      regionId: regionAmer.id,
      fullPath: "Americas",
    },
  });

  const locCalifornia = await prisma.cmnLocation.create({
    data: {
      name: "California",
      state: "CA",
      country: "United States",
      locationType: "state",
      parentId: locAmericas.id,
      regionId: regionAmer.id,
      stateRefId: stateCA.id,
      fullPath: "Americas / California",
    },
  });

  const locSFMed = await prisma.cmnLocation.create({
    data: {
      name: "San Francisco Mission Bay Medical Center",
      city: "San Francisco",
      state: "CA",
      country: "United States",
      locationType: "campus",
      parentId: locCalifornia.id,
      regionId: regionAmer.id,
      stateRefId: stateCA.id,
      campusId: campusSFMed.id,
      fullPath: "Americas / California / San Francisco Mission Bay / Pavilion A",
    },
  });

  const locOR301 = await prisma.cmnLocation.create({
    data: {
      name: "Mission Bay - OR Suite 301",
      city: "San Francisco",
      state: "CA",
      country: "United States",
      locationType: "space",
      parentId: locSFMed.id,
      regionId: regionAmer.id,
      stateRefId: stateCA.id,
      campusId: campusSFMed.id,
      buildingId: bldgSurg.id,
      floorId: flSurg03.id,
      spaceId: spaceOR301.id,
      fullPath: "Americas / California / San Francisco Mission Bay / Pavilion A / Level 3 / OR-301",
    },
  });

  // 6. CMDB Configuration Items
  console.log("Creating CMDB Configuration Items & Topology...");
  const ciPortal = await prisma.configurationItem.create({
    data: {
      name: "Customer E-Commerce Portal",
      ciClass: "business_service",
      status: "in_service",
      environment: "production",
      tier: "Tier 1 - Mission Critical",
      owner: "Alex Chen",
      locationId: locSFMed.id,
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
      spaceId: spaceMDF401.id,
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
      spaceId: spaceMDF401.id,
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
      spaceId: spaceMDF401.id,
    },
  });

  // Biomedical & IoT Medical Device CIs linked to spaces
  const ciRobot = await prisma.configurationItem.create({
    data: {
      name: "da Vinci Xi Surgical Robot System #1",
      ciClass: "biomedical_device",
      sysClass: "cmdb_ci_medical",
      status: "in_service",
      operationalStatus: "operational",
      environment: "production",
      assetTag: "MED-ROBOT-001",
      tier: "Tier 1 - Life Safety",
      owner: "Clinical Engineering",
      spaceId: spaceOR301.id,
      locationId: locOR301.id,
    },
  });

  const ciHeartMonitor = await prisma.configurationItem.create({
    data: {
      name: "Philips IntelliSpace Multi-Lead ECG Station",
      ciClass: "biomedical_device",
      sysClass: "cmdb_ci_medical",
      status: "in_service",
      operationalStatus: "operational",
      environment: "production",
      assetTag: "MED-ECG-108",
      tier: "Tier 1 - Life Safety",
      owner: "Cardiology Tech",
      spaceId: spaceOR302.id,
    },
  });

  const ciPatientMonitor = await prisma.configurationItem.create({
    data: {
      name: "GE Carescape B850 Bedside Patient Monitor",
      ciClass: "biomedical_device",
      sysClass: "cmdb_ci_medical",
      status: "in_service",
      operationalStatus: "operational",
      environment: "production",
      assetTag: "MED-MON-042",
      tier: "Tier 1 - Life Safety",
      owner: "Clinical Engineering",
      spaceId: spaceICU201.id,
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

  // Workplace & Facility Catalog Items
  const catStandingDesk = await prisma.catalogItem.create({
    data: {
      name: "Ergonomic Standing Desk & Dual Monitor Allocation",
      shortDescription: "Motorized sit-stand workstation setup with dual 4K USB-C monitors and cable management.",
      description: "Enterprise ergonomic workstation provisioning. Includes programmable motorized standing desk, dual 27-inch 4K USB-C daisy-chained displays, heavy-duty monitor arms, and integrated power delivery.",
      category: "Workplace & Facilities",
      price: 1250.0,
      icon: "Armchair",
      deliveryDays: 3,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catStandingDesk.id,
        name: "target_location",
        label: "Office Space or Desk Number",
        varType: "string",
        isMandatory: true,
        order: 1,
      },
      {
        catalogItemId: catStandingDesk.id,
        name: "desk_width",
        label: "Worksurface Dimensions",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["60 x 30 inch (Standard Office)", "72 x 30 inch (Executive / Engineering)", "48 x 24 inch (Compact Huddle)"]),
        order: 2,
      },
      {
        catalogItemId: catStandingDesk.id,
        name: "monitor_arm_type",
        label: "Monitor Arm Configuration",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Dual Screen Horizontal", "Dual Screen Vertical Stack", "Single Ultrawide 49-inch"]),
        order: 3,
      },
    ],
  });

  const catAVSetup = await prisma.catalogItem.create({
    data: {
      name: "Conference Room & Event AV Setup Request",
      shortDescription: "High-definition telepresence, wireless mics, and multi-camera live streaming for corporate events.",
      description: "Dedicated on-site AV technician dispatch for critical all-hands presentations, board meetings, or live webinars. Configures Microsoft Teams / Zoom Rooms, digital whiteboards, lavalier mics, and recording relays.",
      category: "Workplace & Facilities",
      price: 0.0,
      icon: "Building2",
      deliveryDays: 1,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catAVSetup.id,
        name: "event_space",
        label: "Selected Space / Room",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Global Hybrid Arena 420", "Executive Boardroom 402", "Zoom Studio Suite 408", "Microsoft Teams Room 404"]),
        order: 1,
      },
      {
        catalogItemId: catAVSetup.id,
        name: "platform",
        label: "Streaming / Meeting Platform",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Microsoft Teams Live Event", "Zoom Webinar (500+ attendees)", "Internal Hybrid Broadcast", "In-Room Only Recording"]),
        order: 2,
      },
      {
        catalogItemId: catAVSetup.id,
        name: "support_level",
        label: "Technician Presence",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Pre-event 15-minute soundcheck only", "Full dedicated technician for duration of event"]),
        order: 3,
      },
    ],
  });

  const catOfficeMove = await prisma.catalogItem.create({
    data: {
      name: "Office Move & Workspace Reconfiguration",
      shortDescription: "Relocate personal belongings, IT equipment, and assigned desk between floors or buildings.",
      description: "Coordination request for Facilities & IT logistics to relocate team pods or individual staff. Includes packing crates delivery, computer disconnect/reconnect, and CMDB asset space reassignment.",
      category: "Workplace & Facilities",
      price: 0.0,
      icon: "Box",
      deliveryDays: 5,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catOfficeMove.id,
        name: "current_space",
        label: "Current Desk / Space Number",
        varType: "string",
        isMandatory: true,
        order: 1,
      },
      {
        catalogItemId: catOfficeMove.id,
        name: "destination_space",
        label: "Target Floor & Room Number",
        varType: "string",
        isMandatory: true,
        order: 2,
      },
      {
        catalogItemId: catOfficeMove.id,
        name: "move_date",
        label: "Target Move Date",
        varType: "string",
        isMandatory: true,
        order: 3,
      },
    ],
  });

  const catBadgeAccess = await prisma.catalogItem.create({
    data: {
      name: "Physical Security Badge & Keycard Access",
      shortDescription: "Request NFC smart badge, mobile credential, or access clearance to restricted labs & server rooms.",
      description: "Physical security badge issuance and door reader permissions. Manage building turnstile permissions, datacenter MDF/IDF security zones, and parking garage gates.",
      category: "Workplace & Facilities",
      price: 0.0,
      icon: "Key",
      deliveryDays: 1,
    },
  });

  await prisma.catalogVariable.createMany({
    data: [
      {
        catalogItemId: catBadgeAccess.id,
        name: "badge_type",
        label: "Credential Type",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["New Physical NFC Smart Badge", "Replacement for Lost / Damaged Badge", "Mobile Apple/Google Wallet Credential", "Temporary Contractor Badge"]),
        order: 1,
      },
      {
        catalogItemId: catBadgeAccess.id,
        name: "access_zones",
        label: "Requested Access Clearance",
        varType: "select",
        isMandatory: true,
        optionsJson: JSON.stringify(["Standard Campus & Building Floors (All Employees)", "Level 4 MDF Server Room & Network Closets", "Biomedical & Engineering Cleanrooms", "Executive Suite & Boardrooms"]),
        order: 2,
      },
    ],
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
Production cloud access requires zero-standing-privilege (ZSP) enforcement. All write permissions to production AWS accounts must be requested through ServiceMeow Service Catalog.

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

  // 17. Seed Workplace Reservations
  console.log("Seeding Workspace Reservations...");
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  await prisma.cmnReservation.createMany({
    data: [
      {
        number: "RES0001001",
        spaceId: spaceCONF410.id,
        reservedById: adminUser.id,
        subject: "Executive Leadership & Workplace Hub Architecture Review",
        startTime: new Date(y, m, d, 10, 0, 0),
        endTime: new Date(y, m, d, 11, 30, 0),
        status: "confirmed",
        attendeesCount: 12,
        capabilitiesNeeded: JSON.stringify(["teams", "zoom", "whiteboard", "4k_projector"]),
        notes: "Executive steering committee hybrid alignment. Catering requested.",
      },
      {
        number: "RES0001002",
        spaceId: spaceDESK402.id,
        reservedById: itilUser.id,
        subject: "ITIL Incident Commander Duty Shift",
        startTime: new Date(y, m, d, 8, 30, 0),
        endTime: new Date(y, m, d, 17, 0, 0),
        status: "checked_in",
        attendeesCount: 1,
        capabilitiesNeeded: JSON.stringify(["standing_desk", "zoom"]),
        notes: "Primary command station for Sev-1 on-call rotation.",
      },
      {
        number: "RES0001003",
        spaceId: spaceCONF405.id,
        reservedById: callerAlex.id,
        subject: "Core Engineering Sprint Demo & Whiteboarding",
        startTime: new Date(y, m, d, 14, 0, 0),
        endTime: new Date(y, m, d, 15, 30, 0),
        status: "confirmed",
        attendeesCount: 6,
        capabilitiesNeeded: JSON.stringify(["teams", "whiteboard"]),
        notes: "Sprint 42 retrospective and architecture breakdown.",
      },
      {
        number: "RES0001004",
        spaceId: spaceCONF420.id,
        reservedById: cabUser.id,
        subject: "Global IT & Engineering All-Hands Broadcast",
        startTime: new Date(y, m, d + 1, 13, 0, 0),
        endTime: new Date(y, m, d + 1, 14, 30, 0),
        status: "confirmed",
        attendeesCount: 55,
        capabilitiesNeeded: JSON.stringify(["teams", "zoom", "telepresence", "4k_projector", "microphones"]),
        notes: "Global live broadcast with dual telepresence feed.",
      },
    ],
  });

  // 18. Seed Knowledge Bases (kb_knowledge_base in sysCustomRecord)
  console.log("Seeding Knowledge Bases (kb_knowledge_base)...");
  await prisma.sysCustomRecord.createMany({
    data: [
      {
        tableName: "kb_knowledge_base",
        dataJson: JSON.stringify({
          number: "KB0001",
          name: "IT Operations & Cloud Infrastructure Runbooks",
          description: "Curated operational guides, deployment procedures, incident resolution runbooks, and SRE best practices.",
          owner: "Alex Chen",
          active: true,
        }),
      },
      {
        tableName: "kb_knowledge_base",
        dataJson: JSON.stringify({
          number: "KB0002",
          name: "Employee Workplace & Facilities Self-Service",
          description: "Workplace guidelines, floor directory guides, desk booking policies, and office services intake.",
          owner: "Sarah Connor",
          active: true,
        }),
      },
      {
        tableName: "kb_knowledge_base",
        dataJson: JSON.stringify({
          number: "KB0003",
          name: "Corporate Security & Access Compliance",
          description: "Security protocols, VPN & Wi-Fi certificates, identity verification, and data handling requirements.",
          owner: "Marcus Vance",
          active: true,
        }),
      },
    ],
  });

  // 19. Seed Agile Sprints (rm_sprint in sysCustomRecord)
  console.log("Seeding Agile Sprints (rm_sprint)...");
  const sprintStart = new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0];
  const sprintEnd = new Date(Date.now() + 9 * 86400000).toISOString().split("T")[0];
  const nextSprintStart = new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0];
  const nextSprintEnd = new Date(Date.now() + 24 * 86400000).toISOString().split("T")[0];

  await prisma.sysCustomRecord.createMany({
    data: [
      {
        tableName: "rm_sprint",
        dataJson: JSON.stringify({
          number: "SPNT0001001",
          name: "Sprint 42 - Core ITIL & Platform Parity",
          state: "active",
          startDate: sprintStart,
          endDate: sprintEnd,
          capacityPoints: 45,
          goal: "Complete Swiss Grid forms and full parity for ESM modules.",
        }),
      },
      {
        tableName: "rm_sprint",
        dataJson: JSON.stringify({
          number: "SPNT0001002",
          name: "Sprint 43 - CAD Space Planning & Automation",
          state: "planning",
          startDate: nextSprintStart,
          endDate: nextSprintEnd,
          capacityPoints: 50,
          goal: "Enhance CAD drag-and-drop floorplan visual tools and automated batch reservations.",
        }),
      },
    ],
  });

  // 20. Seed Agile Epics (rm_epic in task)
  console.log("Seeding Agile Epics (rm_epic)...");
  await prisma.task.createMany({
    data: [
      {
        number: "EPIC0001001",
        sysClassName: "rm_epic",
        shortDescription: "ITIL Core Engine Modernization",
        description: "Deliver comprehensive Incident, Problem, Change, and CMDB CI workflows with zero legacy lock-in.",
        priority: 1,
        state: 2,
        assignedToId: adminUser.id,
        assignmentGroupId: groupServiceDesk.id,
        dynamicFields: JSON.stringify({
          owner: "Product Director",
          target_date: "Q4 2026",
        }),
      },
      {
        number: "EPIC0001002",
        sysClassName: "rm_epic",
        shortDescription: "Enterprise Workplace & CAD Spatial Integration",
        description: "6-tier spatial model with interactive CAD floorplans, live room state matrix, and reservations.",
        priority: 2,
        state: 2,
        assignedToId: adminUser.id,
        assignmentGroupId: groupWorkplace.id,
        dynamicFields: JSON.stringify({
          owner: "Head of Real Estate",
          target_date: "Q4 2026",
        }),
      },
      {
        number: "EPIC0001003",
        sysClassName: "rm_epic",
        shortDescription: "Unified Self-Service Portal & Knowledge Expansion",
        description: "Intuitive self-service catalog, 90-day uptime monitoring, and searchable knowledge bases.",
        priority: 2,
        state: 1,
        assignedToId: adminUser.id,
        assignmentGroupId: groupServiceDesk.id,
        dynamicFields: JSON.stringify({
          owner: "Customer Experience Lead",
          target_date: "Q1 2027",
        }),
      },
    ],
  });

  // 21. Seed Agile User Stories (rm_story in task)
  console.log("Seeding Agile Stories (rm_story)...");
  await prisma.task.createMany({
    data: [
      {
        number: "STRY0001001",
        sysClassName: "rm_story",
        shortDescription: "Implement Swiss Grid UI across all Workspace forms",
        description: "Standardize all ITIL and Agile workspace forms using brutalist Swiss Grid design with high-contrast typography.",
        priority: 1,
        state: 7, // Complete
        assignedToId: itilUser.id,
        assignmentGroupId: groupServiceDesk.id,
        dynamicFields: JSON.stringify({
          story_points: 8,
          sprint_id: "SPNT0001001",
          sprint_name: "Sprint 42 - Core ITIL & Platform Parity",
          epic_name: "EPIC0001001: ITIL Core Engine Modernization",
          assigned_to: "Alex Chen",
          acceptance_criteria: "Given any fulfiller, when they open any form in workspace, it renders in clean Swiss Grid styling.",
        }),
      },
      {
        number: "STRY0001002",
        sysClassName: "rm_story",
        shortDescription: "Refactor CAD floorplan drag-and-drop room layout engine",
        description: "Enable fulfillers and workspace managers to intuitively drag, resize, and position spaces directly on architectural SVG floorplans.",
        priority: 2,
        state: 3, // In Progress
        assignedToId: adminUser.id,
        assignmentGroupId: groupWorkplace.id,
        dynamicFields: JSON.stringify({
          story_points: 5,
          sprint_id: "SPNT0001001",
          sprint_name: "Sprint 42 - Core ITIL & Platform Parity",
          epic_name: "EPIC0001002: Enterprise Workplace & CAD Spatial Integration",
          assigned_to: "Sarah Connor",
          acceptance_criteria: "Users can drag, resize, and reshape rooms directly in the SVG CAD canvas.",
        }),
      },
      {
        number: "STRY0001003",
        sysClassName: "rm_story",
        shortDescription: "Build real-time KEDB known error search in Incident resolution",
        description: "Automatically suggest verified workarounds from the Known Error Database when an engineer troubleshoots a recurring incident.",
        priority: 2,
        state: 3, // In Progress
        assignedToId: itilUser.id,
        assignmentGroupId: groupServiceDesk.id,
        dynamicFields: JSON.stringify({
          story_points: 5,
          sprint_id: "SPNT0001001",
          sprint_name: "Sprint 42 - Core ITIL & Platform Parity",
          epic_name: "EPIC0001001: ITIL Core Engine Modernization",
          assigned_to: "David Miller",
          acceptance_criteria: "Known error database articles populate dynamically when searching incident symptoms.",
        }),
      },
      {
        number: "STRY0001004",
        sysClassName: "rm_story",
        shortDescription: "Enhance CMDB CI dependency tree visualization",
        description: "Provide an interactive node graph displaying upstream and downstream relationships for enterprise configuration items.",
        priority: 3,
        state: 4, // Testing & QA
        assignedToId: itilUser.id,
        assignmentGroupId: groupSRE.id,
        dynamicFields: JSON.stringify({
          story_points: 3,
          sprint_id: "SPNT0001001",
          sprint_name: "Sprint 42 - Core ITIL & Platform Parity",
          epic_name: "EPIC0001001: ITIL Core Engine Modernization",
          assigned_to: "Alex Chen",
          acceptance_criteria: "CI relationships (Depends on / Hosted on) render in an interactive relationship graph.",
        }),
      },
      {
        number: "STRY0001005",
        sysClassName: "rm_story",
        shortDescription: "Enable multi-zone room reservation conflict resolution",
        description: "Detect calendar collision on meeting rooms and recommend the closest available conference space on the same floor level.",
        priority: 2,
        state: 2, // Sprint Ready
        assignedToId: adminUser.id,
        assignmentGroupId: groupWorkplace.id,
        dynamicFields: JSON.stringify({
          story_points: 5,
          sprint_id: "SPNT0001001",
          sprint_name: "Sprint 42 - Core ITIL & Platform Parity",
          epic_name: "EPIC0001002: Enterprise Workplace & CAD Spatial Integration",
          assigned_to: "Elena Rostova",
          acceptance_criteria: "System prevents overlapping reservations and suggests nearest alternative conference rooms.",
        }),
      },
      {
        number: "STRY0001006",
        sysClassName: "rm_story",
        shortDescription: "Automate P1 Major Incident Cat-Swarm dispatch notifications",
        description: "Trigger automated PagerDuty and Slack alerts to on-call commanders whenever an incident is flagged with Priority 1.",
        priority: 1,
        state: 1, // Backlog
        assignedToId: itilUser.id,
        assignmentGroupId: groupSRE.id,
        dynamicFields: JSON.stringify({
          story_points: 8,
          sprint_id: null,
          sprint_name: null,
          epic_name: "EPIC0001001: ITIL Core Engine Modernization",
          assigned_to: "Marcus Vance",
          acceptance_criteria: "High-priority incidents immediately trigger automated webhook broadcasts to on-call squads.",
        }),
      },
      {
        number: "STRY0001007",
        sysClassName: "rm_story",
        shortDescription: "Publish Employee Workplace onboarding knowledge articles",
        description: "Add step-by-step documentation for badge activation, desk booking, and workplace ergonomics on the employee self-service portal.",
        priority: 3,
        state: 1, // Backlog
        assignedToId: adminUser.id,
        assignmentGroupId: groupServiceDesk.id,
        dynamicFields: JSON.stringify({
          story_points: 3,
          sprint_id: null,
          sprint_name: null,
          epic_name: "EPIC0001003: Unified Self-Service Portal & Knowledge Expansion",
          assigned_to: "Rachel Adams",
          acceptance_criteria: "New hires can search and read workplace guides directly from the self-service portal.",
        }),
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
