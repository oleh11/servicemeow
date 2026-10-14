import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseEncodedQuery } from "@/lib/query-parser";
import { getNextNumber } from "@/lib/numbering";
import { calculatePriority } from "@/lib/sla";
import { executeBusinessRules } from "@/lib/business-rules";
import { triggerFlows } from "@/lib/flow-engine";
import { evaluateAcl } from "@/lib/acl-engine";
import { getServerSession } from "@/lib/auth";

const ADMIN_ONLY_WRITE_TABLES = new Set(["sys_user", "sys_user_group", "sys_user_grmember", "sys_security_acl", "sys_user_role"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sysparmQuery = searchParams.get("sysparm_query");
    const limit = Math.min(100, parseInt(searchParams.get("sysparm_limit") || "50", 10));
    const offset = parseInt(searchParams.get("sysparm_offset") || "0", 10);

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Enforce Access Control Lists (ACLs)
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "read",
      tableName: table,
    });
    if (!aclCheck.allowed) {
      return NextResponse.json({ error: aclCheck.reason }, { status: 403 });
    }

    const parsedQuery = parseEncodedQuery(sysparmQuery);

    // Common query handler based on table
    if (table === "incident" || table === "task" || table === "change_request" || table === "problem") {
      const where: any = {};
      if (table !== "task") {
        where.sysClassName = table;
      }

      for (const cond of parsedQuery.conditions) {
        if (cond.field === "priority") {
          where.priority = parseInt(cond.value, 10);
        } else if (cond.field === "state") {
          if (cond.operator === "!=") {
            where.state = { not: parseInt(cond.value, 10) };
          } else {
            where.state = parseInt(cond.value, 10);
          }
        } else if (cond.field === "active") {
          where.active = cond.value === "true";
        } else if (cond.field === "category" && (table === "incident" || table === "task")) {
          where.incident = { category: cond.value };
        } else if (cond.field === "assigned_to") {
          where.assignedToId = cond.value;
        } else if (cond.field === "isKnownError" || cond.field === "known_error") {
          where.problem = { isKnownError: cond.value === "true" };
        } else if (cond.field === "cabApprovalState" || cond.field === "cab") {
          where.changeRequest = { cabApprovalState: cond.value };
        }
      }

      const orderBy: any = {};
      if (parsedQuery.orderBy) {
        const dir = parsedQuery.orderBy.direction;
        if (parsedQuery.orderBy.field === "sys_created_on") orderBy.createdAt = dir;
        else if (parsedQuery.orderBy.field === "priority") orderBy.priority = dir;
        else orderBy.createdAt = "desc";
      } else {
        orderBy.createdAt = "desc";
      }

      const tasks = await db.task.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          assignmentGroup: { select: { id: true, name: true } },
          openedBy: { select: { id: true, name: true } },
          cmdbCi: { select: { id: true, name: true, ciClass: true } },
          incident: {
            include: {
              caller: { select: { id: true, name: true, email: true } },
              cmdbCi: { select: { id: true, name: true, ciClass: true } },
            },
          },
          changeRequest: {
            include: {
              cmdbCi: { select: { id: true, name: true, ciClass: true } },
            },
          },
          problem: true,
          slaInstances: {
            include: {
              slaDefinition: true,
            },
          },
        },
      });

      // Transform into standard response format
      const formatted = tasks.map((t) => {
        let custom: any = {};
        if (t.dynamicFields) {
          try {
            custom = JSON.parse(t.dynamicFields);
          } catch {}
        }
        return {
          sys_id: t.id,
          number: t.number,
          sys_class_name: t.sysClassName,
          short_description: t.shortDescription,
          description: t.description,
          priority: String(t.priority),
          state: String(t.state),
          impact: String(t.impact),
          urgency: String(t.urgency),
          assigned_to: t.assignedTo ? { value: t.assignedTo.id, display_value: t.assignedTo.name } : null,
          assignment_group: t.assignmentGroup ? { value: t.assignmentGroup.id, display_value: t.assignmentGroup.name } : null,
          opened_by: t.openedBy ? { value: t.openedBy.id, display_value: t.openedBy.name } : null,
          caller_id: t.incident?.caller ? { value: t.incident.caller.id, display_value: t.incident.caller.name } : null,
          cmdb_ci_id: t.cmdbCi ? { value: t.cmdbCi.id, display_value: t.cmdbCi.name } : (t.incident?.cmdbCi ? { value: t.incident.cmdbCi.id, display_value: t.incident.cmdbCi.name } : null),
          sys_created_on: t.createdAt.toISOString(),
          sys_updated_on: t.updatedAt.toISOString(),
          incident: t.incident,
          change_request: t.changeRequest,
          problem: t.problem,
          sla_instances: t.slaInstances,
          ...custom,
        };
      });

      return NextResponse.json({ result: formatted });
    }

    if (table === "cmdb_ci") {
      const cis = await db.configurationItem.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          location: { select: { id: true, name: true } },
          incidents: { select: { id: true } },
          changes: { select: { id: true } },
        },
      });
      return NextResponse.json({ result: cis });
    }

    if (table === "sys_user") {
      const users = await db.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          manager: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ result: users });
    }

    if (table === "sys_user_group") {
      const groups = await db.group.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          manager: { select: { id: true, name: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      return NextResponse.json({ result: groups });
    }

    if (table === "cmn_location") {
      const locations = await db.cmnLocation.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          parent: { select: { id: true, name: true } },
          region: { select: { id: true, name: true, code: true } },
          campus: { select: { id: true, name: true, code: true } },
          building: { select: { id: true, name: true, code: true } },
          floor: { select: { id: true, name: true, code: true } },
          space: { select: { id: true, name: true, spaceNumber: true } },
        },
      });
      return NextResponse.json({ result: locations });
    }

    // Connected Workplace 6-Tier Spatial Hierarchy
    if (table === "cmn_region") {
      const regions = await db.cmnRegion.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          states: { select: { id: true, name: true, code: true } },
        },
      });
      return NextResponse.json({ result: regions });
    }

    if (table === "cmn_state") {
      const states = await db.cmnState.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          region: { select: { id: true, name: true, code: true } },
          campuses: { select: { id: true, name: true, code: true } },
        },
      });
      return NextResponse.json({ result: states });
    }

    if (table === "cmn_campus") {
      const campuses = await db.cmnCampus.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          state: { select: { id: true, name: true, code: true } },
          buildings: { select: { id: true, name: true, code: true } },
        },
      });
      return NextResponse.json({ result: campuses });
    }

    if (table === "cmn_building") {
      const buildings = await db.cmnBuilding.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          campus: { select: { id: true, name: true, code: true } },
          floors: { select: { id: true, name: true, code: true, floorNumber: true } },
        },
      });
      return NextResponse.json({ result: buildings });
    }

    if (table === "cmn_floor") {
      const floors = await db.cmnFloor.findMany({
        take: limit,
        skip: offset,
        orderBy: { floorNumber: "asc" },
        include: {
          building: { select: { id: true, name: true, code: true } },
          spaces: { select: { id: true, name: true, spaceNumber: true, status: true, spaceType: true } },
        },
      });
      return NextResponse.json({ result: floors });
    }

    if (table === "cmn_space") {
      const spaces = await db.cmnSpace.findMany({
        take: limit,
        skip: offset,
        orderBy: { spaceNumber: "asc" },
        include: {
          floor: {
            select: {
              id: true,
              name: true,
              code: true,
              floorNumber: true,
              building: { select: { id: true, name: true, code: true } },
            },
          },
          reservations: {
            where: {
              status: { not: "cancelled" },
            },
            take: 20,
            orderBy: { startTime: "asc" },
          },
        },
      });
      return NextResponse.json({ result: spaces });
    }

    if (table === "cmn_reservation") {
      const where: any = {};
      for (const cond of parsedQuery.conditions) {
        if (cond.field === "space_id" || cond.field === "spaceId") {
          where.spaceId = cond.value;
        } else if (cond.field === "reserved_by_id" || cond.field === "reservedById") {
          where.reservedById = cond.value;
        } else if (cond.field === "status") {
          where.status = cond.value;
        } else if (cond.field === "number") {
          where.number = cond.value;
        }
      }

      const reservations = await db.cmnReservation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { startTime: "asc" },
        include: {
          space: {
            include: {
              floor: {
                include: { building: true },
              },
            },
          },
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      });
      return NextResponse.json({ result: reservations });
    }

    if (table === "sys_user_grmember") {
      const members = await db.userGroupMember.findMany({
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, name: true, email: true } },
          group: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ result: members });
    }

    if (table === "sys_security_acl") {
      const acls = await db.sysSecurityAcl.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ result: acls });
    }

    if (table === "cmdb_ci_rack") {
      const racks = await db.cmdbRack.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        include: {
          mountedCis: {
            select: { id: true, name: true, rackUnitStart: true, rackUnitHeight: true, ciClass: true, status: true },
          },
        },
      });
      return NextResponse.json({ result: racks });
    }

    if (table === "cmn_service") {
      const services = await db.cmnService.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ result: services });
    }

    if (table === "ast_contract") {
      const contracts = await db.astContract.findMany({
        take: limit,
        skip: offset,
        orderBy: { endDate: "asc" },
      });
      return NextResponse.json({ result: contracts });
    }

    // Dynamic handling for any custom table registered in sys_db_object
    const tableMeta = await db.sysDbObject.findUnique({
      where: { name: table },
    });

    if (tableMeta) {
      if (tableMeta.superClass === "task") {
        const tasks = await db.task.findMany({
          where: { sysClassName: table },
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            assignmentGroup: { select: { id: true, name: true } },
          },
        });

        const formatted = tasks.map((t) => {
          let custom: any = {};
          if (t.dynamicFields) {
            try {
              custom = JSON.parse(t.dynamicFields);
            } catch {}
          }
          return {
            sys_id: t.id,
            number: t.number,
            sys_class_name: t.sysClassName,
            short_description: t.shortDescription,
            description: t.description,
            priority: String(t.priority),
            state: String(t.state),
            assigned_to: t.assignedTo ? { value: t.assignedTo.id, display_value: t.assignedTo.name } : null,
            assignment_group: t.assignmentGroup ? { value: t.assignmentGroup.id, display_value: t.assignmentGroup.name } : null,
            sys_created_on: t.createdAt.toISOString(),
            sys_updated_on: t.updatedAt.toISOString(),
            ...custom,
          };
        });

        return NextResponse.json({ result: formatted });
      } else {
        const records = await db.sysCustomRecord.findMany({
          where: { tableName: table },
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        });

        const formatted = records.map((r) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(r.dataJson);
          } catch {}
          return {
            sys_id: r.id,
            sys_created_on: r.createdAt.toISOString(),
            sys_updated_on: r.updatedAt.toISOString(),
            ...parsed,
          };
        });

        return NextResponse.json({ result: formatted });
      }
    }

    return NextResponse.json({ error: `Table '${table}' not found or unsupported` }, { status: 404 });
  } catch (error: any) {
    console.error("Table API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const body = await request.json();

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Enforce Access Control Lists (ACLs)
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "create",
      tableName: table,
    });
    if (!aclCheck.allowed) {
      return NextResponse.json({ error: aclCheck.reason }, { status: 403 });
    }
    // Identity & security tables: writes are admin-only regardless of ACL configuration
    if (ADMIN_ONLY_WRITE_TABLES.has(table) && !session?.isAdmin) {
      return NextResponse.json(
        { error: `Only administrators can modify '${table}'`, code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // 1. Execute ServiceMeow Business Rules: before_insert
    const beforeRules = await executeBusinessRules(table, "before_insert", body);
    if (beforeRules.mutatedFields) {
      Object.assign(body, beforeRules.mutatedFields);
    }

    if (table === "incident") {
      const number = await getNextNumber("INC");
      const impact = parseInt(body.impact || "2", 10);
      const urgency = parseInt(body.urgency || "2", 10);
      const priority = body.priority ? parseInt(body.priority, 10) : calculatePriority(impact, urgency);

      // Extract custom fields into dynamicFields
      const knownKeys = new Set([
        "impact", "urgency", "priority", "short_description", "shortDescription",
        "description", "state", "assigned_to_id", "assignedToId", "assignment_group_id",
        "assignmentGroupId", "opened_by_id", "openedById", "caller_id", "callerId",
        "caller_name", "callerName", "caller_email", "callerEmail", "category",
        "subcategory", "cmdb_ci_id", "cmdbCiId", "close_code", "closeCode",
        "close_notes", "closeNotes"
      ]);
      const customAttrs: Record<string, any> = {};
      for (const [k, v] of Object.entries(body)) {
        if (!knownKeys.has(k)) customAttrs[k] = v;
      }

      // Create base task
      const task = await db.task.create({
        data: {
          number,
          sysClassName: "incident",
          shortDescription: body.short_description || body.shortDescription || "New Incident",
          description: body.description || "",
          priority,
          impact,
          urgency,
          state: parseInt(body.state || "1", 10),
          assignedToId: body.assigned_to_id || body.assignedToId || null,
          assignmentGroupId: body.assignment_group_id || body.assignmentGroupId || null,
          openedById: body.opened_by_id || body.openedById || null,
          dynamicFields: Object.keys(customAttrs).length > 0 ? JSON.stringify(customAttrs) : null,
        },
      });

      // Create incident extension
      const incident = await db.incident.create({
        data: {
          taskId: task.id,
          callerId: body.caller_id || body.callerId || null,
          callerName: body.caller_name || body.callerName || null,
          callerEmail: body.caller_email || body.callerEmail || null,
          category: body.category || "inquiry",
          subcategory: body.subcategory || null,
          cmdbCiId: body.cmdb_ci_id || body.cmdbCiId || null,
          severity: priority,
        },
      });

      // Attach SLA definition if applicable
      const slaDef = await db.slaDefinition.findFirst({
        where: { priorityTarget: priority, active: true },
      });
      if (slaDef) {
        const breachTime = new Date(Date.now() + slaDef.targetDurationMinutes * 60 * 1000);
        await db.slaInstance.create({
          data: {
            slaDefinitionId: slaDef.id,
            taskId: task.id,
            breachTime,
            state: "in_progress",
          },
        });
      }

      // Add initial activity note if description provided
      if (body.description) {
        await db.activityNote.create({
          data: {
            taskId: task.id,
            authorId: body.caller_id || body.callerId || null,
            noteType: "customer_comment",
            content: body.description,
          },
        });
      }

      // Add any work notes generated by before_insert rules
      for (const note of beforeRules.workNotes) {
        await db.activityNote.create({
          data: {
            taskId: task.id,
            noteType: "work_note",
            content: note,
          },
        });
      }

      // 2. Execute ServiceMeow Business Rules: after_insert
      const flatRecord = {
        id: task.id,
        number: task.number,
        priority: task.priority,
        state: task.state,
        impact: task.impact,
        urgency: task.urgency,
        short_description: task.shortDescription,
        shortDescription: task.shortDescription,
        category: incident.category,
        subcategory: incident.subcategory,
        assigned_to_id: task.assignedToId,
        assignedToId: task.assignedToId,
        assignment_group_id: task.assignmentGroupId,
        assignmentGroupId: task.assignmentGroupId,
        ...customAttrs,
      };

      const afterRules = await executeBusinessRules(table, "after_insert", flatRecord);
      for (const note of afterRules.workNotes) {
        await db.activityNote.create({
          data: {
            taskId: task.id,
            noteType: "work_note",
            content: note,
          },
        });
      }

      // 3. Trigger ServiceMeow Hub Flows
      await triggerFlows(table, flatRecord);

      const executedRules = [...beforeRules.executedRules, ...afterRules.executedRules];

      return NextResponse.json(
        {
          result: {
            sys_id: task.id,
            number: task.number,
            short_description: task.shortDescription,
            state: task.state,
            priority: task.priority,
            incident_id: incident.id,
            executedRules,
            ...customAttrs,
          },
          executedRules,
        },
        { status: 201 }
      );
    }

    if (table === "change_request") {
      const number = await getNextNumber("CHG");
      const priority = parseInt(body.priority || "3", 10);

      const task = await db.task.create({
        data: {
          number,
          sysClassName: "change_request",
          shortDescription: body.short_description || body.shortDescription || "New Change Request",
          description: body.description || "",
          priority,
          state: 1, // New
          assignedToId: body.assigned_to_id || body.assignedToId || null,
          assignmentGroupId: body.assignment_group_id || body.assignmentGroupId || null,
        },
      });

      const change = await db.changeRequest.create({
        data: {
          taskId: task.id,
          changeType: body.change_type || body.changeType || "normal",
          risk: body.risk || "moderate",
          cabRequired: body.cab_required !== undefined ? body.cab_required : (body.cabRequired !== undefined ? body.cabRequired : true),
          cabApprovalState: body.cab_approval_state || body.cabApprovalState || "requested",
          plannedStart: body.planned_start ? new Date(body.planned_start) : null,
          plannedEnd: body.planned_end ? new Date(body.planned_end) : null,
          implementationPlan: body.implementation_plan || "",
          backoutPlan: body.backout_plan || "",
          testPlan: body.test_plan || "",
          cmdbCiId: body.cmdb_ci_id || body.cmdbCiId || null,
        },
      });

      // Add before_insert work notes
      for (const note of beforeRules.workNotes) {
        await db.activityNote.create({
          data: {
            taskId: task.id,
            noteType: "work_note",
            content: note,
          },
        });
      }

      const flatRecord = {
        id: task.id,
        number: task.number,
        priority: task.priority,
        state: task.state,
        risk: change.risk,
        cab_required: change.cabRequired,
        cabRequired: change.cabRequired,
        change_type: change.changeType,
        short_description: task.shortDescription,
        shortDescription: task.shortDescription,
        assigned_to_id: task.assignedToId,
        assignedToId: task.assignedToId,
        assignment_group_id: task.assignmentGroupId,
        assignmentGroupId: task.assignmentGroupId,
      };

      const afterRules = await executeBusinessRules(table, "after_insert", flatRecord);
      for (const note of afterRules.workNotes) {
        await db.activityNote.create({
          data: {
            taskId: task.id,
            noteType: "work_note",
            content: note,
          },
        });
      }

      await triggerFlows(table, flatRecord);

      const executedRules = [...beforeRules.executedRules, ...afterRules.executedRules];

      return NextResponse.json(
        {
          result: {
            sys_id: task.id,
            number: task.number,
            short_description: task.shortDescription,
            change_id: change.id,
            executedRules,
          },
          executedRules,
        },
        { status: 201 }
      );
    }

    if (table === "cmn_location") {
      const loc = await db.cmnLocation.create({
        data: {
          name: body.name,
          street: body.street || null,
          city: body.city || null,
          state: body.state || null,
          country: body.country || null,
          parentId: body.parent_id || body.parentId || null,
        },
      });
      return NextResponse.json({ result: { sys_id: loc.id, ...loc } }, { status: 201 });
    }

    if (table === "cmdb_ci") {
      const ci = await db.configurationItem.create({
        data: {
          name: body.name,
          ciClass: body.ci_class || body.ciClass || "server",
          sysClass: body.sys_class || body.sysClass || "cmdb_ci",
          status: body.status || "in_service",
          operationalStatus: body.operational_status || body.operationalStatus || "operational",
          environment: body.environment || "production",
          assetTag: body.asset_tag || body.assetTag || null,
          ipAddress: body.ip_address || body.ipAddress || null,
          hostName: body.host_name || body.hostName || null,
          tier: body.tier || null,
          owner: body.owner || null,
          locationId: body.location_id || body.locationId || null,
        },
      });
      return NextResponse.json({ result: { sys_id: ci.id, ...ci } }, { status: 201 });
    }

    if (table === "sys_user") {
      const user = await db.user.create({
        data: {
          userName: body.user_name || body.userName || `user_${Date.now()}`,
          name: body.name,
          email: body.email,
          role: body.role || "employee",
          roles: Array.isArray(body.roles) ? body.roles.join(",") : (body.roles || ""),
          title: body.title || null,
          department: body.department || null,
          active: body.active !== undefined ? body.active : true,
          locationId: body.location_id || body.locationId || null,
          managerId: body.manager_id || body.managerId || null,
          avatar: body.avatar || null,
        },
      });
      return NextResponse.json({ result: { sys_id: user.id, ...user } }, { status: 201 });
    }

    if (table === "sys_user_group") {
      const group = await db.group.create({
        data: {
          name: body.name,
          description: body.description || null,
          active: body.active !== undefined ? body.active : true,
          roles: Array.isArray(body.roles) ? body.roles.join(",") : (body.roles || ""),
          managerId: body.manager_id || body.managerId || null,
        },
      });
      return NextResponse.json({ result: { sys_id: group.id, ...group } }, { status: 201 });
    }

    if (table === "sys_user_grmember") {
      const member = await db.userGroupMember.create({
        data: {
          userId: body.user_id || body.userId,
          groupId: body.group_id || body.groupId,
        },
      });
      return NextResponse.json({ result: { sys_id: member.id, ...member } }, { status: 201 });
    }

    // Connected Workplace 6-Tier Spatial POST Handlers
    if (table === "cmn_region") {
      const region = await db.cmnRegion.create({
        data: {
          name: body.name,
          code: body.code || body.name.toUpperCase().replace(/\s+/g, "_"),
          description: body.description || null,
          active: body.active !== undefined ? body.active : true,
        },
      });
      return NextResponse.json({ result: { sys_id: region.id, ...region } }, { status: 201 });
    }

    if (table === "cmn_state") {
      const state = await db.cmnState.create({
        data: {
          name: body.name,
          code: body.code,
          country: body.country || "US",
          regionId: body.region_id || body.regionId || null,
        },
      });
      return NextResponse.json({ result: { sys_id: state.id, ...state } }, { status: 201 });
    }

    if (table === "cmn_campus") {
      const campus = await db.cmnCampus.create({
        data: {
          name: body.name,
          code: body.code || body.name.toUpperCase().replace(/\s+/g, "_"),
          stateId: body.state_id || body.stateId || null,
          address: body.address || null,
          city: body.city || null,
          zipCode: body.zip_code || body.zipCode || null,
          latitude: body.latitude ? parseFloat(body.latitude) : null,
          longitude: body.longitude ? parseFloat(body.longitude) : null,
        },
      });
      return NextResponse.json({ result: { sys_id: campus.id, ...campus } }, { status: 201 });
    }

    if (table === "cmn_building") {
      const building = await db.cmnBuilding.create({
        data: {
          name: body.name,
          code: body.code,
          campusId: body.campus_id || body.campusId || null,
          buildingType: body.building_type || body.buildingType || "hospital",
          floorsCount: body.floors_count ? parseInt(body.floors_count, 10) : 1,
          totalAreaSqFt: body.total_area_sq_ft ? parseFloat(body.total_area_sq_ft) : null,
        },
      });
      return NextResponse.json({ result: { sys_id: building.id, ...building } }, { status: 201 });
    }

    if (table === "cmn_floor") {
      const floor = await db.cmnFloor.create({
        data: {
          name: body.name,
          floorNumber: parseInt(body.floor_number || body.floorNumber || "1", 10),
          code: body.code,
          buildingId: body.building_id || body.buildingId || null,
          floorplanSvgUrl: body.floorplan_svg_url || body.floorplanSvgUrl || null,
          floorplanImageUrl: body.floorplan_image_url || body.floorplanImageUrl || null,
          areaSqFt: body.area_sq_ft ? parseFloat(body.area_sq_ft) : null,
        },
      });
      return NextResponse.json({ result: { sys_id: floor.id, ...floor } }, { status: 201 });
    }

    if (table === "cmn_space") {
      const space = await db.cmnSpace.create({
        data: {
          name: body.name,
          spaceNumber: body.space_number || body.spaceNumber,
          floorId: body.floor_id || body.floorId || null,
          spaceType: body.space_type || body.spaceType || "room",
          status: body.status || "available",
          capacity: body.capacity ? parseInt(body.capacity, 10) : 1,
          squareFeet: body.square_feet ? parseFloat(body.square_feet) : null,
          department: body.department || null,
          svgElementId: body.svg_element_id || body.svgElementId || null,
          capabilities: typeof body.capabilities === "string" ? body.capabilities : (body.capabilities ? JSON.stringify(body.capabilities) : null),
          imageUrl: body.image_url || body.imageUrl || null,
          floorplanX: body.floorplan_x !== undefined ? parseFloat(body.floorplan_x) : (body.floorplanX !== undefined ? parseFloat(body.floorplanX) : null),
          floorplanY: body.floorplan_y !== undefined ? parseFloat(body.floorplan_y) : (body.floorplanY !== undefined ? parseFloat(body.floorplanY) : null),
          floorplanWidth: body.floorplan_width !== undefined ? parseFloat(body.floorplan_width) : (body.floorplanWidth !== undefined ? parseFloat(body.floorplanWidth) : null),
          floorplanHeight: body.floorplan_height !== undefined ? parseFloat(body.floorplan_height) : (body.floorplanHeight !== undefined ? parseFloat(body.floorplanHeight) : null),
        },
      });
      return NextResponse.json({ result: { sys_id: space.id, ...space } }, { status: 201 });
    }

    if (table === "cmn_reservation") {
      const spaceId = body.space_id || body.spaceId;
      if (!spaceId) {
        return NextResponse.json({ error: "space_id is required for reservations" }, { status: 400 });
      }
      const startTime = new Date(body.start_time || body.startTime);
      const endTime = new Date(body.end_time || body.endTime);
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || endTime <= startTime) {
        return NextResponse.json({ error: "Valid start_time and end_time (end_time > start_time) are required." }, { status: 400 });
      }

      // Check conflict
      const conflict = await db.cmnReservation.findFirst({
        where: {
          spaceId,
          status: { not: "cancelled" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error: "Reservation conflict: Space is already booked during this time interval.",
            conflictWith: conflict,
          },
          { status: 409 }
        );
      }

      const resNumber = body.number || await getNextNumber("cmn_reservation", "RES");
      const reservation = await db.cmnReservation.create({
        data: {
          number: resNumber,
          spaceId,
          reservedById: body.reserved_by_id || body.reservedById || callerUserId || null,
          subject: body.subject || "Workspace Reservation",
          startTime,
          endTime,
          status: body.status || "confirmed",
          attendeesCount: body.attendees_count ? parseInt(body.attendees_count, 10) : (body.attendeesCount ? parseInt(body.attendeesCount, 10) : 1),
          capabilitiesNeeded: typeof body.capabilities_needed === "string" ? body.capabilities_needed : (body.capabilitiesNeeded ? JSON.stringify(body.capabilitiesNeeded) : (body.capabilities ? JSON.stringify(body.capabilities) : null)),
          notes: body.notes || null,
        },
        include: {
          space: true,
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ result: { sys_id: reservation.id, ...reservation } }, { status: 201 });
    }

    if (table === "cmn_location") {
      const loc = await db.cmnLocation.create({
        data: {
          name: body.name,
          locationType: body.location_type || body.locationType || null,
          street: body.street || null,
          city: body.city || null,
          state: body.state || null,
          country: body.country || null,
          fullPath: body.full_path || body.fullPath || null,
          parentId: body.parent_id || body.parentId || null,
          regionId: body.region_id || body.regionId || null,
          stateRefId: body.state_ref_id || body.stateRefId || null,
          campusId: body.campus_id || body.campusId || null,
          buildingId: body.building_id || body.buildingId || null,
          floorId: body.floor_id || body.floorId || null,
          spaceId: body.space_id || body.spaceId || null,
        },
      });
      return NextResponse.json({ result: { sys_id: loc.id, ...loc } }, { status: 201 });
    }

    // Dynamic Creation Handler for Any Custom Table
    const tableMeta = await db.sysDbObject.findUnique({
      where: { name: table },
    });

    if (tableMeta) {
      if (tableMeta.superClass === "task") {
        const number = await getNextNumber("TASK");
        const task = await db.task.create({
          data: {
            number,
            sysClassName: table,
            shortDescription: body.short_description || body.shortDescription || "New Record",
            description: body.description || "",
            priority: parseInt(body.priority || "3", 10),
            state: parseInt(body.state || "1", 10),
            assignedToId: body.assigned_to_id || body.assignedToId || null,
            assignmentGroupId: body.assignment_group_id || body.assignmentGroupId || null,
            dynamicFields: JSON.stringify(body),
          },
        });

        return NextResponse.json(
          {
            result: {
              sys_id: task.id,
              number: task.number,
              ...body,
            },
          },
          { status: 201 }
        );
      } else {
        const record = await db.sysCustomRecord.create({
          data: {
            tableName: table,
            dataJson: JSON.stringify(body),
          },
        });

        return NextResponse.json(
          {
            result: {
              sys_id: record.id,
              ...body,
            },
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json({ error: `Table '${table}' creation not supported` }, { status: 400 });
  } catch (error: any) {
    console.error("Table API POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
