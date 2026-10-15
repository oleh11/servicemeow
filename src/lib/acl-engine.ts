import { db } from "./db";

export type AclOperation = "read" | "write" | "create" | "delete";

export interface AclCheckParams {
  role?: string;
  roles?: string[];
  userId?: string;
  operation: string; // "read" | "write" | "create" | "delete"
  tableName: string;
  fieldName?: string;
}

export interface AclCheckResult {
  allowed: boolean;
  reason?: string;
  matchedAcl?: any;
}

const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: [
    "admin",
    "workplace_admin",
    "itil_admin",
    "catalog_admin",
    "cmdb_admin",
    "knowledge_admin",
    "itil",
    "cab_approver",
    "employee",
    "public",
  ],
  workplace_admin: ["workplace_admin", "employee", "public"],
  itil_admin: ["itil_admin", "itil", "employee", "public"],
  catalog_admin: ["catalog_admin", "employee", "public"],
  cmdb_admin: ["cmdb_admin", "itil", "employee", "public"],
  knowledge_admin: ["knowledge_admin", "employee", "public"],
  itil: ["itil", "employee", "public"],
  cab_approver: ["cab_approver", "employee", "public"],
  employee: ["employee", "public"],
  public: ["public"],
};

export const MODULAR_ADMIN_DOMAINS: Record<string, string[]> = {
  workplace_admin: [
    "cmn_region",
    "cmn_state",
    "cmn_campus",
    "cmn_building",
    "cmn_floor",
    "cmn_space",
    "cmn_reservation",
    "cmn_location",
  ],
  catalog_admin: [
    "sc_cat_item",
    "sc_category",
    "item_option_new",
    "sc_cat_item_producer",
    "sc_req_item",
    "sc_task",
    "catalog_ui_policy",
    "catalog_ui_policy_action",
    "catalog_variable_set",
  ],
  cmdb_admin: ["cmdb_ci", "cmdb_rel_ci", "cmdb_ci_rack", "cmdb_rack"],
  knowledge_admin: ["kb_knowledge", "kb_category", "kb_feedback", "knowledge_article"],
  itil_admin: [
    "incident",
    "problem",
    "change_request",
    "change_task",
    "task",
    "sla_definition",
    "sla_instance",
    "cmn_schedule",
  ],
};

