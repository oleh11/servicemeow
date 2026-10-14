import { db } from "./db";
import { TABLE_METADATA } from "./schema";

export interface ResolvedReference {
  value: string;
  display_value: string;
  link?: string;
  details?: any;
}

export interface DotWalkSegment {
  table: string;
  id: string;
  field: string;
  display: string;
}

export interface DotWalkResult {
  path: string;
  terminalValue: any;
  displayValue: string;
  segments: DotWalkSegment[];
}

export interface ReferenceCandidate {
  value: string;
  display_value: string;
  subtitle?: string;
  details?: any;
}

export interface ReferenceCandidateResponse {
  results: ReferenceCandidate[];
  total: number;
  page: number;
  limit: number;
  dependentQualifierApplied?: boolean;
}

/**
 * Normalizes field naming between camelCase and snake_case
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "");
}

/**
 * Atomic number generation using the sys_number table.
 * Thread-safe / transaction-safe increment.
 */
export async function getNextTaskNumber(tableName: string = "incident", customPrefix?: string): Promise<string> {
  const meta = TABLE_METADATA[tableName];
  const prefix = customPrefix || meta?.numberPrefix || tableName.substring(0, 3).toUpperCase();
  const digits = 7;

  // Use an atomic upsert transaction
  const record = await db.$transaction(async (tx) => {
    let sysNum = await tx.sysNumber.findUnique({
      where: { tableName },
    });

    if (!sysNum) {
      let initialNumber = 1001;
      if (tableName === "cmn_reservation") {
        const highest = await tx.cmnReservation.findFirst({
          orderBy: { number: "desc" },
        });
        if (highest?.number) {
          const match = highest.number.match(/\d+$/);
          if (match) {
            initialNumber = parseInt(match[0], 10) + 1;
          }
        }
      } else if (tableName === "incident" || tableName === "task" || tableName === "change_request" || tableName === "problem") {
        const highest = await tx.task.findFirst({
          where: tableName !== "task" ? { sysClassName: tableName } : {},
          orderBy: { number: "desc" },
        });
        if (highest?.number) {
          const match = highest.number.match(/\d+$/);
          if (match) {
            initialNumber = parseInt(match[0], 10) + 1;
          }
        }
      }

      sysNum = await tx.sysNumber.create({
        data: {
          tableName,
          prefix,
          digits,
          currentNumber: initialNumber,
        },
      });
      return sysNum;
    } else {
      let nextNum = sysNum.currentNumber + 1;
      if (tableName === "cmn_reservation") {
        const highest = await tx.cmnReservation.findFirst({
          orderBy: { number: "desc" },
        });
        if (highest?.number) {
          const match = highest.number.match(/\d+$/);
          if (match) {
            const highestNum = parseInt(match[0], 10);
            if (nextNum <= highestNum) {
              nextNum = highestNum + 1;
            }
          }
        }
      }

      sysNum = await tx.sysNumber.update({
        where: { tableName },
        data: {
          currentNumber: nextNum,
        },
      });
      return sysNum;
    }
  });

  const paddedNum = String(record.currentNumber).padStart(record.digits || digits, "0");
  return `${record.prefix}${paddedNum}`;
}

/**
 * Resolves a single foreign key record into a standard ReferenceValue
 */
