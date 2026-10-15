# Product Requirements Document (PRD)

**Project**: ServiceMeow — Enterprise Service Management (ESM) & Autonomous ITIL Operations Platform  
**Version**: 3.0.0 (Swiss Grid Design & Radical User Accessibility)  
**Status**: In Review (Architectural Spec Ready)  
**Created**: 2026-10-14  
**Last Updated**: 2026-10-15  

---

## 1. Executive Summary
ServiceMeow is an open-source, high-performance Enterprise Service Management (ESM) and ITIL operations platform engineered with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, and QuickJS WebAssembly sandboxing. It replaces legacy, high-latency enterprise service suites with a sub-second, dockable multi-record workspace, a 6-tier Connected Workplace spatial CAD floorplan booking engine, low-code studio development with Update Set ALM, and an autonomous Hermes triage agent.

---

## 2. Problem Statement
**Problem**: Traditional enterprise IT operations and service desks (e.g., legacy ServiceNow instances) suffer from prohibitive licensing costs, sluggish multi-tab navigation, brittle JavaScript execution models with process escape vulnerabilities, and fractured workplace facility reservation tools.  
**Target Users**:
1. **ITIL Fulfillers & Engineers**: Incident responders, change managers, and service desk analysts needing high-throughput multi-record triage without page reloading.
2. **Platform Administrators & Low-Code Developers**: System architects building custom schemas, business rules, client scripts, and deploying configuration updates across environments.
3. **Enterprise Employees & Requesters**: Knowledge workers submitting service requests, reserving hybrid desks/rooms, and verifying platform availability.
4. **Facility & Workplace Directors**: Operations managers monitoring real-time occupancy, interactive floorplans, and room amenities.

**Current Pain Points**:
- Multi-second navigation latencies when juggling multiple incidents and change tickets.
- Security vulnerabilities in server-side script runners prone to prototype pollution and sandbox escaping.
- Lack of unified spatial hierarchy linking physical hardware (CMDB) to precise campus/building/floor/room coordinates.
- Absence of transparent 90-day component uptime reporting tied directly to underlying incident records.

---

## 3. Goals & Success Metrics
| Goal | Metric | Target |
|---|---|---|
| Zero-Lag Multitasking | Workspace Tab Switching Latency | < 16ms (60 FPS fluid rendering) |
| High-Throughput REST APIs | Table API (`/api/now/table/[table]`) p95 | < 80ms under 500 req/sec |
| Secure Script Sandboxing | Execution memory ceiling & runtime isolation | 32MB WASM heap, 1000ms hard timeout |
| Spatial Hierarchy Integrity | Breadcrumb path resolution across 6 tiers | 100% relational referential integrity |
| Test Coverage | Vitest regression test suite | 100% passing (89 tests across 10 files) |
| Production Build Reliability | Next.js compilation & TypeScript type-check | 0 errors, 0 unresolved imports |

---

## 4. User Personas & Role-Based Access Control (RBAC)

### Persona 1: Sarah Jenkins — Lead Fulfiller / Incident Commander
- **Role**: `itil`
- **Surface**: `/workspace`
- **Goals**: Rapidly triage P1/P2 incidents, coordinate change management approvals, inspect CMDB dependency topology, and invoke Purr-Assist AI for ticket handoffs.
- **Key Behaviors**: Keeps 5-10 tabs open concurrently in the Dockable Tab Bar; inspects live SLA timers.

### Persona 2: Alex Chen — Platform Administrator & Studio Architect
- **Role**: `admin`
- **Surface**: `/studio`
- **Goals**: Define data dictionaries (`sys_db_object`, `sys_dictionary`), create business rules (`sys_script`), configure Flow Engine automations, and manage Update Set releases.
- **Key Behaviors**: Uses Monaco editor for sandboxed scripts; inspects collision detection prior to Update Set commit.

### Persona 3: Taylor Reed — Corporate Employee / Requester
- **Role**: `employee`
- **Surface**: `/portal`
- **Goals**: Browse the Service Catalog, order equipment via shopping cart checkout, submit record producers, reserve desks/rooms via CAD floorplans, and check system status.
- **Key Behaviors**: Accesses `/portal/reservations` for interactive floorplan seat picking; tracks active tickets on `/portal/my-tickets`.

### Persona 4: Marcus Vance — CAB Approver / Governance Lead
- **Role**: `cab_approver`
- **Surface**: `/workspace/approvals` & `/workspace/change_request`
- **Goals**: Review change request risk matrices, conflict collision reports, and approve or reject emergency change schedules.

