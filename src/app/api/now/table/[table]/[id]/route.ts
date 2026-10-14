import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatePriority } from "@/lib/sla";
import { executeBusinessRules } from "@/lib/business-rules";
import { triggerFlows } from "@/lib/flow-engine";
import { evaluateAcl } from "@/lib/acl-engine";
import { logAudit } from "@/lib/audit";
import { getServerSession } from "@/lib/auth";

const ADMIN_ONLY_WRITE_TABLES = new Set(["sys_user", "sys_user_group", "sys_user_grmember", "sys_security_acl", "sys_user_role"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const { table, id } = await params;

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Enforce ACL
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "read",
      tableName: table,
    });
    if (!aclCheck.allowed) {
      return NextResponse.json({ error: aclCheck.reason }, { status: 403 });
    }

    if (table === "incident" || table === "task" || table === "change_request" || table === "problem") {
      const task = await db.task.findUnique({
        where: { id },
        include: {
          assignedTo: true,
          assignmentGroup: true,
          openedBy: true,
          incident: {
            include: {
              cmdbCi: true,
              problem: { include: { task: true } },
            },
          },
          changeRequest: {
            include: {
              cmdbCi: true,
            },
          },
          problem: {
            include: {
              incidents: { include: { task: true } },
            },
          },
          activityNotes: {
            include: { author: true },
            orderBy: { createdAt: "desc" },
          },
          slaInstances: {
            include: { slaDefinition: true },
          },
          approvals: {
            include: { approver: true },
          },
        },
      });

      if (!task) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      let custom: any = {};
      if (task.dynamicFields) {
        try {
          custom = JSON.parse(task.dynamicFields);
        } catch {}
      }

      return NextResponse.json({ result: { ...task, ...custom } });
    }

    if (table === "cmdb_ci") {
      const ci = await db.configurationItem.findUnique({
        where: { id },
        include: {
          location: { select: { id: true, name: true } },
          parentRelations: { include: { childCi: true } },
          childRelations: { include: { parentCi: true } },
          incidents: { include: { task: true } },
          changes: { include: { task: true } },
        },
      });
      if (!ci) return NextResponse.json({ error: "CI not found" }, { status: 404 });
      return NextResponse.json({ result: ci });
    }

    if (table === "sys_user") {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          location: { select: { id: true, name: true } },
        },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ result: user });
    }

    if (table === "sys_user_group") {
      const group = await db.group.findUnique({
        where: { id },
        include: {
          manager: { select: { id: true, name: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
      return NextResponse.json({ result: group });
    }

    if (table === "cmn_location") {
      const loc = await db.cmnLocation.findUnique({
        where: { id },
        include: {
          parent: { select: { id: true, name: true } },
          children: { select: { id: true, name: true } },
          region: { select: { id: true, name: true, code: true } },
          campus: { select: { id: true, name: true, code: true } },
          building: { select: { id: true, name: true, code: true } },
          floor: { select: { id: true, name: true, code: true } },
          space: { select: { id: true, name: true, spaceNumber: true } },
        },
      });
      if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });
      return NextResponse.json({ result: loc });
    }

    if (table === "cmn_region") {
      const region = await db.cmnRegion.findUnique({
        where: { id },
        include: { states: true },
      });
      if (!region) return NextResponse.json({ error: "Region not found" }, { status: 404 });
      return NextResponse.json({ result: region });
    }

    if (table === "cmn_state") {
      const state = await db.cmnState.findUnique({
        where: { id },
        include: { region: true, campuses: true },
      });
      if (!state) return NextResponse.json({ error: "State not found" }, { status: 404 });
      return NextResponse.json({ result: state });
    }

    if (table === "cmn_campus") {
      const campus = await db.cmnCampus.findUnique({
        where: { id },
        include: { state: true, buildings: true },
      });
      if (!campus) return NextResponse.json({ error: "Campus not found" }, { status: 404 });
      return NextResponse.json({ result: campus });
    }

    if (table === "cmn_building") {
      const building = await db.cmnBuilding.findUnique({
        where: { id },
        include: { campus: true, floors: true },
      });
      if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });
      return NextResponse.json({ result: building });
    }

    if (table === "cmn_floor") {
      const floor = await db.cmnFloor.findUnique({
        where: { id },
        include: { building: true, spaces: true },
      });
      if (!floor) return NextResponse.json({ error: "Floor not found" }, { status: 404 });
      return NextResponse.json({ result: floor });
    }

    if (table === "cmn_space") {
      const space = await db.cmnSpace.findUnique({
        where: { id },
        include: {
          floor: {
            include: {
              building: {
                include: {
                  campus: {
                    include: {
                      state: {
                        include: {
                          region: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          reservations: {
            where: {
              status: { not: "cancelled" },
            },
            orderBy: { startTime: "asc" },
          },
          configurationItems: { select: { id: true, name: true, status: true, ciClass: true, assetTag: true } },
        },
      });
      if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
      return NextResponse.json({ result: space });
    }

    if (table === "cmn_reservation") {
      const reservation = await db.cmnReservation.findUnique({
        where: { id },
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
      if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
      return NextResponse.json({ result: reservation });
    }

    if (table === "sys_user_grmember") {
      const member = await db.userGroupMember.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          group: { select: { id: true, name: true } },
        },
      });
      if (!member) return NextResponse.json({ error: "Membership not found" }, { status: 404 });
      return NextResponse.json({ result: member });
    }

    // Dynamic table handling
    const tableMeta = await db.sysDbObject.findUnique({ where: { name: table } });
    if (tableMeta) {
      if (tableMeta.superClass === "task") {
        const task = await db.task.findUnique({
          where: { id },
          include: {
            assignedTo: true,
            assignmentGroup: true,
          },
        });
        if (!task) return NextResponse.json({ error: "Record not found" }, { status: 404 });
        let custom: any = {};
        if (task.dynamicFields) {
          try {
            custom = JSON.parse(task.dynamicFields);
          } catch {}
        }
        return NextResponse.json({ result: { ...task, ...custom } });
      } else {
        const rec = await db.sysCustomRecord.findUnique({ where: { id } });
        if (!rec) return NextResponse.json({ error: "Record not found" }, { status: 404 });
        let data: any = {};
        try {
          data = JSON.parse(rec.dataJson);
        } catch {}
        return NextResponse.json({
          result: {
            sys_id: rec.id,
            sys_created_on: rec.createdAt.toISOString(),
            sys_updated_on: rec.updatedAt.toISOString(),
            ...data,
          },
        });
      }
    }

    return NextResponse.json({ error: "Unsupported table" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const { table, id } = await params;
    const body = await request.json();

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id || body.author_id || body.user_id || null;
    let callerUserName = session?.user.name || body.caller_name || null;
    if (!callerUserName && callerUserId) {
      const u = await db.user.findUnique({ where: { id: callerUserId } });
      if (u) callerUserName = u.name;
    }
    if (!callerUserName) {
      callerUserName = callerRoles.includes("admin") ? "System Administrator" : "User";
    }

    // Enforce ACL
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId || undefined,
      operation: "write",
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

    const tableMeta = await db.sysDbObject.findUnique({ where: { name: table } });

    // Handle Standalone Custom Table
    if (tableMeta && tableMeta.superClass !== "task" && tableMeta.isCustom) {
      const rec = await db.sysCustomRecord.findUnique({ where: { id } });
      if (!rec) return NextResponse.json({ error: "Record not found" }, { status: 404 });
      let currentData: any = {};
      try {
        currentData = JSON.parse(rec.dataJson);
      } catch {}
      const merged = { ...currentData, ...body };
      const updated = await db.sysCustomRecord.update({
        where: { id },
        data: { dataJson: JSON.stringify(merged) },
      });

      // Audit delta logging for custom tables
      const customAudits = [];
      for (const [k, newVal] of Object.entries(merged)) {
        const oldVal = currentData[k];
        const oldStr = oldVal !== undefined && oldVal !== null ? String(oldVal) : null;
        const newStr = newVal !== undefined && newVal !== null ? String(newVal) : null;
        if (oldStr !== newStr && (oldVal !== undefined || newVal !== undefined)) {
          customAudits.push({
            tableName: table,
            documentId: id,
            fieldName: k,
            oldValue: oldStr,
            newValue: newStr,
            userId: callerUserId,
            userName: callerUserName,
          });
        }
      }
      if (customAudits.length > 0) {
        await logAudit(customAudits);
      }

      return NextResponse.json({
        result: {
          sys_id: updated.id,
          sys_updated_on: updated.updatedAt.toISOString(),
          ...merged,
        },
      });
    }

    // Foundation tables PATCH handlers
    if (table === "cmn_region") {
      const updated = await db.cmnRegion.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          code: body.code !== undefined ? body.code : undefined,
          description: body.description !== undefined ? body.description : undefined,
          active: body.active !== undefined ? Boolean(body.active) : undefined,
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_state") {
      const updated = await db.cmnState.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          code: body.code !== undefined ? body.code : undefined,
          country: body.country !== undefined ? body.country : undefined,
          regionId: body.region_id !== undefined ? body.region_id : (body.regionId !== undefined ? body.regionId : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_campus") {
      const updated = await db.cmnCampus.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          code: body.code !== undefined ? body.code : undefined,
          stateId: body.state_id !== undefined ? body.state_id : (body.stateId !== undefined ? body.stateId : undefined),
          address: body.address !== undefined ? body.address : undefined,
          city: body.city !== undefined ? body.city : undefined,
          zipCode: body.zip_code !== undefined ? body.zip_code : (body.zipCode !== undefined ? body.zipCode : undefined),
          latitude: body.latitude !== undefined ? (body.latitude ? parseFloat(body.latitude) : null) : undefined,
          longitude: body.longitude !== undefined ? (body.longitude ? parseFloat(body.longitude) : null) : undefined,
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_building") {
      const updated = await db.cmnBuilding.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          code: body.code !== undefined ? body.code : undefined,
          campusId: body.campus_id !== undefined ? body.campus_id : (body.campusId !== undefined ? body.campusId : undefined),
          buildingType: body.building_type !== undefined ? body.building_type : (body.buildingType !== undefined ? body.buildingType : undefined),
          floorsCount: body.floors_count !== undefined ? (body.floors_count ? parseInt(body.floors_count) : null) : (body.floorsCount !== undefined ? (body.floorsCount ? parseInt(body.floorsCount) : null) : undefined),
          totalAreaSqFt: body.total_area_sq_ft !== undefined ? (body.total_area_sq_ft ? parseFloat(body.total_area_sq_ft) : null) : (body.totalAreaSqFt !== undefined ? (body.totalAreaSqFt ? parseFloat(body.totalAreaSqFt) : null) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_floor") {
      const updated = await db.cmnFloor.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          floorNumber: body.floor_number !== undefined ? (body.floor_number ? parseInt(body.floor_number) : 0) : (body.floorNumber !== undefined ? (body.floorNumber ? parseInt(body.floorNumber) : 0) : undefined),
          code: body.code !== undefined ? body.code : undefined,
          buildingId: body.building_id !== undefined ? body.building_id : (body.buildingId !== undefined ? body.buildingId : undefined),
          floorplanSvgUrl: body.floorplan_svg_url !== undefined ? body.floorplan_svg_url : (body.floorplanSvgUrl !== undefined ? body.floorplanSvgUrl : undefined),
          floorplanImageUrl: body.floorplan_image_url !== undefined ? body.floorplan_image_url : (body.floorplanImageUrl !== undefined ? body.floorplanImageUrl : undefined),
          areaSqFt: body.area_sq_ft !== undefined ? (body.area_sq_ft ? parseFloat(body.area_sq_ft) : null) : (body.areaSqFt !== undefined ? (body.areaSqFt ? parseFloat(body.areaSqFt) : null) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_space") {
      const updated = await db.cmnSpace.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          spaceNumber: body.space_number !== undefined ? body.space_number : (body.spaceNumber !== undefined ? body.spaceNumber : undefined),
          floorId: body.floor_id !== undefined ? body.floor_id : (body.floorId !== undefined ? body.floorId : undefined),
          spaceType: body.space_type !== undefined ? body.space_type : (body.spaceType !== undefined ? body.spaceType : undefined),
          status: body.status !== undefined ? body.status : undefined,
          capacity: body.capacity !== undefined ? (body.capacity ? parseInt(body.capacity) : 1) : undefined,
          squareFeet: body.square_feet !== undefined ? (body.square_feet ? parseFloat(body.square_feet) : null) : (body.squareFeet !== undefined ? (body.squareFeet ? parseFloat(body.squareFeet) : null) : undefined),
          department: body.department !== undefined ? body.department : undefined,
          svgElementId: body.svg_element_id !== undefined ? body.svg_element_id : (body.svgElementId !== undefined ? body.svgElementId : undefined),
          capabilities: body.capabilities !== undefined ? (typeof body.capabilities === "string" ? body.capabilities : JSON.stringify(body.capabilities)) : undefined,
          imageUrl: body.image_url !== undefined ? body.image_url : (body.imageUrl !== undefined ? body.imageUrl : undefined),
          floorplanX: body.floorplan_x !== undefined ? parseFloat(body.floorplan_x) : (body.floorplanX !== undefined ? parseFloat(body.floorplanX) : undefined),
          floorplanY: body.floorplan_y !== undefined ? parseFloat(body.floorplan_y) : (body.floorplanY !== undefined ? parseFloat(body.floorplanY) : undefined),
          floorplanWidth: body.floorplan_width !== undefined ? parseFloat(body.floorplan_width) : (body.floorplanWidth !== undefined ? parseFloat(body.floorplanWidth) : undefined),
          floorplanHeight: body.floorplan_height !== undefined ? parseFloat(body.floorplan_height) : (body.floorplanHeight !== undefined ? parseFloat(body.floorplanHeight) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_reservation") {
      const existing = await db.cmnReservation.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
      }

      const targetSpaceId = body.space_id || body.spaceId || existing.spaceId;
      const targetStartTime = body.start_time || body.startTime ? new Date(body.start_time || body.startTime) : existing.startTime;
      const targetEndTime = body.end_time || body.endTime ? new Date(body.end_time || body.endTime) : existing.endTime;
      const targetStatus = body.status !== undefined ? body.status : existing.status;

      if (targetEndTime <= targetStartTime) {
        return NextResponse.json({ error: "end_time must be greater than start_time" }, { status: 400 });
      }

      // Check conflict if active
      if (targetStatus !== "cancelled") {
        const conflict = await db.cmnReservation.findFirst({
          where: {
            id: { not: id },
            spaceId: targetSpaceId,
            status: { not: "cancelled" },
            startTime: { lt: targetEndTime },
            endTime: { gt: targetStartTime },
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
      }

      const updated = await db.cmnReservation.update({
        where: { id },
        data: {
          spaceId: body.space_id !== undefined ? body.space_id : (body.spaceId !== undefined ? body.spaceId : undefined),
          reservedById: body.reserved_by_id !== undefined ? body.reserved_by_id : (body.reservedById !== undefined ? body.reservedById : undefined),
          subject: body.subject !== undefined ? body.subject : undefined,
          startTime: (body.start_time || body.startTime) ? targetStartTime : undefined,
          endTime: (body.end_time || body.endTime) ? targetEndTime : undefined,
          status: body.status !== undefined ? body.status : undefined,
          attendeesCount: body.attendees_count !== undefined ? parseInt(body.attendees_count, 10) : (body.attendeesCount !== undefined ? parseInt(body.attendeesCount, 10) : undefined),
          capabilitiesNeeded: body.capabilities_needed !== undefined ? (typeof body.capabilities_needed === "string" ? body.capabilities_needed : JSON.stringify(body.capabilities_needed)) : (body.capabilitiesNeeded !== undefined ? (typeof body.capabilitiesNeeded === "string" ? body.capabilitiesNeeded : JSON.stringify(body.capabilitiesNeeded)) : undefined),
          notes: body.notes !== undefined ? body.notes : undefined,
        },
        include: {
          space: true,
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ result: updated });
    }

    if (table === "cmn_location") {
      const updated = await db.cmnLocation.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          street: body.street !== undefined ? body.street : undefined,
          city: body.city !== undefined ? body.city : undefined,
          state: body.state !== undefined ? body.state : undefined,
          country: body.country !== undefined ? body.country : undefined,
          parentId: body.parent_id !== undefined ? (body.parent_id || null) : (body.parentId !== undefined ? (body.parentId || null) : undefined),
          locationType: body.location_type !== undefined ? body.location_type : (body.locationType !== undefined ? body.locationType : undefined),
          fullPath: body.full_path !== undefined ? body.full_path : (body.fullPath !== undefined ? body.fullPath : undefined),
          regionId: body.region_id !== undefined ? (body.region_id || null) : (body.regionId !== undefined ? (body.regionId || null) : undefined),
          stateRefId: body.state_ref_id !== undefined ? (body.state_ref_id || null) : (body.stateRefId !== undefined ? (body.stateRefId || null) : undefined),
          campusId: body.campus_id !== undefined ? (body.campus_id || null) : (body.campusId !== undefined ? (body.campusId || null) : undefined),
          buildingId: body.building_id !== undefined ? (body.building_id || null) : (body.buildingId !== undefined ? (body.buildingId || null) : undefined),
          floorId: body.floor_id !== undefined ? (body.floor_id || null) : (body.floorId !== undefined ? (body.floorId || null) : undefined),
          spaceId: body.space_id !== undefined ? (body.space_id || null) : (body.spaceId !== undefined ? (body.spaceId || null) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "cmdb_ci") {
      const updated = await db.configurationItem.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          ciClass: body.ci_class !== undefined ? body.ci_class : (body.ciClass !== undefined ? body.ciClass : undefined),
          sysClass: body.sys_class !== undefined ? body.sys_class : (body.sysClass !== undefined ? body.sysClass : undefined),
          status: body.status !== undefined ? body.status : undefined,
          operationalStatus: body.operational_status !== undefined ? body.operational_status : (body.operationalStatus !== undefined ? body.operationalStatus : undefined),
          environment: body.environment !== undefined ? body.environment : undefined,
          assetTag: body.asset_tag !== undefined ? body.asset_tag : (body.assetTag !== undefined ? body.assetTag : undefined),
          ipAddress: body.ip_address !== undefined ? body.ip_address : (body.ipAddress !== undefined ? body.ipAddress : undefined),
          hostName: body.host_name !== undefined ? body.host_name : (body.hostName !== undefined ? body.hostName : undefined),
          tier: body.tier !== undefined ? body.tier : undefined,
          owner: body.owner !== undefined ? body.owner : undefined,
          locationId: body.location_id !== undefined ? (body.location_id || null) : (body.locationId !== undefined ? (body.locationId || null) : undefined),
          spaceId: body.space_id !== undefined ? (body.space_id || null) : (body.spaceId !== undefined ? (body.spaceId || null) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "sys_user") {
      const updated = await db.user.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          email: body.email !== undefined ? body.email : undefined,
          userName: body.user_name !== undefined ? body.user_name : (body.userName !== undefined ? body.userName : undefined),
          role: body.role !== undefined ? body.role : undefined,
          roles: body.roles !== undefined ? (Array.isArray(body.roles) ? body.roles.join(",") : body.roles) : undefined,
          title: body.title !== undefined ? body.title : undefined,
          department: body.department !== undefined ? body.department : undefined,
          active: body.active !== undefined ? body.active : undefined,
          locationId: body.location_id !== undefined ? (body.location_id || null) : (body.locationId !== undefined ? (body.locationId || null) : undefined),
          managerId: body.manager_id !== undefined ? (body.manager_id || null) : (body.managerId !== undefined ? (body.managerId || null) : undefined),
          avatar: body.avatar !== undefined ? body.avatar : undefined,
        },
      });
      return NextResponse.json({ result: updated });
    }

    if (table === "sys_user_group") {
      const updated = await db.group.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          description: body.description !== undefined ? body.description : undefined,
          active: body.active !== undefined ? body.active : undefined,
          roles: body.roles !== undefined ? (Array.isArray(body.roles) ? body.roles.join(",") : body.roles) : undefined,
          managerId: body.manager_id !== undefined ? (body.manager_id || null) : (body.managerId !== undefined ? (body.managerId || null) : undefined),
        },
      });
      return NextResponse.json({ result: updated });
    }

    const existingTask = await db.task.findUnique({
      where: { id },
      include: { slaInstances: true, incident: true, changeRequest: true, problem: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Capture old values for sys_audit delta logging
    const oldValues: Record<string, any> = {
      short_description: existingTask.shortDescription,
      description: existingTask.description,
      state: existingTask.state,
      impact: existingTask.impact,
      urgency: existingTask.urgency,
      priority: existingTask.priority,
      assigned_to: existingTask.assignedToId,
      assignment_group: existingTask.assignmentGroupId,
      close_code: existingTask.closeCode,
      close_notes: existingTask.closeNotes,
    };
    if (existingTask.incident) {
      oldValues.category = existingTask.incident.category;
      oldValues.subcategory = existingTask.incident.subcategory;
      oldValues.hold_reason = existingTask.incident.holdReason;
      oldValues.cmdb_ci = existingTask.incident.cmdbCiId;
    }
    if (existingTask.changeRequest) {
      oldValues.risk = existingTask.changeRequest.risk;
      oldValues.type = existingTask.changeRequest.changeType;
      oldValues.cmdb_ci = existingTask.changeRequest.cmdbCiId;
    }
    if (existingTask.problem) {
      oldValues.root_cause = existingTask.problem.rootCause;
      oldValues.workaround = existingTask.problem.workaround;
    }
    if (existingTask.dynamicFields) {
      try {
        const dyn = JSON.parse(existingTask.dynamicFields);
        Object.assign(oldValues, dyn);
      } catch {}
    }

    // 1. Execute ServiceMeow Business Rules: before_update
    const proposed = {
      ...existingTask,
      ...existingTask.incident,
      ...existingTask.changeRequest,
      ...existingTask.problem,
      ...body,
    };
    const beforeRules = await executeBusinessRules(table, "before_update", proposed);
    if (beforeRules.mutatedFields) {
      Object.assign(body, beforeRules.mutatedFields);
    }

    const taskUpdateData: any = {};
    if (body.short_description !== undefined) taskUpdateData.shortDescription = body.short_description;
    if (body.shortDescription !== undefined) taskUpdateData.shortDescription = body.shortDescription;
    if (body.description !== undefined) taskUpdateData.description = body.description;
    if (body.assigned_to_id !== undefined) taskUpdateData.assignedToId = body.assigned_to_id || null;
    if (body.assignedToId !== undefined) taskUpdateData.assignedToId = body.assignedToId || null;
    if (body.assignment_group_id !== undefined) taskUpdateData.assignmentGroupId = body.assignment_group_id || null;
    if (body.assignmentGroupId !== undefined) taskUpdateData.assignmentGroupId = body.assignmentGroupId || null;
    if (body.close_code !== undefined) taskUpdateData.closeCode = body.close_code;
    if (body.closeCode !== undefined) taskUpdateData.closeCode = body.closeCode;
    if (body.close_notes !== undefined) taskUpdateData.closeNotes = body.close_notes;
    if (body.closeNotes !== undefined) taskUpdateData.closeNotes = body.closeNotes;

    // Handle Impact / Urgency / Priority
    if (body.impact !== undefined || body.urgency !== undefined) {
      const impact = body.impact !== undefined ? parseInt(body.impact, 10) : existingTask.impact;
      const urgency = body.urgency !== undefined ? parseInt(body.urgency, 10) : existingTask.urgency;
      taskUpdateData.impact = impact;
      taskUpdateData.urgency = urgency;
      taskUpdateData.priority = calculatePriority(impact, urgency);
    }

    // Handle State Transitions & SLAs
    if (body.state !== undefined) {
      const newState = parseInt(body.state, 10);
      taskUpdateData.state = newState;

      // State 6: Resolved, 7: Closed -> Achieve SLA
      if (newState === 6 || newState === 7) {
        taskUpdateData.closedAt = new Date();
        await db.slaInstance.updateMany({
          where: { taskId: id, state: "in_progress" },
          data: { state: "achieved" },
        });
      }

      // State 3: On Hold -> Pause SLA
      if (newState === 3) {
        await db.slaInstance.updateMany({
          where: { taskId: id, state: "in_progress" },
          data: { state: "paused", pausedAt: new Date() },
        });
      }

      // Back to In Progress from On Hold -> Resume SLA
      if (newState === 2 && existingTask.state === 3) {
        await db.slaInstance.updateMany({
          where: { taskId: id, state: "paused" },
          data: { state: "in_progress", pausedAt: null },
        });
      }
    }

    // Handle Dynamic / Custom Fields in dynamicFields JSON
    const standardKeys = new Set([
      "short_description", "shortDescription", "description", "assigned_to_id", "assignedToId",
      "assignment_group_id", "assignmentGroupId", "close_code", "closeCode", "close_notes",
      "closeNotes", "impact", "urgency", "state", "category", "subcategory", "hold_reason",
      "cmdb_ci_id", "cmdbCiId", "work_note", "customer_comment", "author_id"
    ]);

    let customFields: Record<string, any> = {};
    if (existingTask.dynamicFields) {
      try {
        customFields = JSON.parse(existingTask.dynamicFields);
      } catch {}
    }

    let hasCustomUpdates = false;
    for (const [k, v] of Object.entries(body)) {
      if (!standardKeys.has(k) && v !== undefined) {
        customFields[k] = v;
        hasCustomUpdates = true;
      }
    }
    if (hasCustomUpdates) {
      taskUpdateData.dynamicFields = JSON.stringify(customFields);
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: taskUpdateData,
    });

    // Update incident specific fields if present
    if (existingTask.incident && (body.category !== undefined || body.subcategory !== undefined || body.hold_reason !== undefined || body.cmdb_ci_id !== undefined || body.cmdbCiId !== undefined)) {
      await db.incident.update({
        where: { taskId: id },
        data: {
          category: body.category !== undefined ? body.category : undefined,
          subcategory: body.subcategory !== undefined ? body.subcategory : undefined,
          holdReason: body.hold_reason !== undefined ? body.hold_reason : undefined,
          cmdbCiId: (body.cmdb_ci_id !== undefined ? (body.cmdb_ci_id || null) : (body.cmdbCiId !== undefined ? (body.cmdbCiId || null) : undefined)),
        },
      });
    }

    // Update changeRequest specific fields if present
    if (existingTask.changeRequest && (body.risk !== undefined || body.type !== undefined || body.changeType !== undefined || body.cmdb_ci_id !== undefined || body.cmdbCiId !== undefined)) {
      await db.changeRequest.update({
        where: { taskId: id },
        data: {
          risk: body.risk !== undefined ? body.risk : undefined,
          changeType: body.type !== undefined ? body.type : (body.changeType !== undefined ? body.changeType : undefined),
          cmdbCiId: (body.cmdb_ci_id !== undefined ? (body.cmdb_ci_id || null) : (body.cmdbCiId !== undefined ? (body.cmdbCiId || null) : undefined)),
        },
      });
    }

    // Update problem specific fields if present
    if (existingTask.problem && (body.root_cause !== undefined || body.rootCause !== undefined || body.workaround !== undefined)) {
      await db.problem.update({
        where: { taskId: id },
        data: {
          rootCause: body.root_cause !== undefined ? body.root_cause : (body.rootCause !== undefined ? body.rootCause : undefined),
          workaround: body.workaround !== undefined ? body.workaround : undefined,
        },
      });
    }

    // Add activity note if user provided a work note or comment
    if (body.work_note) {
      await db.activityNote.create({
        data: {
          taskId: id,
          authorId: body.author_id || null,
          noteType: "work_note",
          content: body.work_note,
        },
      });
    } else if (body.customer_comment) {
      await db.activityNote.create({
        data: {
          taskId: id,
          authorId: body.author_id || null,
          noteType: "customer_comment",
          content: body.customer_comment,
        },
      });
    }

    // Add before_update work notes
    for (const note of beforeRules.workNotes) {
      await db.activityNote.create({
        data: {
          taskId: id,
          noteType: "work_note",
          content: note,
        },
      });
    }

    // 2. Execute ServiceMeow Business Rules: after_update
    const updatedFlat = {
      ...existingTask,
      ...existingTask.incident,
      ...existingTask.changeRequest,
      ...existingTask.problem,
      ...updatedTask,
      ...customFields,
      ...body,
      number: updatedTask.number,
      id: updatedTask.id,
      state: updatedTask.state,
      priority: updatedTask.priority,
    };

    const afterRules = await executeBusinessRules(table, "after_update", updatedFlat);
    for (const note of afterRules.workNotes) {
      await db.activityNote.create({
        data: {
          taskId: id,
          noteType: "work_note",
          content: note,
        },
      });
    }

    // 3. Trigger ServiceMeow Hub Flows
    await triggerFlows(table, updatedFlat);

    // 4. Audit Logging (sys_audit deltas)
    const newValues: Record<string, any> = {
      short_description: updatedTask.shortDescription,
      description: updatedTask.description,
      state: updatedTask.state,
      impact: updatedTask.impact,
      urgency: updatedTask.urgency,
      priority: updatedTask.priority,
      assigned_to: updatedTask.assignedToId,
      assignment_group: updatedTask.assignmentGroupId,
      close_code: updatedTask.closeCode,
      close_notes: updatedTask.closeNotes,
      ...customFields,
    };
    if (existingTask.incident) {
      if (body.category !== undefined) newValues.category = body.category;
      if (body.subcategory !== undefined) newValues.subcategory = body.subcategory;
      if (body.hold_reason !== undefined) newValues.hold_reason = body.hold_reason;
      if (body.cmdb_ci_id !== undefined || body.cmdbCiId !== undefined) {
        newValues.cmdb_ci = body.cmdb_ci_id ?? body.cmdbCiId;
      }
    }
    if (existingTask.changeRequest) {
      if (body.risk !== undefined) newValues.risk = body.risk;
      if (body.type !== undefined) newValues.type = body.type;
      if (body.changeType !== undefined) newValues.type = body.changeType;
      if (body.cmdb_ci_id !== undefined || body.cmdbCiId !== undefined) {
        newValues.cmdb_ci = body.cmdb_ci_id ?? body.cmdbCiId;
      }
    }
    if (existingTask.problem) {
      if (body.root_cause !== undefined) newValues.root_cause = body.root_cause;
      if (body.rootCause !== undefined) newValues.root_cause = body.rootCause;
      if (body.workaround !== undefined) newValues.workaround = body.workaround;
    }

    const taskAudits = [];
    for (const [k, newVal] of Object.entries(newValues)) {
      const oldVal = oldValues[k];
      const oldStr = oldVal !== undefined && oldVal !== null ? String(oldVal) : null;
      const newStr = newVal !== undefined && newVal !== null ? String(newVal) : null;
      if (oldStr !== newStr && (oldVal !== undefined || newVal !== undefined)) {
        taskAudits.push({
          tableName: table,
          documentId: id,
          fieldName: k,
          oldValue: oldStr,
          newValue: newStr,
          userId: callerUserId,
          userName: callerUserName,
        });
      }
    }
    if (taskAudits.length > 0) {
      await logAudit(taskAudits);
    }

    return NextResponse.json({
      result: {
        ...updatedTask,
        ...customFields,
      },
      executedRules: [...beforeRules.executedRules, ...afterRules.executedRules],
    });
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const { table, id } = await params;

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Enforce ACL
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "delete",
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

    if (table === "cmn_region") {
      await db.cmnRegion.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_state") {
      await db.cmnState.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_campus") {
      await db.cmnCampus.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_building") {
      await db.cmnBuilding.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_floor") {
      await db.cmnFloor.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_space") {
      await db.cmnSpace.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_reservation") {
      await db.cmnReservation.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmn_location") {
      await db.cmnLocation.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "cmdb_ci") {
      await db.configurationItem.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "sys_user") {
      await db.user.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "sys_user_group") {
      await db.group.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    if (table === "sys_user_grmember") {
      await db.userGroupMember.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    const tableMeta = await db.sysDbObject.findUnique({ where: { name: table } });
    if (tableMeta && tableMeta.superClass !== "task" && tableMeta.isCustom) {
      await db.sysCustomRecord.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", sys_id: id } });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ result: { status: "deleted", sys_id: id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