export async function resolveReference(tableName: string, recordId: string): Promise<ResolvedReference | null> {
  if (!recordId) return null;

  try {
    switch (tableName) {
      case "sys_user": {
        const user = await db.user.findUnique({ where: { id: recordId } });
        if (!user) return null;
        return {
          value: user.id,
          display_value: user.name || user.userName || user.email,
          link: `/api/now/table/sys_user/${user.id}`,
          details: user,
        };
      }
      case "sys_user_group": {
        const group = await db.group.findUnique({ where: { id: recordId } });
        if (!group) return null;
        return {
          value: group.id,
          display_value: group.name,
          link: `/api/now/table/sys_user_group/${group.id}`,
          details: group,
        };
      }
      case "cmn_location": {
        const loc = await db.cmnLocation.findUnique({ where: { id: recordId } });
        if (!loc) return null;
        return {
          value: loc.id,
          display_value: loc.name,
          link: `/api/now/table/cmn_location/${loc.id}`,
          details: loc,
        };
      }
      case "cmn_region": {
        const r = await db.cmnRegion.findUnique({ where: { id: recordId } });
        if (!r) return null;
        return {
          value: r.id,
          display_value: `${r.name} (${r.code})`,
          link: `/api/now/table/cmn_region/${r.id}`,
          details: r,
        };
      }
      case "cmn_state": {
        const s = await db.cmnState.findUnique({ where: { id: recordId }, include: { region: true } });
        if (!s) return null;
        return {
          value: s.id,
          display_value: `${s.name} (${s.code})`,
          link: `/api/now/table/cmn_state/${s.id}`,
          details: s,
        };
      }
      case "cmn_campus": {
        const c = await db.cmnCampus.findUnique({ where: { id: recordId }, include: { state: true } });
        if (!c) return null;
        return {
          value: c.id,
          display_value: `${c.name} (${c.code})`,
          link: `/api/now/table/cmn_campus/${c.id}`,
          details: c,
        };
      }
      case "cmn_building": {
        const b = await db.cmnBuilding.findUnique({ where: { id: recordId }, include: { campus: true } });
        if (!b) return null;
        return {
          value: b.id,
          display_value: `${b.name} (${b.code})`,
          link: `/api/now/table/cmn_building/${b.id}`,
          details: b,
        };
      }
      case "cmn_floor": {
        const f = await db.cmnFloor.findUnique({ where: { id: recordId }, include: { building: true } });
        if (!f) return null;
        return {
          value: f.id,
          display_value: `${f.name} (Floor ${f.floorNumber})`,
          link: `/api/now/table/cmn_floor/${f.id}`,
          details: f,
        };
      }
      case "cmn_space": {
        const sp = await db.cmnSpace.findUnique({
          where: { id: recordId },
          include: { floor: { include: { building: true } } },
        });
        if (!sp) return null;
        return {
          value: sp.id,
          display_value: `${sp.name} [${sp.spaceNumber}]`,
          link: `/api/now/table/cmn_space/${sp.id}`,
          details: sp,
        };
      }
      case "cmn_reservation": {
        const res = await db.cmnReservation.findUnique({
          where: { id: recordId },
          include: { space: true, reservedBy: true },
        });
        if (!res) return null;
        return {
          value: res.id,
          display_value: `${res.number} - ${res.subject} (${res.space?.name || "Space"})`,
          link: `/api/now/table/cmn_reservation/${res.id}`,
          details: res,
        };
      }
      case "cmdb_ci": {
        const ci = await db.configurationItem.findUnique({ where: { id: recordId } });
        if (!ci) return null;
        return {
          value: ci.id,
          display_value: ci.name,
          link: `/api/now/table/cmdb_ci/${ci.id}`,
          details: ci,
        };
      }
      case "task":
      case "incident": {
        const task = await db.task.findUnique({ where: { id: recordId } });
        if (!task) return null;
        return {
          value: task.id,
          display_value: task.number,
          link: `/api/now/table/${tableName}/${task.id}`,
          details: task,
        };
      }
      default: {
        return {
          value: recordId,
          display_value: recordId,
        };
      }
    }
  } catch (error) {
    console.error(`Error resolving reference for ${tableName}:${recordId}:`, error);
    return null;
  }
}

/**
 * Resolves all foreign key references in a given record according to table metadata
 */
