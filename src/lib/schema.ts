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
 * cmn_location: Spatial & Physical Location Entity
 * Display Field: name
 */
export interface CmnLocation {
  id: string;
  name: string; // Location name (e.g. "Silicon Valley Campus / Bldg A / Floor 3 / OR-302")
  location_type?: "region" | "state" | "campus" | "building" | "floor" | "space" | string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  full_path?: string | null;
  parent_id?: ReferenceField<CmnLocation>; // Self-referencing FK for location tree
  region_id?: ReferenceField<CmnRegion>;
  state_ref_id?: ReferenceField<CmnState>;
  campus_id?: ReferenceField<CmnCampus>;
  building_id?: ReferenceField<CmnBuilding>;
  floor_id?: ReferenceField<CmnFloor>;
  space_id?: ReferenceField<CmnSpace>;
  created_at: string;
}

// ----------------------------------------------------
// 6-Tier Spatial Hierarchy Interfaces (Connected Workplace)
// Region -> State -> Campus -> Building -> Floor -> Space/Room
// ----------------------------------------------------

/**
 * cmn_region: Tier 1 Spatial Region
 * Display Field: name
 */
export interface CmnRegion {
  id: string;
  name: string; // e.g. "Americas", "EMEA", "APAC", "US West"
  code: string; // e.g. "REG-AMER"
  description?: string | null;
  active: boolean;
  created_at: string;
}

/**
 * cmn_state: Tier 2 State / Province
 * Display Field: name
 */
export interface CmnState {
  id: string;
  name: string; // e.g. "California", "Texas"
  code: string; // e.g. "CA", "TX"
  country?: string | null;
  region_id?: ReferenceField<CmnRegion>;
  created_at: string;
}

/**
 * cmn_campus: Tier 3 Campus
 * Display Field: name
 */
export interface CmnCampus {
  id: string;
  name: string; // e.g. "Silicon Valley Health Sciences Campus"
  code: string; // e.g. "CAMPUS-SV"
  state_id?: ReferenceField<CmnState>;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

/**
 * cmn_building: Tier 4 Building
 * Display Field: name
 */
export interface CmnBuilding {
  id: string;
  name: string; // e.g. "Building A - Acute Care Hospital"
  code: string; // e.g. "BLDG-A"
  campus_id?: ReferenceField<CmnCampus>;
  building_type?: string | null; // "hospital", "clinic", "lab", "office", "datacenter"
  floors_count?: number | null;
  total_area_sq_ft?: number | null;
  created_at: string;
}

/**
 * cmn_floor: Tier 5 Floor
 * Display Field: name
 */
export interface CmnFloor {
  id: string;
  name: string; // e.g. "Floor 03 - Surgical & ICU Wing"
  floor_number: number; // e.g. 3
  code: string; // e.g. "FL-03"
  building_id?: ReferenceField<CmnBuilding>;
  floorplan_svg_url?: string | null;
  floorplan_image_url?: string | null;
  area_sq_ft?: number | null;
  created_at: string;
}

/**
 * cmn_space: Tier 6 Space / Room
 * Display Field: name
 */
export interface CmnSpace {
  id: string;
  name: string; // e.g. "Operating Room 2", "Pathology Lab 104"
  space_number: string; // e.g. "OR-302", "LAB-104"
  floor_id?: ReferenceField<CmnFloor>;
  space_type: string; // "operating_room", "icu", "patient_room", "lab", "office", "conference", "server_room", "storage"
  status: "available" | "occupied" | "maintenance" | "reserved" | "decontamination" | string;
  capacity?: number | null;
  square_feet?: number | null;
  department?: string | null;
  capabilities?: string[] | string | null; // e.g. ["teams", "zoom", "standing_desk", "whiteboard", "projector"]
  image_url?: string | null;
  floorplan_x?: number | null;
  floorplan_y?: number | null;
  floorplan_width?: number | null;
  floorplan_height?: number | null;
  svg_element_id?: string | null;
  created_at: string;
}

/**
 * cmn_reservation: Room & Desk Booking
 * Display Field: number
 */
export interface CmnReservation {
  id: string;
  number: string; // e.g. "RES0001001"
  space_id: ReferenceField<CmnSpace>;
  reserved_by_id: ReferenceField<SysUser>;
  subject: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "checked_in" | "cancelled" | "completed";
  attendees_count: number;
  capabilities_needed?: string[] | string | null;
  notes?: string | null;
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
  space_id?: ReferenceField<CmnSpace>;
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
      space_id: "cmn_space",
    },
  },
  cmn_region: {
    name: "cmn_region",
    label: "Region",
    displayField: "name",
    referenceFields: {},
  },
  cmn_state: {
    name: "cmn_state",
    label: "State / Province",
    displayField: "name",
    referenceFields: {
      region_id: "cmn_region",
    },
  },
  cmn_campus: {
    name: "cmn_campus",
    label: "Campus",
    displayField: "name",
    referenceFields: {
      state_id: "cmn_state",
    },
  },
  cmn_building: {
    name: "cmn_building",
    label: "Building",
    displayField: "name",
    referenceFields: {
      campus_id: "cmn_campus",
    },
  },
  cmn_floor: {
    name: "cmn_floor",
    label: "Floor",
    displayField: "name",
    referenceFields: {
      building_id: "cmn_building",
    },
  },
  cmn_space: {
    name: "cmn_space",
    label: "Space / Room",
    displayField: "name",
    referenceFields: {
      floor_id: "cmn_floor",
    },
  },
  cmn_reservation: {
    name: "cmn_reservation",
    label: "Space Reservation",
    displayField: "number",
    numberPrefix: "RES",
    referenceFields: {
      space_id: "cmn_space",
      reserved_by_id: "sys_user",
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
  sc_task: {
    name: "sc_task",
    label: "Catalog Task",
    superClass: "task",
    displayField: "number",
    numberPrefix: "TASK",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
    },
  },
  change_request: {
    name: "change_request",
    label: "Change Request",
    superClass: "task",
    displayField: "number",
    numberPrefix: "CHG",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
    },
  },
  problem: {
    name: "problem",
    label: "Problem",
    superClass: "task",
    displayField: "number",
    numberPrefix: "PRB",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
    },
  },
  sc_request: {
    name: "sc_request",
    label: "Request",
    superClass: "task",
    displayField: "number",
    numberPrefix: "REQ",
    referenceFields: {
      opened_by: "sys_user",
    },
  },
  sc_req_item: {
    name: "sc_req_item",
    label: "Requested Item",
    superClass: "task",
    displayField: "number",
    numberPrefix: "RITM",
    referenceFields: {
      opened_by: "sys_user",
    },
  },
  change_task: {
    name: "change_task",
    label: "Change Task",
    superClass: "task",
    displayField: "number",
    numberPrefix: "CTASK",
    referenceFields: {
      opened_by: "sys_user",
      assigned_to: "sys_user",
      assignment_group: "sys_user_group",
      cmdb_ci_id: "cmdb_ci",
    },
  },
};