### Persona 5: Morgan "Blueprint" Reed — Workplace Administrator
- **Role**: `workplace_admin`
- **Surface**: `/studio?tab=workplace` & `/workspace/reservations`
- **Goals**: Manage campus/building/floor/space location hierarchies, upload architectural CAD drawings (SVG/PNG), draw visual room hotspots, and configure facility amenities without full platform `admin` privileges.

### Persona 6: Chloe "Spec" Montgomery — Service Catalog Administrator
- **Role**: `catalog_admin`
- **Surface**: `/studio?tab=catalog` & `/portal/catalog`
- **Goals**: Maintain service catalog categories, items, and record producer forms without access to security ACLs or server scripts.

---

## 5. Feature Requirements

### MVP Features (Must Have — v1.0.0 Production Verified)

#### 1. Fulfiller Workspace (`/workspace`)
- [x] **Dockable Multi-Record Tab Bar**: Browser-like tab bar allowing concurrent work across Incidents, Change Requests, Problems, and CMDB CIs without loss of form state.
- [x] **Polymorphic ITIL Task Engine**: Unified `Task` base entity extended by `Incident`, `Problem`, `ChangeRequest`, and `CatalogTask`.
- [x] **Purr-Assist AI Triage Engine (`/api/now/ai/assist`)**: Generative summarization of incident work notes and 1-click proposed resolutions.
- [x] **CMDB Dependency Topology & Rack Visualizer (`/workspace/cmdb/racks`)**: Interactive node-link graph visualizing upstream/downstream impacts and 42U data center rack elevation maps.
- [x] **Visual Kanban Task Board (`/workspace/task-board`)**: Drag-and-drop state transitions with automatic SLA state preservation.
- [x] **Live SLA Milestone Timers**: Active countdown meters tracking response and resolution windows with warning triggers at 50% and 75% thresholds.

#### 2. Studio Low-Code Workbench (`/studio`)
- [x] **2-Pane IDE Workbench**: Collapsible Studio Explorer categorizing 20 modules into 5 enterprise domains.
- [x] **Data Dictionary Builder**: Dynamic schema management via `sys_db_object`, `sys_dictionary`, and `sys_choice` supporting custom user tables (`u_*`).
- [x] **Monaco Code Editor with QuickJS Sandbox**: Syntax-highlighted editor executing Script Includes and Business Rules in an isolated WebAssembly memory sandbox.
- [x] **Update Set ALM Engine (`/api/now/update-sets`)**: Change tracking across schemas, scripts, and forms; XML/JSON package export, collision preview, and atomic commits.
- [x] **Import Set ETL Engine**: Staging table intake (`sys_import_set`), data mapping, and transform scripts executing with validation guards.

#### 3. Employee Self-Service Portal (`/portal`)
- [x] **Intake Catalog & Shopping Cart**: Category-filtered service catalog with customizable options and multi-item checkout requests (`sc_request`, `sc_req_item`).
- [x] **Record Producers**: Lightweight end-user intake converting catalog submissions into back-end incident and task records.
- [x] **Public 90-Day System Uptime Status (`/portal/status`)**: Component uptime calendar with incident association and historical availability percentage.
- [x] **My Tickets Tracker (`/portal/my-tickets`)**: End-user ticket lifecycle tracker with threaded activity streams.

#### 4. Connected Workplace Hub & 6-Tier Spatial Hierarchy (`/portal/reservations`, `/workspace/spaces`, `/studio?tab=workplace`)
- [x] **6-Tier Relational Spatial Tree**: Strict hierarchy: `Region` ⟶ `State` ⟶ `Campus` ⟶ `Building` ⟶ `Floor` ⟶ `Space/Room`.
- [x] **Interactive CAD Floorplan View**: SVG hotspot coordinate mapping (`floorplanX`, `floorplanY`, `floorplanWidth`, `floorplanHeight`) with live occupancy status.
- [x] **CAD Drawing Upload & Visual Hotspot Mapper (`/api/now/spatial/floorplan-upload`, `CadFloorplanEditor.tsx`)**: Admins upload/replace CAD drawings (vector SVG or image formats) and interactively click-and-drag bounding boxes to match physical rooms to locations with 0.5% fine-tuning controls and simulated occupancy preview.
- [x] **3-View Reservation Engine**: Catalog view with capability filters (Teams, Zoom, standing desks), Daily Calendar timeline, and Architectural CAD map.
- [x] **Unified Location Model (`cmn_location`)**: Full backward-compatible ancestor breadcrumb pathing (`Americas / California / Silicon Valley / Bldg A / Floor 3 / OR-302`).