export async function resolveRecordReferences(tableName: string, record: Record<string, any>): Promise<Record<string, any>> {
  if (!record) return record;
  const meta = TABLE_METADATA[tableName];
  if (!meta) return record;

  const resolved = { ...record };

  for (const [refKey, targetTable] of Object.entries(meta.referenceFields)) {
    // Check both snake_case and camelCase forms
    const camelKey = refKey.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    const rawVal = record[refKey] ?? record[camelKey];

    if (rawVal && typeof rawVal === "string") {
      const refObj = await resolveReference(targetTable, rawVal);
      if (refObj) {
        resolved[refKey] = refObj;
      }
    } else if (rawVal && typeof rawVal === "object" && rawVal.id) {
      const refObj = await resolveReference(targetTable, rawVal.id);
      if (refObj) {
        resolved[refKey] = refObj;
      }
    }
  }

  return resolved;
}

/**
 * Multi-hop dot-walking evaluator.
 * Traverses relations through tables (e.g. "caller_id.manager.email" or "cmdb_ci.location.name").
 */
export async function resolveDotWalk(
  rootTable: string,
  rootId: string,
  dotPath: string
): Promise<DotWalkResult> {
  const parts = dotPath.split(".");
  // Strip leading table name if supplied (e.g. "incident.caller_id.manager" -> ["caller_id", "manager"])
  if (parts.length > 0 && parts[0].toLowerCase() === rootTable.toLowerCase()) {
    parts.shift();
  }

  if (parts.length === 0) {
    throw new Error(`Empty dot-walk path for table ${rootTable}`);
  }

  let currentTable = rootTable;
  let currentRecordId = rootId;
  let currentRecord: any = null;
  const segments: DotWalkSegment[] = [];

  // Fetch the initial root record
  if (currentTable === "incident" || currentTable === "task") {
    currentRecord = await db.task.findUnique({
      where: { id: currentRecordId },
      include: {
        incident: true,
        assignedTo: true,
        assignmentGroup: true,
        openedBy: true,
        cmdbCi: true,
      },
    });
    if (currentRecord?.incident) {
      currentRecord = { ...currentRecord, ...currentRecord.incident };
    }
  } else if (currentTable === "sys_user") {
    currentRecord = await db.user.findUnique({
      where: { id: currentRecordId },
      include: { manager: true, location: true },
    });
  } else if (currentTable === "sys_user_group") {
    currentRecord = await db.group.findUnique({
      where: { id: currentRecordId },
      include: { manager: true },
    });
  } else if (currentTable === "cmn_location") {
    currentRecord = await db.cmnLocation.findUnique({
      where: { id: currentRecordId },
      include: { parent: true },
    });
  } else if (currentTable === "cmdb_ci") {
    currentRecord = await db.configurationItem.findUnique({
      where: { id: currentRecordId },
      include: { location: true, space: true },
    });
  } else if (currentTable === "cmn_region") {
    currentRecord = await db.cmnRegion.findUnique({ where: { id: currentRecordId } });
  } else if (currentTable === "cmn_state") {
    currentRecord = await db.cmnState.findUnique({ where: { id: currentRecordId }, include: { region: true } });
  } else if (currentTable === "cmn_campus") {
    currentRecord = await db.cmnCampus.findUnique({ where: { id: currentRecordId }, include: { state: true } });
  } else if (currentTable === "cmn_building") {
    currentRecord = await db.cmnBuilding.findUnique({ where: { id: currentRecordId }, include: { campus: true } });
  } else if (currentTable === "cmn_floor") {
    currentRecord = await db.cmnFloor.findUnique({ where: { id: currentRecordId }, include: { building: true } });
  } else if (currentTable === "cmn_space") {
    currentRecord = await db.cmnSpace.findUnique({ where: { id: currentRecordId }, include: { floor: true } });
  } else if (currentTable === "cmn_reservation") {
    currentRecord = await db.cmnReservation.findUnique({ where: { id: currentRecordId }, include: { space: true, reservedBy: true } });
  }

  if (!currentRecord) {
    throw new Error(`Root record ${rootTable}:${rootId} not found`);
  }

  for (let i = 0; i < parts.length; i++) {
    const rawSegment = parts[i];
    const isTerminal = i === parts.length - 1;

    // Normalizations for matching
    const token = rawSegment.trim();
    const tokenNorm = normalizeKey(token);

    // Look for matching reference relationship in meta
    const meta = TABLE_METADATA[currentTable];
    let matchedRefField: string | null = null;
    let nextTable: string | null = null;

    if (meta?.referenceFields) {
      for (const [refField, target] of Object.entries(meta.referenceFields)) {
        if (
          normalizeKey(refField) === tokenNorm ||
          normalizeKey(refField).replace(/id$/, "") === tokenNorm ||
          tokenNorm.replace(/id$/, "") === normalizeKey(refField).replace(/id$/, "")
        ) {
          matchedRefField = refField;
          nextTable = target;
          break;
        }
      }
    }

    // Special cases: relations direct on Prisma objects
    if (!matchedRefField) {
      if (tokenNorm === "manager" && (currentTable === "sys_user" || currentTable === "sys_user_group")) {
        matchedRefField = "managerId";
        nextTable = "sys_user";
      } else if (tokenNorm === "location" && (currentTable === "sys_user" || currentTable === "cmdb_ci")) {
        matchedRefField = "locationId";
        nextTable = "cmn_location";
      } else if (tokenNorm === "parent" && currentTable === "cmn_location") {
        matchedRefField = "parentId";
        nextTable = "cmn_location";
      } else if (tokenNorm === "cmdbci" || tokenNorm === "ci") {
        matchedRefField = "cmdbCiId";
        nextTable = "cmdb_ci";
      } else if (tokenNorm === "caller") {
        matchedRefField = "callerId";
        nextTable = "sys_user";
      } else if (tokenNorm === "floor" && currentTable === "cmn_space") {
        matchedRefField = "floorId";
        nextTable = "cmn_floor";
      } else if (tokenNorm === "building" && currentTable === "cmn_floor") {
        matchedRefField = "buildingId";
        nextTable = "cmn_building";
      } else if (tokenNorm === "campus" && currentTable === "cmn_building") {
        matchedRefField = "campusId";
        nextTable = "cmn_campus";
      } else if (tokenNorm === "state" && currentTable === "cmn_campus") {
        matchedRefField = "stateId";
        nextTable = "cmn_state";
      } else if (tokenNorm === "region" && currentTable === "cmn_state") {
        matchedRefField = "regionId";
        nextTable = "cmn_region";
      } else if (tokenNorm === "space" && (currentTable === "cmdb_ci" || currentTable === "cmn_reservation")) {
        matchedRefField = "spaceId";
        nextTable = "cmn_space";
      } else if ((tokenNorm === "reservedby" || tokenNorm === "reserved_by") && currentTable === "cmn_reservation") {
        matchedRefField = "reservedById";
        nextTable = "sys_user";
      }
    }

    if (!isTerminal && matchedRefField && nextTable) {
      // Find the foreign key ID
      const fkId =
        currentRecord[matchedRefField] ||
        currentRecord[matchedRefField.replace(/_([a-z])/g, (_, l) => l.toUpperCase())] ||
        (currentRecord[token] && currentRecord[token].id) ||
        (matchedRefField.endsWith("_id") && currentRecord[matchedRefField.slice(0, -3)]?.id);

      if (!fkId) {
        return {
          path: dotPath,
          terminalValue: null,
          displayValue: "(empty)",
          segments,
        };
      }

      // Fetch the next hop record
      let nextRec: any = null;
      if (nextTable === "sys_user") {
        nextRec = await db.user.findUnique({
          where: { id: fkId },
          include: { manager: true, location: true },
        });
      } else if (nextTable === "sys_user_group") {
        nextRec = await db.group.findUnique({
          where: { id: fkId },
          include: { manager: true },
        });
      } else if (nextTable === "cmn_location") {
        nextRec = await db.cmnLocation.findUnique({
          where: { id: fkId },
          include: { parent: true },
        });
      } else if (nextTable === "cmdb_ci") {
        nextRec = await db.configurationItem.findUnique({
          where: { id: fkId },
          include: { location: true, space: true },
        });
      } else if (nextTable === "cmn_region") {
        nextRec = await db.cmnRegion.findUnique({ where: { id: fkId } });
      } else if (nextTable === "cmn_state") {
        nextRec = await db.cmnState.findUnique({ where: { id: fkId }, include: { region: true } });
      } else if (nextTable === "cmn_campus") {
        nextRec = await db.cmnCampus.findUnique({ where: { id: fkId }, include: { state: true } });
      } else if (nextTable === "cmn_building") {
        nextRec = await db.cmnBuilding.findUnique({ where: { id: fkId }, include: { campus: true } });
      } else if (nextTable === "cmn_floor") {
        nextRec = await db.cmnFloor.findUnique({ where: { id: fkId }, include: { building: true } });
      } else if (nextTable === "cmn_space") {
        nextRec = await db.cmnSpace.findUnique({ where: { id: fkId }, include: { floor: true } });
      } else if (nextTable === "cmn_reservation") {
        nextRec = await db.cmnReservation.findUnique({ where: { id: fkId }, include: { space: true, reservedBy: true } });
      }

      if (!nextRec) {
        return {
          path: dotPath,
          terminalValue: null,
          displayValue: "(not found)",
          segments,
        };
      }

      const nextMeta = TABLE_METADATA[nextTable];
      const displayVal = nextRec[nextMeta?.displayField || "name"] || nextRec.name || fkId;

      segments.push({
        table: nextTable,
        id: fkId,
        field: token,
        display: String(displayVal),
      });

      currentTable = nextTable;
      currentRecordId = fkId;
      currentRecord = nextRec;
    } else {
      // Terminal property or reference without further hops
      let terminalValue =
        currentRecord[token] ??
        currentRecord[token.replace(/_([a-z])/g, (_, l) => l.toUpperCase())];

      if (terminalValue === undefined) {
        // Try snake case / lowercase scan
        for (const [k, v] of Object.entries(currentRecord)) {
          if (normalizeKey(k) === tokenNorm) {
            terminalValue = v;
            break;
          }
        }
      }

      // If terminal is a reference field that was asked directly (e.g. dot-walk ending on "manager")
      if (matchedRefField && nextTable && terminalValue && typeof terminalValue === "string") {
        const refObj = await resolveReference(nextTable, terminalValue);
        return {
          path: dotPath,
          terminalValue: refObj?.value ?? terminalValue,
          displayValue: refObj?.display_value ?? String(terminalValue),
          segments,
        };
      }

      return {
        path: dotPath,
        terminalValue: terminalValue ?? null,
        displayValue: terminalValue !== null && terminalValue !== undefined ? String(terminalValue) : "",
        segments,
      };
    }
  }

  return {
    path: dotPath,
    terminalValue: currentRecordId,
    displayValue: currentRecord?.name || currentRecord?.number || currentRecordId,
    segments,
  };
}

