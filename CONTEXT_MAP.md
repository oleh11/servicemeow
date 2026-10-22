# Subagent Context Map & Contract Slices (CONTEXT_MAP)

**Project**: ServiceMeow  
**Target Audience**: Autonomous Subagents (`fullstack-craftsman`, `quality-guardian`, `ci-cd-devops-architect`)  
**Purpose**: High-density contract index to enable rapid code generation and verification without full repository re-scanning.

---

## 1. Core Domain Types & Interfaces

```typescript
// Modular Delegated Admin Roles
export type ModularAdminRole = 
  | "workplace_admin" 
  | "catalog_admin" 
  | "itil_admin" 
  | "cmdb_admin" 
  | "knowledge_admin";

// Identity & Session Context
export interface UserSession {
  userId: string;
  userName: string;
  email: string;
  role: "admin" | "itil" | "employee" | "cab_approver" | ModularAdminRole;
  roles: string[];           // Effective secondary roles
  impersonatorId?: string;
  expiresAt: string;
}

export interface EffectiveRoleCheck {
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isModularAdmin: boolean;
  isWorkplaceAdmin: boolean;
  isCatalogAdmin: boolean;
  isFulfiller: boolean;      // itil, modular_admin, or admin
  isEmployee: boolean;
}

// ITIL Polymorphic Record Context
export interface TaskRecord {
  id: string;
  number: string;            // e.g. "INC0010042", "CHG0005011"
  sysClassName: string;      // "incident", "change_request", "problem", "sc_task"
  shortDescription: string;
  description?: string;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = Critical, 5 = Planning
  state: number;             // 1 = New, 2 = In Progress, 3 = On Hold, 6 = Resolved, 7 = Closed
  openedById?: string;
  assignedToId?: string;
  assignmentGroupId?: string;
  cmdbCiId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentRecord extends TaskRecord {
  callerId?: string;
  category?: string;
  subcategory?: string;
  urgency: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  closeCode?: string;
  closeNotes?: string;
  resolvedAt?: string;
  resolvedById?: string;
}

// Connected Workplace Spatial Context
export type SpatialTier = "region" | "state" | "campus" | "building" | "floor" | "space";

export interface SpatialHierarchyNode {
  id: string;
  name: string;
  code: string;
  type: SpatialTier;
  children?: SpatialHierarchyNode[];
  occupancy?: {
    totalSpaces: number;
    availableSpaces: number;
    occupiedSpaces: number;
  };
}

export interface CmnSpaceRecord {
  id: string;
  name: string;
  spaceNumber: string;       // e.g. "OR-302", "CONF-410"
  floorId: string;
  spaceType: string;         // "operating_room", "conference", "hot_desk", "focus_pod"
  status: "available" | "occupied" | "reserved" | "maintenance";
  capacity: number;
  squareFeet?: number;
  capabilities: string[];    // ["teams", "zoom", "standing_desk", "whiteboard"]
  floorplanX?: number;       // 0-100 percentage
  floorplanY?: number;
  floorplanWidth?: number;
  floorplanHeight?: number;
  department?: string;
  division?: string;
  categoryCode?: string;     // e.g. "MEETING", "OFFICE", "WKSTN", "SERV"
  legendColor?: string;      // e.g. "#f97316"
}

// ServiceMeow Enterprise Space Console & CAD Layer Types
export type SpaceHighlightMode = "none" | "category" | "department" | "division" | "availability" | "capacity";
export type SpaceBorderMode = "none" | "category" | "division" | "department";
export type SpaceLabelMode = "none" | "names" | "capacity" | "area" | "division";

export interface SpaceCategoryRecord {
  id: string;
  code: string;              // "MEETING", "OFFICE", "OPENPLAN", "PRIMCIRC", "SECONDCIRC", "SERV", "SUPPORT", "VERT", "WKSTN"
  name: string;
  description: string;
  legendColor: string;       // Hex color code (e.g. #f97316)
  isCirculation: boolean;
  active: boolean;
  roomCount?: number;
  totalAreaSqFt?: number;
}

export interface DepartmentRecord {
  id: string;
  code: string;              // "ELEC_SYS", "EXEC", "ENG", "SALES"
  name: string;
  division: string;          // "Electronic Systems", "Executive", "Engineering"
  headcount: number;
  costCenter?: string;
  roomCount?: number;
  totalAreaSqFt?: number;
}

export interface CadDrawingSheet {
  id: string;
  code: string;              // "hq18", "tt_l4", "offcen01"
  title: string;
  buildingName: string;
  floorCode: string;
  floorNumber: number;
  fileUrl: string;
  totalAreaSqFt: number;
  capacity: number;
  layers: string[];          // ["walls", "columns", "doors", "workstations", "stairs_elevators", "plumbing"]
}

// Operational Assurance & Evidence Context (v3.2.0)
export interface TaskChecklistItemRecord {
  id: string;
  taskId: string;
  title: string;
  description?: string | null;
  isMandatory: boolean;
  isCompleted: boolean;
  completedById?: string | null;
  completedAt?: string | null;
  sortOrder: number;
}

export type EvidenceKind = 
  | "log.stacktrace" 
  | "ci.ping_failure" 
  | "git.commit_hash" 
  | "monitor.alert" 
  | "crm.thread_reply";

export interface TaskEvidenceRecord {
  id: string;
  taskId: string;
  claimField: string;
  claimValue: string;
  evidenceKind: EvidenceKind;
  isDecisive: boolean;
  rawObservation: string;
  sourceUrl?: string | null;
  status: "proposed" | "accepted" | "rejected";
  decidedById?: string | null;
  decidedAt?: string | null;
}

export interface CmnMorningCheckRecord {
  id: string;
  title: string;
  category: "datacenter" | "backup" | "network" | "database" | "security" | "application";
  targetSystem: string;
  shift: "morning" | "evening" | "night";
  status: "pass" | "degraded" | "fail" | "pending";
  notes?: string | null;
  checkedById?: string | null;
  checkedAt?: string | null;
  incidentId?: string | null;
}

export interface WatchtowerAttentionStreams {
  criticalIncidents: TaskRecord[];
  breachingSlas: any[];
  pendingApprovals: any[];
  activeProblems: any[];
  degradedCis: any[];
  failingMorningChecks: CmnMorningCheckRecord[];
}

export interface WatchtowerMetrics {
  healthScore: number;       // 0 - 100
  criticalIncidentsCount: number;
  breachingSlasCount: number;
  pendingApprovalsCount: number;
  activeProblemsCount: number;
  degradedCisCount: number;
  failingChecksCount: number;
}

// Swiss Grid Design System Tokens & Contracts
export interface SwissGridActionCard {
  number: "01" | "02" | "03" | "04";
  title: string;
  tagline: string;
  href: string;
  badge?: string;
  accentColor: "red" | "blue" | "emerald" | "amber";
  iconName: string;
}

// QuickJS Sandboxed Script Context
export interface ScriptSandboxExecution {
  script: string;
  context?: Record<string, unknown>;
  timeoutMs?: number;        // default 1000ms
  memoryLimitBytes?: number; // default 33554432 (32MB)
}

export interface ScriptSandboxResult {
  success: boolean;
  result?: unknown;
  logs: string[];
  error?: string;
  durationMs: number;
}

// CRM & Customer 360 Ecosystem Context
export interface CrmOrganizationRecord {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  tier: "strategic" | "enterprise" | "mid_market" | "smb";
  status: "active" | "prospect" | "churned";
  healthScore: number;       // 0 - 100
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  isPrimary: boolean;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmDealRecord {
  id: string;
  title: string;
  amount: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;       // 0 - 100
  expectedCloseDate?: string | null;
  organizationId?: string | null;
  contactId?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Smart Automation Engines Context
export interface AutoAssignResult {
  assigned: boolean;
  assignedToId?: string;
  assignedToName?: string;
  workload: number;
  reason: string;
}

export interface ChangeRiskFactor {
  factor: string;
  weight: number;
  detail: string;
}

export interface ChangeRiskEvaluation {
  riskScore: number;         // 0 - 100
  riskLevel: "low" | "moderate" | "high" | "very_high";
  cabRecommended: boolean;
  factors: ChangeRiskFactor[];
  conflictingChanges: Array<{
    id: string;
    number: string;
    plannedStart: string;
    plannedEnd: string;
    shortDescription: string;
  }>;
}

export interface SmartDraftResult {
  draft: string;
  tone: "empathetic" | "professional" | "technical" | "concise";
  evidenceUsed: number;
}
```

