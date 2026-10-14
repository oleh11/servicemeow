/**
 * Enterprise Relational Meta-Schema Definitions & TypeScript Types
 * Models foundation tables, polymorphic task hierarchies, and reference metadata.
 */

// ============================================================================
// Core Reference Types
// ============================================================================

export interface ReferenceValue<T = any> {
  value: string; // The foreign key UUID / cuid
  display_value: string; // The human-readable label (e.g. user's name, record number)
  link?: string; // Direct Table API link e.g. /api/now/table/sys_user/cuid
  details?: T; // Expanded underlying record attributes
}

export type ReferenceField<T = any> = string | ReferenceValue<T> | null;

// ============================================================================
// Foundation Entity Interfaces
// ============================================================================

/**
 * sys_user: Foundation User Table
 * Display Field: name
 */
export interface SysUser {
  id: string;
  user_name: string; // Unique username (e.g. "admin", "whiskers.mcpaws")
  name: string; // Full display name
  email: string;
  active: boolean;
  title?: string | null;
  department?: string | null;
  role: string; // "admin" | "itil" | "cab_approver" | "employee"
  roles?: string | null; // Comma-separated secondary roles
  avatar?: string | null;
  manager_id?: ReferenceField<SysUser>; // FK -> sys_user.id
  location_id?: ReferenceField<CmnLocation>; // FK -> cmn_location.id
  created_at: string;
  updated_at?: string;
}

/**
 * sys_user_group: Foundation Assignment Group
 * Display Field: name
 */
export interface SysUserGroup {
  id: string;
  name: string; // Unique group name
  description?: string | null;
  active: boolean;
  manager_id?: ReferenceField<SysUser>; // FK -> sys_user.id
  roles?: string | null; // Comma-separated inherited roles
  created_at: string;
}

/**
 * sys_user_grmember: Group Membership Join Table
 * Unique Constraint: (user_id, group_id)
 */
export interface SysUserGrmember {
  id: string;
  user_id: string; // FK -> sys_user.id
  group_id: string; // FK -> sys_user_group.id
  created_at: string;
  user?: SysUser;
  group?: SysUserGroup;
}

/**
 * cmn_location: Physical / Logical Location Hierarchy
 * Display Field: name
 */
export interface CmnLocation {
  id: string;
  name: string; // Location name (e.g. "San Jose HQ - Building B")
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  parent_id?: ReferenceField<CmnLocation>; // Self-referencing FK for location tree
  created_at: string;
}

/**
 * cmdb_ci: Base Configuration Item Table
 * Display Field: name
 */
export interface CmdbCi {
  id: string;
  name: string; // Display name e.g. "prod-api-cluster-01"
  sys_class: string; // Discriminator e.g. "cmdb_ci_server", "cmdb_ci_database"
  operational_status: "operational" | "non_operational" | "maintenance" | "retired";
  asset_tag?: string | null;
  ip_address?: string | null;
  host_name?: string | null;
  environment?: "production" | "staging" | "dev" | string;
  tier?: string | null;
  location_id?: ReferenceField<CmnLocation>;
  created_at: string;
}

// ============================================================================
// Polymorphic Task Hierarchy (Joined Table Inheritance)
// ============================================================================

/**
 * task: Polymorphic Base Task Entity
 * Display Field: number
 */
export interface Task {
  id: string;
  number: string; // Unique task number e.g. "INC0001001", "TASK0001001"
  sys_class: string; // Discriminator: "task", "incident", "change_request", "problem"
  short_description: string;
  description?: string | null;
  state: number; // 1: New, 2: In Progress, 3: On Hold, 6: Resolved, 7: Closed, 8: Canceled
  priority: number; // 1 (Critical) to 5 (Planning)
  impact: number; // 1 (High), 2 (Medium), 3 (Low)
  urgency: number; // 1 (High), 2 (Medium), 3 (Low)
  opened_by?: ReferenceField<SysUser>; // FK -> sys_user.id
  assigned_to?: ReferenceField<SysUser>; // FK -> sys_user.id (Dynamic Reference Qualifier via sys_user_grmember)
  assignment_group?: ReferenceField<SysUserGroup>; // FK -> sys_user_group.id
  cmdb_ci_id?: ReferenceField<CmdbCi>; // FK -> cmdb_ci.id
  opened_at: string;
  closed_at?: string | null;
  close_code?: string | null;
  close_notes?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * incident: Child Extension of Task (1:1 Joined Table Inheritance)
 * Display Field: number
 */
export interface Incident extends Task {
  task_id: string; // 1:1 foreign key to task.id
  caller_id?: ReferenceField<SysUser>; // FK -> sys_user.id
  category: "inquiry" | "software" | "hardware" | "network" | "database" | string;
  subcategory?: string | null;
  severity: number; // 1 (Critical) to 3 (Low)
  hold_reason?: "awaiting_caller" | "awaiting_vendor" | "awaiting_change" | null;
  problem_id?: ReferenceField<any>;
}

/**
 * sys_number: Atomic Number Generator Table
 */
export interface SysNumber {
  id: string;
  table_name: string; // e.g. "incident", "task"
  prefix: string; // e.g. "INC", "TASK"
  digits: number; // e.g. 7
  current_number: number; // e.g. 1004
}

// ============================================================================
// Table Meta-Registry & Display Field Map
// ============================================================================

export interface TableDescriptor {
  name: string;
  label: string;
  displayField: string;
  superClass?: string;
  numberPrefix?: string;
  referenceFields: Record<string, string>; // fieldName -> targetTableName
}

export const TABLE_METADATA: Record<string, TableDescriptor> = {
  sys_user: {
    name: "sys_user",
    label: "User",
    displayField: "name",
    referenceFields: {
      manager_id: "sys_user",
      location_id: "cmn_location",
    },
  },
  sys_user_group: {
    name: "sys_user_group",
    label: "Assignment Group",
    displayField: "name",
    referenceFields: {
      manager_id: "sys_user",
    },
  },
  cmn_location: {
    name: "cmn_location",
    label: "Location",
    displayField: "name",
    referenceFields: {
      parent_id: "cmn_location",
    },
  },
  cmdb_ci: {
    name: "cmdb_ci",
    label: "Configuration Item",
    displayField: "name",
    referenceFields: {
      location_id: "cmn_location",
    },
  },
  task: {
    name: "task",
    label: "Task",
    displayField: "number",
    numberPrefix: "TASK",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
    },
  },
  incident: {
    name: "incident",
    label: "Incident",
    superClass: "task",
    displayField: "number",
    numberPrefix: "INC",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
      caller_id: "sys_user",
    },
  },
};