/**
 * Dynamic reference qualifier query service.
 * Supports dependent filtering (e.g. assigned_to filtered by assignment_group via sys_user_grmember),
 * fuzzy search on display fields, and pagination.
 */
export async function getDynamicReferenceCandidates(
  targetTable: string,
  options: {
    search?: string;
    dependentField?: string;
    dependentValue?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ReferenceCandidateResponse> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;
  const search = options.search?.trim() || "";

  switch (targetTable) {
    case "sys_user": {
      // Check for dynamic reference qualifier: assigned_to dependent on assignment_group
      const isGroupDependent =
        (options.dependentField === "assignment_group" || options.dependentField === "assignmentGroupId") &&
        Boolean(options.dependentValue);

      if (isGroupDependent) {
        // Query users through sys_user_grmember
        const memberWhere: any = {
          groupId: options.dependentValue,
          user: {
            active: true,
          },
        };

        if (search) {
          memberWhere.user.OR = [
            { name: { contains: search } },
            { userName: { contains: search } },
            { email: { contains: search } },
          ];
        }

        const [total, members] = await Promise.all([
          db.userGroupMember.count({ where: memberWhere }),
          db.userGroupMember.findMany({
            where: memberWhere,
            skip,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  userName: true,
                  email: true,
                  title: true,
                  department: true,
                  avatar: true,
                },
              },
            },
            orderBy: { user: { name: "asc" } },
          }),
        ]);

        return {
          results: members.map((m) => ({
            value: m.user.id,
            display_value: m.user.name || m.user.userName || m.user.email,
            subtitle: m.user.title ? `${m.user.title} • ${m.user.email}` : m.user.email,
            details: m.user,
          })),
          total,
          page,
          limit,
          dependentQualifierApplied: true,
        };
      }

      // Default sys_user search
      const userWhere: any = { active: true };
      if (search) {
        userWhere.OR = [
          { name: { contains: search } },
          { userName: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const [total, users] = await Promise.all([
        db.user.count({ where: userWhere }),
        db.user.findMany({
          where: userWhere,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            userName: true,
            email: true,
            title: true,
            department: true,
            avatar: true,
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: users.map((u) => ({
          value: u.id,
          display_value: u.name || u.userName || u.email,
          subtitle: u.title ? `${u.title} • ${u.email}` : u.email,
          details: u,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: false,
      };
    }

    case "sys_user_group": {
      const groupWhere: any = { active: true };
      if (search) {
        groupWhere.name = { contains: search };
      }

      const [total, groups] = await Promise.all([
        db.group.count({ where: groupWhere }),
        db.group.findMany({
          where: groupWhere,
          skip,
          take: limit,
          include: {
            manager: { select: { id: true, name: true } },
            _count: { select: { members: true } },
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: groups.map((g) => ({
          value: g.id,
          display_value: g.name,
          subtitle: `${g._count.members} members${g.manager ? ` • Lead: ${g.manager.name}` : ""}`,
          details: g,
        })),
        total,
        page,
        limit,
      };
    }

    case "cmn_location": {
      const locWhere: any = {};
      if (search) {
        locWhere.OR = [
          { name: { contains: search } },
          { city: { contains: search } },
          { state: { contains: search } },
          { country: { contains: search } },
        ];
      }

      const [total, locations] = await Promise.all([
        db.cmnLocation.count({ where: locWhere }),
        db.cmnLocation.findMany({
          where: locWhere,
          skip,
          take: limit,
          include: {
            parent: { select: { id: true, name: true } },
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: locations.map((loc) => ({
          value: loc.id,
          display_value: loc.name,
          subtitle: [loc.city, loc.state, loc.country].filter(Boolean).join(", ") || (loc.parent ? `Parent: ${loc.parent.name}` : "Global"),
          details: loc,
        })),
        total,
        page,
        limit,
      };
    }

    case "cmdb_ci": {
      const ciWhere: any = {};
      if (search) {
        ciWhere.OR = [
          { name: { contains: search } },
          { hostName: { contains: search } },
          { ipAddress: { contains: search } },
          { assetTag: { contains: search } },
        ];
      }

      const [total, cis] = await Promise.all([
        db.configurationItem.count({ where: ciWhere }),
        db.configurationItem.findMany({
          where: ciWhere,
          skip,
          take: limit,
          include: {
            location: { select: { id: true, name: true } },
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: cis.map((ci) => ({
          value: ci.id,
          display_value: ci.name,
          subtitle: `${ci.ciClass} • ${ci.environment} • ${ci.status}${ci.location ? ` • ${ci.location.name}` : ""}`,
          details: ci,
        })),
        total,
        page,
        limit,
      };
    }

    case "cmn_region": {
      const regionWhere: any = {};
      if (search) {
        regionWhere.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
        ];
      }

      const [total, regions] = await Promise.all([
        db.cmnRegion.count({ where: regionWhere }),
        db.cmnRegion.findMany({
          where: regionWhere,
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: regions.map((r) => ({
          value: r.id,
          display_value: `${r.name} (${r.code})`,
          subtitle: r.description || `Region Code: ${r.code}`,
          details: r,
        })),
        total,
        page,
        limit,
      };
    }

    case "cmn_state": {
      const stateWhere: any = {};
      const isRegionDependent =
        (options.dependentField === "region" || options.dependentField === "region_id" || options.dependentField === "regionId") &&
        Boolean(options.dependentValue);

      if (isRegionDependent) {
        stateWhere.regionId = options.dependentValue;
      }
      if (search) {
        stateWhere.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
        ];
      }

      const [total, states] = await Promise.all([
        db.cmnState.count({ where: stateWhere }),
        db.cmnState.findMany({
          where: stateWhere,
          skip,
          take: limit,
          include: { region: { select: { id: true, name: true, code: true } } },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: states.map((s) => ({
          value: s.id,
          display_value: `${s.name} (${s.code})`,
          subtitle: (s.region ? `Region: ${s.region.name} (${s.region.code})` : s.country) || undefined,
          details: s,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isRegionDependent,
      };
    }

    case "cmn_campus": {
      const campusWhere: any = {};
      const isStateDependent =
        (options.dependentField === "state" || options.dependentField === "state_id" || options.dependentField === "stateId") &&
        Boolean(options.dependentValue);

      if (isStateDependent) {
        campusWhere.stateId = options.dependentValue;
      }
      if (search) {
        campusWhere.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
          { city: { contains: search } },
        ];
      }

      const [total, campuses] = await Promise.all([
        db.cmnCampus.count({ where: campusWhere }),
        db.cmnCampus.findMany({
          where: campusWhere,
          skip,
          take: limit,
          include: { state: { select: { id: true, name: true, code: true } } },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: campuses.map((c) => ({
          value: c.id,
          display_value: `${c.name} (${c.code})`,
          subtitle: [c.city, c.state?.name].filter(Boolean).join(", ") || c.address || c.code,
          details: c,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isStateDependent,
      };
    }

    case "cmn_building": {
      const buildingWhere: any = {};
      const isCampusDependent =
        (options.dependentField === "campus" || options.dependentField === "campus_id" || options.dependentField === "campusId") &&
        Boolean(options.dependentValue);

      if (isCampusDependent) {
        buildingWhere.campusId = options.dependentValue;
      }
      if (search) {
        buildingWhere.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
          { buildingType: { contains: search } },
        ];
      }

      const [total, buildings] = await Promise.all([
        db.cmnBuilding.count({ where: buildingWhere }),
        db.cmnBuilding.findMany({
          where: buildingWhere,
          skip,
          take: limit,
          include: { campus: { select: { id: true, name: true, code: true } } },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        results: buildings.map((b) => ({
          value: b.id,
          display_value: `${b.name} (${b.code})`,
          subtitle: `${b.buildingType || "Building"}${b.campus ? ` • Campus: ${b.campus.name}` : ""}`,
          details: b,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isCampusDependent,
      };
    }

    case "cmn_floor": {
      const floorWhere: any = {};
      const isBuildingDependent =
        (options.dependentField === "building" || options.dependentField === "building_id" || options.dependentField === "buildingId") &&
        Boolean(options.dependentValue);

      if (isBuildingDependent) {
        floorWhere.buildingId = options.dependentValue;
      }
      if (search) {
        floorWhere.OR = [
          { name: { contains: search } },
          { code: { contains: search } },
        ];
      }

      const [total, floors] = await Promise.all([
        db.cmnFloor.count({ where: floorWhere }),
        db.cmnFloor.findMany({
          where: floorWhere,
          skip,
          take: limit,
          include: { building: { select: { id: true, name: true, code: true } } },
          orderBy: [{ floorNumber: "asc" }, { name: "asc" }],
        }),
      ]);

      return {
        results: floors.map((f) => ({
          value: f.id,
          display_value: `${f.name} (Floor ${f.floorNumber})`,
          subtitle: f.building ? `Building: ${f.building.name} • ${f.code}` : f.code,
          details: f,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isBuildingDependent,
      };
    }

    case "cmn_space": {
      const spaceWhere: any = {};
      const isFloorDependent =
        (options.dependentField === "floor" || options.dependentField === "floor_id" || options.dependentField === "floorId") &&
        Boolean(options.dependentValue);

      if (isFloorDependent) {
        spaceWhere.floorId = options.dependentValue;
      }
      if (search) {
        spaceWhere.OR = [
          { name: { contains: search } },
          { spaceNumber: { contains: search } },
          { spaceType: { contains: search } },
          { department: { contains: search } },
        ];
      }

      const [total, spaces] = await Promise.all([
        db.cmnSpace.count({ where: spaceWhere }),
        db.cmnSpace.findMany({
          where: spaceWhere,
          skip,
          take: limit,
          include: {
            floor: {
              select: {
                id: true,
                name: true,
                floorNumber: true,
                building: { select: { id: true, name: true, code: true } },
              },
            },
          },
          orderBy: [{ spaceNumber: "asc" }, { name: "asc" }],
        }),
      ]);

      return {
        results: spaces.map((sp) => ({
          value: sp.id,
          display_value: `${sp.name} [${sp.spaceNumber}]`,
          subtitle: `${sp.spaceType}${sp.floor ? ` • Floor ${sp.floor.floorNumber}` : ""} (${sp.status})${sp.floor?.building ? ` • Bldg: ${sp.floor.building.name}` : ""}`,
          details: sp,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isFloorDependent,
      };
    }

    case "task":
    case "incident": {
      const taskWhere: any = {};
      if (targetTable === "incident") {
        taskWhere.sysClassName = "incident";
      }
      if (search) {
        taskWhere.OR = [
          { number: { contains: search } },
          { shortDescription: { contains: search } },
        ];
      }

      const [total, tasks] = await Promise.all([
        db.task.count({ where: taskWhere }),
        db.task.findMany({
          where: taskWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        results: tasks.map((t) => ({
          value: t.id,
          display_value: `${t.number} - ${t.shortDescription}`,
          subtitle: `Priority ${t.priority} • State ${t.state}`,
          details: t,
        })),
        total,
        page,
        limit,
      };
    }

    case "cmn_reservation": {
      const resWhere: any = {};
      const isSpaceDependent =
        (options.dependentField === "space" || options.dependentField === "space_id" || options.dependentField === "spaceId") &&
        Boolean(options.dependentValue);

      if (isSpaceDependent) {
        resWhere.spaceId = options.dependentValue;
      }
      if (search) {
        resWhere.OR = [
          { number: { contains: search } },
          { subject: { contains: search } },
        ];
      }

      const [total, reservations] = await Promise.all([
        db.cmnReservation.count({ where: resWhere }),
        db.cmnReservation.findMany({
          where: resWhere,
          skip,
          take: limit,
          include: {
            space: { select: { id: true, name: true, spaceNumber: true } },
            reservedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { startTime: "desc" },
        }),
      ]);

      return {
        results: reservations.map((r) => ({
          value: r.id,
          display_value: `${r.number} - ${r.subject}`,
          subtitle: `${r.space?.name || "Space"} • ${r.status} (${new Date(r.startTime).toLocaleDateString()})`,
          details: r,
        })),
        total,
        page,
        limit,
        dependentQualifierApplied: isSpaceDependent,
      };
    }

    default: {
      return {
        results: [],
        total: 0,
        page,
        limit,
      };
    }
  }
}