---

## 2. API Contract Cheat Sheet for Subagents

| Route Pattern | Method | Expected Query / Body | Expected Success Response | Guard / ACL Required |
|---|---|---|---|---|
| `/api/auth/login` | `POST` | `{ userName, password }` | `{ success: true, user: UserProfile }` | Public (Rate limited) |
| `/api/auth/me` | `GET` | None (reads Cookie) | `{ user: UserSession }` | Valid Session |
| `/api/now/table/:table` | `GET` | `sysparm_query`, `sysparm_limit`, `sysparm_offset` | `{ result: TableRecord[] }` | Read ACL on table |
| `/api/now/table/:table` | `POST` | `{ ...fieldValues }` | `{ result: TableRecord }` | Create ACL; Non-admin write blocked on `sys_*` |
| `/api/now/table/:table/:id` | `PATCH` | `{ ...updatedFields }` | `{ result: TableRecord }` | Write ACL |
| `/api/now/table/crm_organization` | `GET` / `POST` | Query / `{ name, tier, healthScore, industry }` | `{ result: CrmOrganizationRecord[] }` | `itil` or `admin` |
| `/api/now/table/crm_contact` | `GET` / `POST` | Query / `{ firstName, lastName, email, organizationId }` | `{ result: CrmContactRecord[] }` | `itil` or `admin` |
| `/api/now/table/crm_deal` | `GET` / `POST` | Query / `{ title, amount, stage, organizationId }` | `{ result: CrmDealRecord[] }` | `itil` or `admin` |
| `/api/now/ai/draft-response` | `POST` | `{ taskId, tone }` | `{ result: SmartDraftResult }` | `itil` or `admin` |
| `/api/now/change-risk` | `POST` | `{ changeType, cmdbCiId, plannedStart, plannedEnd }` | `{ result: ChangeRiskEvaluation }` | `itil` or `admin` |
| `/api/now/spatial/tree` | `GET` | None | `{ tree: SpatialHierarchyNode[] }` | Authenticated |
| `/api/now/spatial/floorplan-upload` | `POST` | FormData (`file`, `floorId`) or JSON (`floorId`, `imageUrl`) | `{ success: true, url: string, floor: CmnFloor }` | `workplace_admin` or `admin` |
| `/api/now/table/cmn_floor/:id` | `PATCH` | `{ area_sq_ft, name, code, floor_number }` | `{ result: CmnFloor }` | `workplace_admin` or `admin` |
| `/api/now/table/cmn_building/:id` | `PATCH` | `{ total_area_sq_ft, floors_count, name, code, building_type }` | `{ result: CmnBuilding }` | `workplace_admin` or `admin` |
| `/api/now/reservations` | `POST` | `{ spaceId, startTime, endTime, purpose }` | `{ result: CmnReservation }` | Conflict-Free Validation |
| `/api/now/watchtower` | `GET` | None | `{ metrics: WatchtowerMetrics, attentionStreams }` | `itil` or `admin` |
| `/api/now/morning-checks` | `GET` | `date`, `shift`, `category` | `{ checks: CmnMorningCheckRecord[] }` | `itil` or `admin` |
| `/api/now/morning-checks` | `POST` | `{ title, category, shift, checkDate, status, notes }` | `{ check: CmnMorningCheckRecord }` | `itil` or `admin` |
| `/api/now/morning-checks/:id` | `PATCH` | `{ status, notes, escalateToIncident, incidentPayload }` | `{ check: CmnMorningCheckRecord, incident?: any }` | `itil` or `admin` |
| `/api/now/ai/assist` | `POST` | `{ taskId, contextNotes }` | `{ summary: string, recommendations: string[] }` | `itil` or `admin` |
| `/api/now/script-includes/execute` | `POST` | `{ scriptIncludeId, params }` | `{ success: true, output: unknown }` | `admin` |
| `/api/health` | `GET` | None | `{ status: "ok", database: "connected" }` | Public |

---

## 3. Downstream Execution Invariants

1. **Password Safety**: Never modify `omit: { user: { passwordHash: true } }` in `src/lib/db.ts`. If an authentication endpoint requires the hash for comparison, it must explicitly specify `omit: { passwordHash: false }`.
2. **SOP Gatekeeper Enforcement**: State transition of any task to `6` (Resolved) or `7` (Closed) MUST verify that all `isMandatory: true` checklist items are complete. If incomplete, halt with `422 Unprocessable Entity` and return `{ error: "MANDATORY_CHECKLIST_INCOMPLETE", incomplete_items: string[] }`.
3. **System Table Isolation**: Under no circumstances allow client mutations directly against `sys_db_object`, `sys_dictionary`, `sys_security_acl`, or `sys_user` without validating `session.role === 'admin'`.
4. **Dual-Schema Sync**: Any modification to `prisma/schema.prisma` (PostgreSQL) MUST be mirrored into `prisma/schema.sqlite.prisma` (SQLite) to maintain 100% CI and local test parity.
5. **Sandboxed Code Execution**: Never invoke `eval()` or `vm.runInContext()` directly. Always execute untrusted or user-supplied code via `runInSecureSandbox()` in `src/lib/script-sandbox.ts`.