#### 5. Delegated Modular Administration & Edge Route Guard
- [x] **Modular Domain Administration**: Distinct module administrator roles (`workplace_admin`, `catalog_admin`, `itil_admin`, `cmdb_admin`, `knowledge_admin`) allowing enterprise self-management without granting root `admin`.
- [x] **Studio Module Explorer Dynamic Filtering**: Delegated admins in Studio (`/studio`) only see and manage tools for their assigned domains with role-badged breadcrumbs.
- [x] **Edge Route Guard (`middleware.ts`)**: Pure Web Crypto HMAC-SHA256 session verification with live database role evaluation, modular admin workspace gates, and identity header spoofing prevention.
- [x] **Default-Deny System Tables**: Hard blocked write access to `sys_*` tables for non-admin personas.
- [x] **Global Credential Omission**: Prisma query-level omission of `passwordHash` preventing credential leaks across all API routes.
- [x] **Rate Limiting & Lockout Guard**: Sliding window limiter (100 req/min general; 5 failed logins = 15m lockout).

#### 6. Autonomous Worker Daemon (`src/worker.ts`)
- [x] **15-Second Scheduler Polling**: Standalone worker daemon processing due `sys_scheduled_jobs`.
- [x] **Autonomous Hermes Workflow Agent**: Scheduled SLA escalation, automated assignment routing, and state maintenance.

#### 7. Market-Parity Enterprise Usability Enhancements
- [x] **Universal Command Palette (`Cmd+K` / `Ctrl+K`)**: Global spotlight search across Tasks, Catalog, Knowledge Base, CMDB CIs, and Spaces with keyboard selection (`↑↓↵`).
- [x] **One-Click Quick Filter Presets**: Instant triage pills (`All`, `Assigned to Me`, `Unassigned`, `Critical P1/P2`, `In Progress`, `Resolved / Closed`) in data grids.
- [x] **Data Grid Export Engine**: Client-side RFC 4180 CSV export, structured JSON export, and 1-click clipboard copy in `RecordList.tsx`.
- [x] **Canned Response Macros**: Work note diagnostic templates and customer-facing update macros in `ActivityStream.tsx`.
#### 8. Enterprise Space Console & Complex Architectural CAD Engine (v2.0.0 Production Verified)
- [x] **High-Fidelity Architectural Vector Blueprints (`hq_floor_18_complex.svg`)**:
  - Stepped exterior perimeter facade with structural corner pilasters, window mullions, and double-line wall thickness.
  - 28 structural concrete interior column piers on an authentic architectural grid.
  - Dual vertical circulation cores (North and South) with multi-flight hatched stair treads, handrails, and directional arrows.
  - Central elevator bank (8 passenger hoistway shafts with diagonal structural cross-braces).
  - Restroom blocks (Men's & Women's) with individual ADA stalls, plumbing fixtures (toilets, urinals, lavatory counters).
  - 25+ distinct architectural rooms: Executive Suites (`112`, `136`, `137`), Electronic Systems Engineering (`101`, `102`, `103`, `110`, `113`, `114`, `115`, `120`, `135`), Meeting Rooms (`104`, `105`), Testing Labs (`111`), Open Workstation Bays (`160`), Mechanical Closets (`SERV`), and Vertical Shafts (`VERT`).
  - Standard 90-degree door swing arcs into every room.
