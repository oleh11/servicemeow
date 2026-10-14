import { db } from "../src/lib/db";

export async function seedNavigation() {
  console.log("Seeding Application Menus & Navigation Modules...");

  const existingCount = await db.sysAppApplication.count();
  if (existingCount > 0) {
    console.log(`Navigation already seeded (${existingCount} application menus found).`);
    return;
  }

  // 1. Agent Workspace
  const appWorkspace = await db.sysAppApplication.create({
    data: {
      title: "Agent Workspace",
      name: "workspace",
      category: "IT Service Management",
      roles: "itil,admin",
      order: 10,
      icon: "LayoutDashboard",
      modules: {
        create: [
          { title: "Executive Dashboards", order: 10, linkType: "url", url: "/workspace/dashboard", icon: "BarChart3" },
          { title: "Operations Center", order: 20, linkType: "url", url: "/workspace", icon: "Activity" },
          { title: "Visual Task Board (VTB)", order: 30, linkType: "url", url: "/workspace/task-board", icon: "Kanban" },
          { title: "Approvals Hub", order: 40, linkType: "url", url: "/workspace/approvals", icon: "CheckCircle2" },
          { title: "Service Health & Status", order: 50, linkType: "url", url: "/workspace/status", icon: "Activity" },
        ],
      },
    },
  });

  // 2. Incident Management
  const appIncident = await db.sysAppApplication.create({
    data: {
      title: "Incident Management",
      name: "incident",
      category: "IT Service Management",
      roles: "itil,admin",
      order: 20,
      icon: "AlertCircle",
      modules: {
        create: [
          { title: "All Incidents", order: 10, linkType: "list", tableName: "incident" },
          { title: "Critical Incidents (P1)", order: 20, linkType: "list", tableName: "incident", filterQuery: "priority=1" },
          { title: "New Incident", order: 30, linkType: "new", tableName: "incident", icon: "PlusCircle" },
        ],
      },
    },
  });

  // 3. Change Management
  const appChange = await db.sysAppApplication.create({
    data: {
      title: "Change Management",
      name: "change_request",
      category: "IT Service Management",
      roles: "itil,admin,cab_approver",
      order: 30,
      icon: "GitPullRequest",
      modules: {
        create: [
          { title: "All Changes", order: 10, linkType: "list", tableName: "change_request" },
          { title: "CAB Pending Review", order: 20, linkType: "list", tableName: "change_request", filterQuery: "cabApprovalState=requested" },
          { title: "New Change Request", order: 30, linkType: "new", tableName: "change_request", icon: "PlusCircle" },
        ],
      },
    },
  });

  // 4. Problem Management
  const appProblem = await db.sysAppApplication.create({
    data: {
      title: "Problem Management",
      name: "problem",
      category: "IT Service Management",
      roles: "itil,admin",
      order: 40,
      icon: "HelpCircle",
      modules: {
        create: [
          { title: "All Problems", order: 10, linkType: "list", tableName: "problem" },
          { title: "Known Error Database", order: 20, linkType: "list", tableName: "problem", filterQuery: "isKnownError=true" },
        ],
      },
    },
  });

  // 5. Service Catalog
  const appCatalog = await db.sysAppApplication.create({
    data: {
      title: "Service Catalog & Tasks",
      name: "sc_task",
      category: "IT Service Management",
      roles: "itil,admin,employee",
      order: 50,
      icon: "CheckSquare",
      modules: {
        create: [
          { title: "Fulfillment Tasks", order: 10, linkType: "list", tableName: "sc_task" },
          { title: "Browse Catalog", order: 20, linkType: "url", url: "/portal/catalog" },
          { title: "Public System Status", order: 30, linkType: "url", url: "/portal/status" },
        ],
      },
    },
  });

  // 6. Configuration & CMDB
  const appCmdb = await db.sysAppApplication.create({
    data: {
      title: "Configuration & CMDB",
      name: "cmdb",
      category: "Configuration Management",
      roles: "itil,admin",
      order: 60,
      icon: "Server",
      modules: {
        create: [
          { title: "Interactive Topology", order: 10, linkType: "url", url: "/workspace/cmdb" },
          { title: "All Configuration Items", order: 20, linkType: "list", tableName: "cmdb_ci" },
          { title: "Datacenter Rack Elevations", order: 30, linkType: "url", url: "/workspace/cmdb/racks", icon: "Server" },
          { title: "ITAM Contracts & Leases", order: 40, linkType: "url", url: "/workspace/contracts", icon: "FileCheck" },
        ],
      },
    },
  });

  // 7. Knowledge Management
  const appKnowledge = await db.sysAppApplication.create({
    data: {
      title: "Knowledge Management",
      name: "knowledge",
      category: "Self-Service",
      roles: "public,employee,itil,admin",
      order: 70,
      icon: "BookOpen",
      modules: {
        create: [
          { title: "Browse Knowledge Base", order: 10, linkType: "url", url: "/portal/knowledge" },
        ],
      },
    },
  });

  // 8. Custom Scoped App: Security Incident Response (SIRT)
  const secOpsApp = await db.sysApp.create({
    data: {
      name: "Security Operations & Incident Response",
      scope: "x_purr_secops",
      version: "1.2.0",
      description: "Dedicated cybersecurity triage, threat intelligence, and vulnerability remediation",
      vendor: "ServiceMeow Security",
      icon: "ShieldAlert",
      applicationMenus: {
        create: [
          {
            title: "Security Operations",
            name: "secops",
            category: "Custom Applications",
            roles: "itil,admin",
            order: 80,
            icon: "Shield",
            modules: {
              create: [
                { title: "Security Alerts & Triage", order: 10, linkType: "list", tableName: "incident", filterQuery: "category=security" },
                { title: "Vulnerability Tasks", order: 20, linkType: "list", tableName: "task", filterQuery: "priority=1" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Successfully seeded 8 application menus and 20 modules!");
}

if (require.main === module) {
  seedNavigation()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
