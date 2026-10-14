import { db } from "@/lib/db";
import { parseEncodedQuery, mapSysField } from "@/lib/query-parser";

export interface BusinessRuleCondition {
  field: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "contains" | "LIKE" | "STARTSWITH";
  value: any;
}

export interface BusinessRuleActions {
  setFields?: Record<string, any>;
  addWorkNote?: string;
  autoAssignTo?: string;
  autoAssignGroup?: string;
}

/**
 * Extracts a field value from a record with support for camelCase, snake_case,
 * standard system column aliases, and polymorphic child extensions.
 */
export function getRecordFieldValue(record: Record<string, any>, field: string): any {
  if (!record || typeof record !== "object") return undefined;
  if (record[field] !== undefined) return record[field];

  const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (record[camelField] !== undefined) return record[camelField];

  const snakeField = field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  if (record[snakeField] !== undefined) return record[snakeField];

  const mapped = mapSysField(field);
  if (record[mapped] !== undefined) return record[mapped];

  if (field === "assigned_to" || field === "assigned_to_id") {
    return record.assignedToId ?? record.assigned_to_id ?? (typeof record.assignedTo === "object" ? record.assignedTo?.id : undefined);
  }
  if (field === "assignment_group" || field === "assignment_group_id") {
    return record.assignmentGroupId ?? record.assignment_group_id ?? (typeof record.assignmentGroup === "object" ? record.assignmentGroup?.id : undefined);
  }

  // Nested child extension objects
  if (record.incident && typeof record.incident === "object") {
    if (record.incident[field] !== undefined) return record.incident[field];
    if (record.incident[camelField] !== undefined) return record.incident[camelField];
  }
  if (record.changeRequest && typeof record.changeRequest === "object") {
    if (record.changeRequest[field] !== undefined) return record.changeRequest[field];
    if (record.changeRequest[camelField] !== undefined) return record.changeRequest[camelField];
  }
  if (record.problem && typeof record.problem === "object") {
    if (record.problem[field] !== undefined) return record.problem[field];
    if (record.problem[camelField] !== undefined) return record.problem[camelField];
  }

  return undefined;
}

/**
 * Checks if a condition matches record values.
 */
export function matchCondition(record: Record<string, any>, condition: BusinessRuleCondition): boolean {
  const currentVal = getRecordFieldValue(record, condition.field);
  const targetVal = condition.value;

  switch (condition.operator) {
    case "=":
      return String(currentVal ?? "").toLowerCase() === String(targetVal ?? "").toLowerCase();
    case "!=":
      return String(currentVal ?? "").toLowerCase() !== String(targetVal ?? "").toLowerCase();
    case ">":
      return Number(currentVal) > Number(targetVal);
    case "<":
      return Number(currentVal) < Number(targetVal);
    case ">=":
      return Number(currentVal) >= Number(targetVal);
    case "<=":
      return Number(currentVal) <= Number(targetVal);
    case "in": {
      const allowed = String(targetVal ?? "").split(",").map((s) => s.trim().toLowerCase());
      return allowed.includes(String(currentVal ?? "").toLowerCase());
    }
    case "contains":
    case "LIKE":
      return String(currentVal ?? "").toLowerCase().includes(String(targetVal ?? "").toLowerCase());
    case "STARTSWITH":
      return String(currentVal ?? "").toLowerCase().startsWith(String(targetVal ?? "").toLowerCase());
    default:
      return String(currentVal) === String(targetVal);
  }
}

/**
 * Evaluates whether all conditions of a business rule pass for the record.
 */
export function evaluateRuleFilter(record: Record<string, any>, filterConditionsJson?: string | null): boolean {
  if (!filterConditionsJson || !filterConditionsJson.trim()) return true;
  try {
    const conditions: BusinessRuleCondition[] = JSON.parse(filterConditionsJson);
    if (Array.isArray(conditions)) {
      if (conditions.length === 0) return true;
      return conditions.every((cond) => matchCondition(record, cond));
    }
  } catch {
    // If not JSON, parse as sysparm query syntax (e.g. "priority=1^state!=7")
  }

  const parsed = parseEncodedQuery(filterConditionsJson);
  if (parsed.conditions && parsed.conditions.length > 0) {
    return parsed.conditions.every((cond) =>
      matchCondition(record, {
        field: cond.field,
        operator: cond.operator,
        value: cond.value,
      })
    );
  }

  return true;
}

export interface BusinessRuleResult {
  mutatedFields: Record<string, any>;
  workNotes: string[];
  executedRules: { id: string; name: string }[];
}

/**
 * Executes business rules for a given table and event (e.g. before_insert, after_insert, before_update, after_update).
 * Polymorphic rules configured on the base 'task' table are inherited by child tables.
 */
export async function executeBusinessRules(
  tableName: string,
  when: "before_insert" | "after_insert" | "before_update" | "after_update",
  recordData: Record<string, any>
): Promise<BusinessRuleResult> {
  const result: BusinessRuleResult = {
    mutatedFields: {},
    workNotes: [],
    executedRules: [],
  };

  try {
    const targetTables = tableName === "task" ? ["task"] : [tableName, "task"];
    const rules = await db.sysScript.findMany({
      where: {
        tableName: { in: targetTables },
        when,
        active: true,
      },
      orderBy: { order: "asc" },
    });

    const mergedData = { ...recordData };

    for (const rule of rules) {
      if (evaluateRuleFilter(mergedData, rule.filterConditions)) {
        result.executedRules.push({ id: rule.id, name: rule.name });

        if (rule.actionsJson) {
          try {
            const actions: BusinessRuleActions = JSON.parse(rule.actionsJson);

            // Apply setFields
            if (actions.setFields && typeof actions.setFields === "object") {
              Object.assign(result.mutatedFields, actions.setFields);
              Object.assign(mergedData, actions.setFields);

              // Normalize common keys to both snake and camel
              for (const [k, v] of Object.entries(actions.setFields)) {
                if (k === "assignmentGroupId") result.mutatedFields.assignment_group_id = v;
                if (k === "assignment_group_id") result.mutatedFields.assignmentGroupId = v;
                if (k === "assignedToId") result.mutatedFields.assigned_to_id = v;
                if (k === "assigned_to_id") result.mutatedFields.assignedToId = v;
                if (k === "shortDescription") result.mutatedFields.short_description = v;
                if (k === "short_description") result.mutatedFields.shortDescription = v;
              }
            }

            // Auto-assign group or user
            if (actions.autoAssignGroup) {
              result.mutatedFields.assignmentGroupId = actions.autoAssignGroup;
              result.mutatedFields.assignment_group_id = actions.autoAssignGroup;
              mergedData.assignmentGroupId = actions.autoAssignGroup;
              mergedData.assignment_group_id = actions.autoAssignGroup;
            }
            if (actions.autoAssignTo) {
              result.mutatedFields.assignedToId = actions.autoAssignTo;
              result.mutatedFields.assigned_to_id = actions.autoAssignTo;
              mergedData.assignedToId = actions.autoAssignTo;
              mergedData.assigned_to_id = actions.autoAssignTo;
            }

            // Work Note
            if (actions.addWorkNote) {
              result.workNotes.push(actions.addWorkNote);
            }
          } catch (e) {
            console.error(`Error parsing actions for rule ${rule.name}:`, e);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error executing business rules:", err);
  }

  return result;
}