- [x] **ServiceMeow Space Console 3-Zone Enterprise Layout**:
  - **Zone 1: Top Control Strip**:
    - Mode Switcher: `Space & Allocation` vs `Live Occupancy & Reservations`.
    - Layer Highlights Selector: `None`, `Room Category` (color-coded), `Department`, `Division`, `Availability Status`, `Capacity`.
    - Layer Borders Selector: `None`, `Room Category`, `Division`, `Department`.
    - Layer Labels Selector: `Divisions & Depts`, `Room Names & Numbers`, `Capacity (Pax)`, `Square Footage (sq ft)`.
    - CAD Layer Visibility Toggles: Walls, Columns, Door Swings, Workstations, Restrooms/Stairs, Labels, Grid.
    - Floor & Building Dimensions Editor modal integration with real-time square foot to square meter conversion and efficiency calculation.
  - **Zone 2: Left Master Explorer Panel**:
    - Location Filter: Search by Building, Floor, Room, Division, Department, Vacant Only.
    - Multi-Level Floor Sheet Grid: Lists Buildings, Floors, CAD Drawings, Room Area ($ft^2$), Total Capacity, Occupancy %.
    - Sub-Tabs Dock: `Organizations` (Division & Dept breakdown with area and headcount), `Room Categories` (Color legend table: `MEETING` #f97316, `OFFICE` #10b981, `OPENPLAN` #eab308, `PRIMCIRC` #84cc16, `SECONDCIRC` #94a3b8, `SERV` #047857, `SUPPORT` #78350f, `VERT` #dc2626, `WKSTN` #2563eb, with "Assign" batch allocate button), and `Rooms` (Inventory table with 1-click CAD zoom).
  - **Zone 3: Central CAD Blueprint Stage**:
    - Interactive SVG rendering with dynamic room polygon fills matching active Highlight selection.
    - Smooth pan & zoom (40% to 300% with Reset and Fit-to-Screen).
    - Hover card and detail drawer for instant room bookings and amenity inspection.
    - Full retention of direct drag-to-move and 8-point handle reshaping engine.
- [x] **Universal Top Navigation & Swiss Grid Visual Refresh**:
  - Direct `Space Console` navigation link and quick access launcher across Studio, Workspace, and Portal.
  - High-contrast Swiss Grid design system: hairline 1px borders, grotesque typography, square corners, bold mono accents, clean geometric information hierarchy.

---

## 6. Technical Architecture & Stack Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15.2+ (App Router) | React Server Components (RSC), route handlers, and streaming edge middleware. |
| **UI Library** | React 19 + Tailwind CSS | Zero-runtime CSS bundling, fluid animations, dockable split panes. |
| **Icons & Typography** | Lucide React | Modern, accessible SVG icon primitives. |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM 6.4+ | Enterprise relational ACID compliance, foreign keys, cascade safety, and query omission. |
| **Local Dev Engine** | SQLite (Dual-Schema Generator) | Instant zero-dependency local developer bootstrap and rapid CI execution. |
| **Script Sandboxing** | QuickJS WebAssembly (`quickjs-emscripten`) | 100% guest memory isolation; prevents prototype pollution and host process escaping. |
| **Testing** | Vitest 5.0+ | Fast in-memory TypeScript test runner with full mock and isolation support. |
| **Containerization** | Docker Multi-Stage + Docker Compose | Minimal Alpine 20 production runner with health checks and non-root security. |

---

## 7. Concrete API Contracts (REST & Table API)

### 7.1 Authentication & Session
- `POST /api/auth/login`: Authenticates username/password, generates HMAC-SHA256 session token cookie.
- `POST /api/auth/logout`: Invalidates session record in `sys_user_session` and clears cookie.
- `GET /api/auth/me`: Returns active session identity, effective roles, and avatar metadata.
- `POST /api/auth/impersonate`: Admin-only session swapping for security testing.

### 7.2 Generic Table API (`/api/now/table/[table]`)
- `GET /api/now/table/[table]?sysparm_query=state=1^priority=1&sysparm_limit=20&sysparm_offset=0`: Query records with encoded query string parsing.
- `POST /api/now/table/[table]`: Create record; fires Business Rules (`before insert`, `after insert`) and generates audit log.
- `GET /api/now/table/[table]/[id]`: Retrieve single record with dot-walk reference expansion.
- `PATCH /api/now/table/[table]/[id]`: Update record; executes UI Policies and Business Rules (`before update`, `after update`).
- `DELETE /api/now/table/[table]/[id]`: Delete record with cascade checks.

### 7.3 Connected Workplace & Reservations
- `GET /api/now/spatial/tree`: Returns recursive 6-tier tree structure with live occupancy metrics.
- `POST /api/now/spatial/floorplan-upload`: Uploads vector SVG or image CAD floorplans or saves external blueprint URLs; updates `cmn_floor` with asset paths.
- `GET /api/now/reservations?date=2026-10-15&floorId=[id]`: Fetch space bookings for conflict validation.
- `POST /api/now/reservations`: Create room/desk reservation with double-booking prevention.

### 7.4 Sandboxed Scripts & Automation
- `POST /api/now/script-includes/execute`: Executes registered `sys_script_include` in isolated QuickJS WASM sandbox.
- `POST /api/now/flows/[id]/test`: Dry-runs workflow flow trigger and step actions in test harness.

### 7.6 Space Console & Spatial Category APIs
- `GET /api/now/spatial/categories`: Returns room category catalog (`MEETING`, `OFFICE`, `OPENPLAN`, `PRIMCIRC`, `SECONDCIRC`, `SERV`, `SUPPORT`, `VERT`, `WKSTN`) with hex legend colors, descriptions, room counts, and total square footage.
- `PATCH /api/now/spatial/batch-allocate`: Batch assigns department, division, or room category to an array of space IDs (`{ spaceIds: string[], category?: string, department?: string }`).
- `GET /api/now/spatial/drawings`: Returns catalog of registered architectural CAD drawings (`hq18`, `tt_l4`, `offcen01`, etc.) with layer definitions, bounding boxes, and floor associations.

### 5.9 Swiss Grid Design System & Radical First-Time User Accessibility (v3.0.0)
- **Design Philosophy**: Adheres to the International Typographic Style (Swiss Grid). Structured on a mathematical modular grid, objective grotesque typography (Inter / Helvetica), stark high-contrast visual hierarchy (monochrome with International Swiss Red `#EB0029` and Klein Blue `#0047FF`), and zero visual clutter (banning nested gradients, muddy shadows, and decorative micro-pills).
- **First-Time User Accessibility**: Engineered so a user who has never operated an enterprise portal can complete tasks without instructions:
  - **4-Quadrant High-Contrast Primary Matrix**:
    - `01 / REPORT A PROBLEM`: Direct incident reporting with plain prompts ("Computer, software, or office broken? Tell us what's wrong").
    - `02 / REQUEST HARDWARE & SERVICES`: Service catalog intake with clear illustrated cards and 1-click checkout.
    - `03 / BOOK A MEETING ROOM OR DESK`: Architectural CAD floorplans with unmistakable green (available) and red (occupied) badges.
    - `04 / CHECK MY REQUESTS`: Large status cards showing real-time ticket progress and technician assignments.
  - **Tactile Target Sizing**: Minimum 64px tap/click height on primary cards and 48px on secondary actions.
  - **Plain Language Protocol**: Complete elimination of administrative jargon (`sys_id`, `CI class`, `sc_req_item`, `ACL`, `Update Set`) on all employee-facing surfaces.
  - **Persistent Escape Route**: Clear "← Back" or "Start Over" breadcrumbs on all modal workflows to guarantee users never feel trapped.

---

## 8. Non-Functional Requirements (NFRs)

### Performance & Latency Budgets
- **LCP (Largest Contentful Paint)**: < 1.8 seconds on 4G network.
- **INP (Interaction to Next Paint)**: < 100 milliseconds for dockable tab switching.
- **API Response Time (p95)**: < 80ms for Table API queries with up to 3 dot-walked relations.
- **Script Sandbox Overhead**: < 15ms cold start initialization; < 1000ms max execution budget.
- **Command Palette Search Latency**: < 50ms for multi-domain indexed query responses.

### Security & Compliance
- **Zero Raw Sessions**: Sliding cryptographically signed tokens only.
- **Password Storage**: bcrypt with work factor 12.
- **Strict Role Boundary**: System administrative tables (`sys_*`) return 403 Forbidden to non-admin tokens.
- **WASM Memory Ceiling**: Strict 32MB WebAssembly heap allocation limit per script invocation.

### Reliability & High Availability
- **Container Health Checks**: Wget spidering `/api/health` every 30s.
- **Worker Daemon Fault Tolerance**: Automatic unhandled exception catch-and-resume; error logging to `sys_audit`.

---

## 9. Out of Scope (Phase 1)
- Multi-region geo-distributed PostgreSQL replication (single-cluster PostgreSQL 16 supported).
- Native mobile client applications (iOS/Android) — responsive mobile PWA provided via web portal.
- Third-party SAML/SCIM SSO integration (local bcrypt + HMAC session tokens supported in v1.0.0; OAuth/SAML slated for v1.2).

---

## 10. Verification Sign-Off
| Verification Gate | Result | Date |
|---|---|---|
| Vitest Test Suite | 126 passed / 15 test files | 2026-10-15 |
| Next.js App Router Build | 0 errors / 85 routes compiled | 2026-10-15 |
| Swiss Grid Design System | 100% compliant across Portal, Catalog, Tickets, Login & Workspace | 2026-10-15 |
| Modular Admin Domain RBAC | 12/12 role tests passed | 2026-10-15 |
| CAD Floorplan & Hotspot Mapper | 4/4 CAD tests passed | 2026-10-15 |
| Edge Route Guard & Middleware | 18/18 guard tests passed | 2026-10-15 |
| QuickJS WASM Sandbox Defense | 15/15 security tests passed | 2026-10-15 |
| Spatial Hierarchy Referential Integrity | 7/7 hierarchy tests passed | 2026-10-15 |
| Universal Command Palette & Search | 6/6 search tests passed | 2026-10-15 |
