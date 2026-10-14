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
  admin: ["admin", "itil", "cab_approver", "employee", "public"],
  itil: ["itil", "employee", "public"],
  cab_approver: ["cab_approver", "employee", "public"],
  employee: ["employee", "public"],
  public: ["public"],
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
  const matchingAcls = acls.filter((acl) => {
    if (fieldName) {
      return !acl.fieldName || acl.fieldName === "*" || acl.fieldName === fieldName;
    }
    // If no field specified, look at table-level ACLs (fieldName is null, empty or "*")
    return !acl.fieldName || acl.fieldName === "*";
  });

  // If no ACLs exist specifically governing this table/operation, default access is granted
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
      name: "knowledge_admin",
      label: "Knowledge Administrator",
      description: "Governs knowledge bases, authors and approves internal articles, and tracks self-service deflection",
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