export async function evaluateAcl({
  role,
  roles,
  userId,
  operation,
  tableName,
  fieldName,
}: AclCheckParams): Promise<AclCheckResult> {
  const normOp = operation.toLowerCase().trim();
  const normTable = tableName.toLowerCase().trim();

  // Aggregate all effective roles for the user
  const effectiveRoles = new Set<string>();
  if (role) {
    role.split(",").forEach((r) => {
      const clean = r.trim().toLowerCase();
      if (clean) effectiveRoles.add(clean);
    });
  }
  if (roles && Array.isArray(roles)) {
    roles.forEach((r) => {
      const clean = r.trim().toLowerCase();
      if (clean) effectiveRoles.add(clean);
    });
  }

  // If userId is passed, also resolve direct role and group roles from DB
  if (userId) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          groupMembers: {
            include: { group: { select: { roles: true } } },
          },
        },
      });
      if (user) {
        if (user.role) effectiveRoles.add(user.role.toLowerCase().trim());
        user.groupMembers.forEach((gm) => {
          if (gm.group?.roles) {
            gm.group.roles.split(",").forEach((gr) => {
              const clean = gr.trim().toLowerCase();
              if (clean) effectiveRoles.add(clean);
            });
          }
        });
      }
    } catch {
      // fallback to provided roles
    }
  }

  if (effectiveRoles.size === 0) {
    effectiveRoles.add("employee");
  }

  // Rule 1: Admin bypass (System Administrator / Security Admin)
  if (effectiveRoles.has("admin")) {
    return {
      allowed: true,
      reason: "Platform Administrator has full access override",
    };
  }

  // Rule 1.5: Delegated Modular Administrator Domain Authority
  // Allows module admins (workplace_admin, catalog_admin, cmdb_admin, etc.) to manage their domain
  for (const [modRole, domainTables] of Object.entries(MODULAR_ADMIN_DOMAINS)) {
    if (effectiveRoles.has(modRole) && domainTables.includes(normTable)) {
      return {
        allowed: true,
        reason: `Delegated Module Administrator '${modRole}' has full domain authority over table '${normTable}'`,
      };
    }
  }

  // Find matching active ACL rules
  // Matches exact table or wildcard table "*", exact operation or "*", and optional field
  const acls = await db.sysSecurityAcl.findMany({
    where: {
      active: true,
      tableName: { in: [normTable, "*"] },
      operation: { in: [normOp, "*"] },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter for field-level matching if specified, or table-level matching
  let matchingAcls = acls.filter((acl) => {
    if (fieldName) {
      return !acl.fieldName || acl.fieldName === "*" || acl.fieldName === fieldName;
    }
    // If no field specified, look at table-level ACLs (fieldName is null, empty or "*")
    return !acl.fieldName || acl.fieldName === "*";
  });

  // System tables (sys_user, sys_user_group, sys_user_grmember, sys_security_acl, ...)
  // are default-DENY for non-read operations: a write requires an ACL that names the
  // table explicitly. Wildcard ("*") table ACLs never grant writes to system tables.
  const isSystemTable = normTable.startsWith("sys_");
  if (isSystemTable && normOp !== "read") {
    matchingAcls = matchingAcls.filter((acl) => acl.tableName.toLowerCase().trim() === normTable);
    if (matchingAcls.length === 0) {
      return {
        allowed: false,
        reason: `Security ACL Access Denied: '${normOp}' on system table '${normTable}' requires an explicit ACL (default deny)`,
      };
    }
  }

  // Non-system tables: if no ACLs govern this table/operation, default access is granted
  if (matchingAcls.length === 0) {
    return {
      allowed: true,
      reason: "No restrictive ACL defined for table/operation - Default permitted",
    };
  }

  // If ACLs exist, check if user's roles satisfy any of the requirements
  const userAllowedRoles = new Set<string>();
  effectiveRoles.forEach((r) => {
    const inherited = ROLE_HIERARCHY[r] || [r, "employee", "public"];
    inherited.forEach((ih) => userAllowedRoles.add(ih));
  });

  const passedAcl = matchingAcls.find((acl) => {
    const reqStr = (acl.roleRequired || "").toLowerCase().trim();
    if (!reqStr || reqStr === "*" || reqStr === "public") return true;
    const requiredRoles = reqStr.split(",").map((r) => r.trim()).filter(Boolean);
    return requiredRoles.some((req) => userAllowedRoles.has(req));
  });

  if (passedAcl) {
    return {
      allowed: true,
      matchedAcl: passedAcl,
      reason: `Granted by ACL '${passedAcl.name}' (Requires: ${passedAcl.roleRequired})`,
    };
  }

  const firstReq = matchingAcls[0].roleRequired;
  const rolesDisplay = Array.from(effectiveRoles).join(", ");
  return {
    allowed: false,
    matchedAcl: matchingAcls[0],
    reason: `Security ACL Access Denied: User role(s) [${rolesDisplay}] lack required role(s) '${firstReq}' for '${normOp}' on '${normTable}' (ACL: '${matchingAcls[0].name}')`,
  };
}

export async function checkTablePermission(
  role: string,
  operation: "read" | "write" | "create" | "delete",
  tableName: string
): Promise<boolean> {
  const result = await evaluateAcl({ role, operation, tableName });
  return result.allowed;
}

export async function seedDefaultAclsIfEmpty() {
  const count = await db.sysSecurityAcl.count();
  if (count > 0) return;

  const defaults = [
    {
      name: "incident.read",
      operation: "read",
      tableName: "incident",
      fieldName: "*",
      roleRequired: "employee",
      description: "Allow all employees and ITIL staff to view incidents",
    },
    {
      name: "incident.create",
      operation: "create",
      tableName: "incident",
      fieldName: "*",
      roleRequired: "employee",
      description: "Allow employees to submit incident tickets",
    },
    {
      name: "incident.write",
      operation: "write",
      tableName: "incident",
      fieldName: "*",
      roleRequired: "itil",
      description: "Only ITIL fulfillers can update and manage incidents",
    },
    {
      name: "incident.delete",
      operation: "delete",
      tableName: "incident",
      fieldName: "*",
      roleRequired: "admin",
      description: "Only System Administrators can delete incidents",
    },
    {
      name: "change_request.write",
      operation: "write",
      tableName: "change_request",
      fieldName: "*",
      roleRequired: "cab_approver",
      description: "CAB members and fulfillers can manage changes",
    },
    {
      name: "sys_security_acl.write",
      operation: "write",
      tableName: "sys_security_acl",
      fieldName: "*",
      roleRequired: "admin",
      description: "Only Administrators can modify security access control lists",
    },
  ];

  await db.sysSecurityAcl.createMany({
    data: defaults,
  });
}

export async function seedDefaultRolesIfEmpty() {
  const count = await db.sysUserRole.count();
  if (count > 0) return;

  const defaults = [
    {
      name: "admin",
      label: "System Administrator",
      description: "Full platform control across data dictionary, business rules, client scripts, ACLs, and studio",
      elevatedPrivilege: true,
      active: true,
    },
    {
      name: "itil",
      label: "ITIL Technician",
      description: "Core service management technician capable of managing incidents, changes, and tasks",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "cab_approver",
      label: "Change Advisory Board Approver",
      description: "Authorized member of the CAB empowered to review, assess risk, and approve changes",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "employee",
      label: "Self-Service Employee",
      description: "Standard organizational user capable of submitting tickets, service catalog requests, and viewing KB",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "problem_manager",
      label: "Problem Manager",
      description: "Investigates root causes, publishes workaround articles, and manages problem life-cycles",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "change_manager",
      label: "Change Manager",
      description: "Schedules change moratoriums, oversees implementation windows, and chairs the CAB",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "workplace_admin",
      label: "Workplace & Real Estate Administrator",
      description: "Administers corporate spatial hierarchy (regions, campuses, buildings, floors, rooms), CAD blueprints, floorplan room mapping, and reservation rules",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "itil_admin",
      label: "ITSM Administrator",
      description: "Administers ITIL processes, SLAs, business schedules, incident/change/problem settings",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "cmdb_admin",
      label: "CMDB & Infrastructure Administrator",
      description: "Administers CMDB configuration items, datacenter racks, and dependency topology models",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "catalog_admin",
      label: "Service Catalog Administrator",
      description: "Designs and maintains service catalog items, categories, variables, and checkout workflows",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "knowledge_admin",
      label: "Knowledge Administrator",
      description: "Governs knowledge bases, authors and approves internal articles, and tracks self-service deflection",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "cmdb_editor",
      label: "CMDB CI Editor",
      description: "Maintains Configuration Items, servers, relationships, IP networks, and topology models",
      elevatedPrivilege: false,
      active: true,
    },
    {
      name: "security_operator",
      label: "Security Incident Operator",
      description: "Triage and remediation of security incidents, vulnerability monitoring, and access auditing",
      elevatedPrivilege: true,
      active: true,
    },
  ];

  await db.sysUserRole.createMany({
    data: defaults,
  });
}

