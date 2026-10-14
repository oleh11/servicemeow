/**
 * Parses sysparm_query syntax into Prisma where/orderBy clauses.
 * Examples:
 *   active=true^priority=1^ORDERBYDESCsys_created_on
 *   category=network^state!=7
 */

export interface ParsedCondition {
  field: string;
  operator: "=" | "!=" | "LIKE" | "STARTSWITH" | ">" | "<" | ">=" | "<=";
  value: string;
}

export interface ParsedQuery {
  conditions: ParsedCondition[];
  orderBy?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export function parseEncodedQuery(queryStr?: string | null): ParsedQuery {
  if (!queryStr) {
    return { conditions: [] };
  }

  const parts = queryStr.split("^");
  const conditions: ParsedCondition[] = [];
  let orderBy: ParsedQuery["orderBy"] = undefined;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("ORDERBYDESC")) {
      const field = trimmed.replace("ORDERBYDESC", "").trim();
      orderBy = { field, direction: "desc" };
      continue;
    }

    if (trimmed.startsWith("ORDERBY")) {
      const field = trimmed.replace("ORDERBY", "").trim();
      orderBy = { field, direction: "asc" };
      continue;
    }

    // Parse operators
    if (trimmed.includes("!=")) {
      const [field, val] = trimmed.split("!=");
      conditions.push({ field: field.trim(), operator: "!=", value: val?.trim() ?? "" });
    } else if (trimmed.includes(">=")) {
      const [field, val] = trimmed.split(">=");
      conditions.push({ field: field.trim(), operator: ">=", value: val?.trim() ?? "" });
    } else if (trimmed.includes("<=")) {
      const [field, val] = trimmed.split("<=");
      conditions.push({ field: field.trim(), operator: "<=", value: val?.trim() ?? "" });
    } else if (trimmed.includes(">")) {
      const [field, val] = trimmed.split(">");
      conditions.push({ field: field.trim(), operator: ">", value: val?.trim() ?? "" });
    } else if (trimmed.includes("<")) {
      const [field, val] = trimmed.split("<");
      conditions.push({ field: field.trim(), operator: "<", value: val?.trim() ?? "" });
    } else if (trimmed.includes("LIKE")) {
      const [field, val] = trimmed.split("LIKE");
      conditions.push({ field: field.trim(), operator: "LIKE", value: val?.trim() ?? "" });
    } else if (trimmed.includes("STARTSWITH")) {
      const [field, val] = trimmed.split("STARTSWITH");
      conditions.push({ field: field.trim(), operator: "STARTSWITH", value: val?.trim() ?? "" });
    } else if (trimmed.includes("=")) {
      const [field, val] = trimmed.split("=");
      conditions.push({ field: field.trim(), operator: "=", value: val?.trim() ?? "" });
    }
  }

  return { conditions, orderBy };
}

/**
 * Maps standard system column names to Prisma model properties.
 */
export function mapSysField(fieldName: string): string {
  const mapping: Record<string, string> = {
    sys_id: "id",
    sys_created_on: "createdAt",
    sys_updated_on: "updatedAt",
    sys_class_name: "sysClassName",
    short_description: "shortDescription",
    assigned_to: "assignedToId",
    assignment_group: "assignmentGroupId",
    opened_by: "openedById",
    opened_at: "openedAt",
    closed_at: "closedAt",
    close_code: "closeCode",
    close_notes: "closeNotes",
    due_date: "dueDate",
  };
  return mapping[fieldName] || fieldName;
}
