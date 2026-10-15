# ServiceMeow 🐾

<p align="center">
  <img src="docs/assets/hero-banner.jpg" alt="ServiceMeow Banner" width="100%" style="border-radius: 12px; border: 1px solid #1e293b;" />
</p>

<p align="center">
  <strong>The Open-Source Enterprise Service Operations (ITIL) Platform &amp; Hermes Autonomous Agent</strong><br>
  Next Experience Dockable Tabs • QuickJS WASM Script Isolation • PostgreSQL 16 • Autonomous Hermes Workflow Agent
</p>

<p align="center">
  <a href="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml"><img src="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml/badge.svg" alt="ServiceMeow CI" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-emerald.svg" alt="Node.js Version" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/postgresql-16-blue.svg" alt="PostgreSQL" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/vitest-131%20passed-8b5cf6.svg" alt="Tests" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License: MIT" /></a>
</p>

---

## 📑 Overview

**ServiceMeow** is a full-featured, open-source Enterprise Service Management (ESM) and IT Operations platform designed for modern engineering organizations. It delivers complete ITIL service workflows, multi-record dockable workspace multitasking, low-code studio development, autonomous triage automation, and zero-trust security architecture.

---

## 🏛️ Platform Architecture

<p align="center">
  <img src="docs/assets/architecture-diagram.svg" alt="ServiceMeow Platform Architecture" width="100%" />
</p>

### Core Architectural Pillars
1. **Tier 1: Client Surfaces (Next.js 15 App Router + React 19)**:
   - **Fulfiller Workspace**: Multi-record dockable tab bar, polymorphic ITIL forms, visual Kanban boards, and CMDB dependency topology graphs.
   - **Self-Service Portal**: Catalog item fulfillment, shopping cart checkout, record producers, and 90-day service uptime status pages.
   - **Studio Low-Code IDE**: Schema table builder, ACL governance, Monaco code editor, business rules, and Update Set lifecycle management.
2. **Tier 2: Edge & Session Route Guard (`middleware.ts`)**:
   - Pure Web Crypto HMAC-SHA256 session token verification at the edge with zero Node runtime dependencies.
   - Live database role and session evaluation on each tick—demotions and lockouts take effect immediately.
   - Strips client-supplied identity headers (`x-auth-role`, `x-auth-user-id`).
3. **Tier 3: Core ITIL Engines & Sandboxed Execution**:
   - 66 REST endpoints across Table API, Change Management, CMDB, and Reports.
   - **QuickJS WebAssembly Sandbox**: Untrusted scripts (scheduled jobs, script includes, record producers) execute in an isolated guest WebAssembly memory heap with zero access to Node's V8 heap or process APIs.
4. **Tier 4: Enterprise Persistence & Worker Daemon**:
   - **PostgreSQL 16 Engine**: 40+ relational tables with foreign keys and indexes managed by Prisma ORM. Global password hash omission (`omit: { user: { passwordHash: true } }`) prevents credential leakage across all queries.
   - **Background Worker Daemon (`src/worker.ts`)**: Standalone scheduler polling on a 15s timer executing due `sys_scheduled_jobs` and running the autonomous Workflow Agent triage cycle.

---

## 🖥️ Feature Visual Showcases

### 1. Fulfiller Workspace with Multi-Tab Multitasking & Purr-Assist AI
<p align="center">
  <img src="docs/assets/workspace-showcase.png" alt="Fulfiller Workspace Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Browser-Style Dockable Tabs**: Work on multiple Incidents, Changes, and CMDB Topologies simultaneously with persistent form state.
- **Dynamic SLA Timers**: Live countdown meters tracking resolution and response targets against SLAs.
- **Purr-Assist AI**: Real-time generative summarization of ticket handoffs and one-click recommended resolution proposals.
- **Real-Time `sys_audit` Timeline**: Attribute-level delta streaming attributing who changed what and when.

---

### 2. Studio & Low-Code Configuration Center
<p align="center">
  <img src="docs/assets/studio-showcase.png" alt="Studio Configuration Center Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Data Dictionary (`sys_db_object`, `sys_dictionary`)**: Define custom tables (`u_*`), choices, and reference qualifiers dynamically.
- **Monaco Code Editor**: Script Includes, Client Scripts, and Business Rules with syntax highlighting and live execution test console.
- **Update Sets (ALM Engine)**: Track configuration changes across forms, scripts, and tables into XML/JSON packages with collision previews and one-click commits.

---

### 3. Self-Service Portal & 90-Day System Uptime Status
<p align="center">
  <img src="docs/assets/portal-showcase.png" alt="Self-Service Portal Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Service Catalog & Shopping Cart**: Request hardware, developer sandboxes, and cloud access with automated approval workflows.
- **Record Producers**: Easy-to-use forms converting end-user requests directly into backend incidents or tasks.
- **Historical Service Uptime (Past 90 Days)**: Public status board monitoring component uptime, latency, and scheduled maintenance.

---

### 4. Zero-Trust Defense-in-Depth Security
<p align="center">
  <img src="docs/assets/security-showcase.svg" alt="Zero-Trust Security Architecture" width="100%" />
</p>

| Defense Layer | Implementation | Protection Provided |
| :--- | :--- | :--- |
| **WASM Script Sandbox** | `quickjs-emscripten` | True WebAssembly guest memory isolation. Blocks prototype pollution, constructor escaping (`Object['const'+'ructor']`), and process access. |
| **System Table Default-Deny** | `sys_*` ACL & Table API Guard | Non-read operations on system tables (`sys_user`, `sys_user_group`, `sys_security_acl`) default to DENY. Non-admin writes are hard-blocked. |
| **Credential Vault** | Prisma Global Query Omission | `passwordHash` is excluded by default from all queries across the application, preventing data leakage in API responses. |
| **Edge Route Guard** | Next.js Middleware | HMAC SHA-256 JWT validation, sliding session enforcement, and brute-force login lockout (5 failed attempts = 15m lockout). |

---

### 5. Workplace Hub & 6-Tier Spatial Hierarchy (Enterprise IWMS)
<p align="center">
  <img src="docs/assets/spaces-showcase.png" alt="Workplace Hub 6-Tier Spatial Hierarchy" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

ServiceMeow provides an enterprise Workplace Hub & Integrated Workplace Management System (IWMS) designed for corporate facilities, data centers, and clinical healthcare operations:
- **Strict 6-Tier Spatial Model**:
  $$\text{Region} \longrightarrow \text{State / Province} \longrightarrow \text{Campus} \longrightarrow \text{Building} \longrightarrow \text{Floor / Level} \longrightarrow \text{Space / Room}$$
- **Interactive Space Explorer (`/workspace/spaces`)**: Real-time floorplan room matrix, live occupancy states (*Occupied*, *Vacant*, *Reserved*, *Maintenance*), and capacity meters.
- **Biomedical & IoT CMDB Linkage**: Direct foreign key relation between physical spaces (`cmn_space`) and configuration items (`cmdb_ci`), supporting medical devices, surgical robotics, rack servers, and life safety assets.
- **Multi-Hop Dot-Walking & Cascading Lookups**: Traverse properties effortlessly (e.g. `space.floor.building.campus.name` or `ci.space.floor.building.name`).

---

### 6. Workplace Hub & Interactive Reservation System (`/workspace/reservations` & `/portal/reservations`)

A modern, conflict-checked workspace reservation platform allowing employees and facility coordinators to discover, filter, and book meeting spaces, collaboration hubs, and hot desks across **3 distinct interactive views**:

#### 📐 Architectural CAD / Drawing Floorplan View
<p align="center">
  <img src="docs/assets/cad-drawing-showcase.png" alt="Architectural CAD & Drawing Floorplan View" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Architectural Schematic Backdrop (`tech_tower_l4.svg`)**: 1:100 scale CAD blueprint schematic with standard drawing references (`DWG-REF: MEOW-L4-2026`).
- **Interactive Spatial Hotspots**: Real-time pulsing green (available / click-to-book) and red (reserved) occupancy beacons positioned directly over architectural room coordinates.
- **Micro-Badges & Hover Intelligence**: Instant insight into capacity, required amenities, and room status before initiating booking.
- **Vector & PDF Export**: One-click download of architectural CAD/vector schematics for physical site briefings, operations, and facility signage.

---

#### 📅 Real-Time Daily Calendar Schedule Matrix
<p align="center">
  <img src="docs/assets/calendar-view-showcase.png" alt="Daily Calendar Schedule View" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Hourly Space Matrix**: Rooms and desks mapped on the Y-axis against hourly time slots across the operating day.
- **Click-to-Book Vacant Slots**: Click any vacant hourly slot to immediately launch the booking modal with pre-filled time intervals.
- **Dual Time Format Support**: Seamless toggle between **12-Hour AM/PM** standard time and **24-Hour Military Time** (e.g. `0900 hrs`, `1430 hrs`) with persistent `localStorage` preference.
- **Meeting Detail & Organizer Attribution**: Live inspection of booked blocks displaying subject, status, attendee count, and organizer credentials.

---

#### 📋 Room & Hot Desk Catalog View
<p align="center">
  <img src="docs/assets/workplace-showcase.png" alt="Workplace Hub Catalog View" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Amenity & Hardware Filtering**: Discover spaces equipped with **Teams**, **Zoom Rooms**, **Standing desks**, **Whiteboards**, **4K Projectors**, **Telepresence**, and **Dual Monitors**.
- **Double-Booking Prevention Engine**: Atomic conflict checking returning standard `409 Conflict` on overlapping intervals.
- **Atomic Reservation Sequences**: Auto-generated reservation keys (`RES0001001`) with full Table API parity (`cmn_reservation`).

---

### 7. Unified Locations & Spatial Hierarchy Builder (`/workspace/cmn_location`)

A specialized, enterprise-grade interface for managing physical enterprise locations (`cmn_location`), editing records inline, and building multi-tier parent-child relationships across the enterprise spatial topology:

#### 📋 Inline Editable List View
<p align="center">
  <img src="docs/assets/unified_locations_editable_list.png" alt="Unified Locations Editable List View" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Instant Inline Cell Editing**: Click any cell to edit Location Name, Tier Type, Parent Location (Relationship), City, or State with optimistic rendering and immediate Table API persistence.
- **Hierarchical Breadcrumb Paths**: Automatically computed recursive dot-walking paths (e.g. `Americas / California / San Francisco Mission Bay Medical Campus / Pavilion A / Level 3 / Robotic Surgery Suite 1`).
- **Child Rollups & Accordion Expansion**: Visual child badges showing sub-location counts with accordion row expansion to inspect nested children inline.
- **One-Click Sub-Location Builder**: Add child locations at any tier with pre-filled parent relationships.

---

#### 🌳 Multi-Tier Spatial Relationship Tree
<p align="center">
  <img src="docs/assets/unified_locations_tree_builder.png" alt="Multi-Tier Spatial Relationship Tree Builder" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Recursive Visual Tree Graph**: Full ancestral tree from Continental Regions (Tier 1) down to Individual Desks & Rooms (Tier 6).
- **Expand / Collapse All Controls**: One-click branch expansion to navigate deep topologies effortlessly.
- **Interactive Re-Parenting & Branch Management**: Move nodes between parents with cyclic reference protection and automatic downstream path cascading.

---

#### 🔀 Tree + Detail Split Explorer
<p align="center">
  <img src="docs/assets/unified_locations_split_explorer.png" alt="Tree and Detail Split Explorer" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Dual-Pane Productivity**: Browse the spatial tree on the left while modifying comprehensive address metadata, parent relationships, and direct children tables on the right.
- **One-Click Spatial Sync**: Automatically synchronize legacy spatial records (`cmn_region`, `cmn_state`, `cmn_campus`, `cmn_building`, `cmn_floor`, `cmn_space`) into unified `cmn_location` hierarchies.

---

### 8. Dedicated Spatial Entity Record Forms (`/workspace/cmn_* / [id]`)

ServiceMeow replaces generic ITIL task forms with tailored, context-aware spatial editors for all 6 tiers (`cmn_region`, `cmn_state`, `cmn_campus`, `cmn_building`, `cmn_floor`, `cmn_space`, `cmn_location`, `cmn_reservation`):

#### 📝 Specialized State / Province & Spatial Entity Forms
<p align="center">
  <img src="docs/assets/cmn_state_new_form.png" alt="New State Form" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Context-Aware Fields by Spatial Tier**:
  - **`cmn_state` (Tier 2)**: State/Province Name, Unique Code (`US-CA`, `US-WA`), Country, Parent Region dropdown selector (`cmn_region`).
  - **`cmn_region` (Tier 1)**: Region Name, Region Code, Operational Description, Active status toggle.
  - **`cmn_campus` (Tier 3)**: Campus Name, Code, State dropdown, Street Address, City, Zip Code, GPS Coordinates.
  - **`cmn_building` (Tier 4)**: Building Name, Code, Campus dropdown, Building Type (`hospital`, `clinic`, `lab`, `office`, `datacenter`), Floors Count, Area Sq Ft.
  - **`cmn_floor` (Tier 5)**: Floor Name, Code, Floor Level Number, Building dropdown, Area Sq Ft, CAD/SVG Drawing URL.
  - **`cmn_space` (Tier 6)**: Room Name, Space Number, Floor dropdown, Space Type, Occupancy Status (`available`, `occupied`, `reserved`, `maintenance`), Capacity, Square Footage, Department, Amenity capability pills.
- **Hierarchy Placement Card**: Dedicated right-hand rail displaying Tier classification, database table metadata, parent relationship links, and Connected Workplace Architecture notes.
- **Related Child Assets & Deep Linkage**: Directly inspect and manage child assets (e.g. Campuses located within a State) with inline "+ Add New" actions.

<p align="center">
  <img src="docs/assets/cmn_state_saved_detail.png" alt="Saved State Detail View" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

---

### 9. Agile Project Management & Sprint Hub (`/workspace/agile`)

A Swiss Grid Kanban workspace designed for engineering velocity, sprint planning, and release governance:
- **5-Column Kanban Board**: *Backlog*, *Sprint Ready*, *In Progress*, *Testing & QA*, and *Done* with single-click card transitions.
- **Fibonacci Story Point Estimates**: Instant 1, 2, 3, 5, 8, 13, 21 sizing selectors with automated sprint velocity rollups.
- **Sprint Hub & Capacity Planning**: Define multi-week timeboxes (`rm_sprint`), track commitment burn-up, and enforce sprint goals.
- **Strategic Epics & Story Management**: Direct linkage to strategic epics (`rm_epic`) and full Table API parity for stories (`rm_story`) with Gherkin acceptance criteria.

<p align="center">
  <img src="docs/assets/agile-board-showcase.png" alt="Agile Sprint Board Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

---

### 10. Problem Management & Known Error Database (KEDB) (`/workspace/problem`)

Enterprise-grade ITIL Problem Management designed to eliminate recurring incidents, investigate root causes, and publish authoritative workarounds:

<p align="center">
  <img src="docs/assets/problem-management-showcase.png" alt="Problem Management & KEDB Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Formal 6-Stage ITIL Problem Lifecycle**:
  $$\text{1 - New} \longrightarrow \text{2 - Assessing / RCA} \longrightarrow \text{3 - Workaround Established} \longrightarrow \text{4 - Known Error (KEDB)} \longrightarrow \text{6 - Resolved} \longrightarrow \text{7 - Closed}$$
- **Root Cause Analysis (RCA) & Permanent Fix Documentation**: Dedicated investigation blocks tracking technical triggers, architectural remediations, and deployment milestones.
- **Known Error Database (KEDB) Publishing**: Toggle any problem directly into the platform KEDB with verified temporary workarounds to expedite first-call incident resolution.
- **Bi-Directional Incident & CI Linkage**: Associate multiple child incidents with a parent problem and pinpoint affected Configuration Items (`cmdb_ci`) for automated blast-radius assessment.
- **Dynamic Priority Engine**: Real-time 3x3 Impact × Urgency matrix computing standard ITIL priority (P1 Critical through P4 Low).

---

### 11. Enterprise CMDB Hardware & Datacenter Rackmount Topology (`/workspace/cmdb_ci`)

A robust Configuration Management Database (CMDB) linking physical infrastructure, virtual assets, and datacenter rackmount geometry:

<p align="center">
  <img src="docs/assets/cmdb-ci-showcase.png" alt="Enterprise CMDB Hardware Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Datacenter 42U Rack Elevation Spec**: Specify rack positions (`rack_id`, `rack_units`, `rack_unit_start`, `rack_unit_end`) for physical servers, network switches, and storage arrays with datacenter visualization (`/workspace/cmdb/racks`).
- **Complete Hardware Asset Attributes**: Serial numbers, asset tags, MAC addresses, primary IP addresses, manufacturers, and model numbers.
- **6-Tier Spatial Location Binding**: Physical hardware is directly mapped to the enterprise spatial hierarchy (Region $\longrightarrow$ State $\longrightarrow$ Campus $\longrightarrow$ Building $\longrightarrow$ Floor $\longrightarrow$ Space/Room).
- **Upstream & Downstream Dependency Topology (`ci_rel`)**: Track service dependencies, network linkages, and parent/child cluster relationships to accelerate change impact analysis.

---

### 12. Knowledge Management & Curated Self-Service Intake (`/workspace/kb_knowledge`)

Empower both support fulfillers and end-users with unified, version-controlled knowledge bases:

<p align="center">
  <img src="docs/assets/knowledge-showcase.png" alt="Knowledge Management Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Multi-Repository Knowledge Governance (`kb_knowledge_base`)**: Scoped knowledge repositories (IT Support, HR Benefits, Facilities Engineering, Developer Guides) with role-based access.
- **Split-Screen Markdown Authoring**: Write technical runbooks in Markdown with live preview, header navigation, and code syntax highlighting.
- **Publication Lifecycle State Machine**: Manage articles across *Draft*, *Review*, *Published*, and *Retired* states with scheduled expiration dates and public portal publication toggles.
- **Employee Portal Integration (`/portal/knowledge`)**: Fast self-service intake with instantaneous keyword search, category navigation, helpfulness ratings, and view tracking.

---

### 13. Space Console & Interactive CAD Floorplan Blueprint (`/workspace/spaces`)

An enterprise architectural space console bridging facilities management, occupancy tracking, and resource allocation:

<p align="center">
  <img src="docs/assets/spatial-hierarchy-cad-showcase.png" alt="Space Console CAD Showcase" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Interactive CAD Floorplan Editor**: Drag-and-drop room repositioning, interactive corner resize handles, and instant coordinate updates.
- **Occupancy & Capacity Metrics**: Live visual occupancy status (*Vacant*, *Occupied*, *Reserved*, *Maintenance*) with capacity percentage gauges across wings and floors.
- **Integrated Workplace Reservation Linkage**: Seamless synchronization with `/portal/reservations` and `/workspace/reservations`.
- **Architectural Vector Schematics**: Standard 1:100 scale blueprint exports (SVG / PDF) for emergency egress planning and facility briefings.

---

### 14. Universal Command Palette (`Cmd+K`) & Swiss Grid Design System

ServiceMeow features a stark, high-contrast user interface built on the principles of the **Swiss International Typographic Style**:

- **Swiss Grid Design Architecture**: 2px solid black borders, hard drop-shadows (`shadow-[4px_4px_0px_rgba(0,0,0,1)]`), sharp non-rounded geometry (`rounded-none`), high-contrast grotesque and monospace typography, and international `#eb0029` red accents.
- **Global Command Palette (`Cmd+K` / `Ctrl+K`)**: Instant spotlight navigation across all system records—Incidents, Problems, Changes, CMDB CIs, Knowledge Articles, Spaces, and Sprints.
- **Prefix-Ranked Search API**: Ticket numbers (e.g. `INC0001001`, `PRB0001001`) are automatically prioritized ahead of substring body matches for instantaneous search resolution.
- **Keyboard Shortcut Overlay (`?`)**: Quick help drawer for rapid navigation without touching the mouse.
- **Modular Admin Roles**: Fine-grained administrative delegation (`user_admin`, `catalog_admin`, `cmdb_admin`, `workflow_admin`, `space_admin`) preventing over-privileged access.
- **Hydration Extension Guard**: Immune to third-party browser extension DOM mutations (`grammarly`, `lastpass`, etc.) ensuring React 19 SSR / hydration stability.

---

### 15. Universal Excel-Style Table Data Editor (`/studio?tab=table_editor`)

A high-productivity, spreadsheet-grade administrative data grid providing platform admins complete control over all system and operational tables (`incident`, `change_request`, `sys_user`, `cmdb_ci`, `rm_story`, `cmn_location`, `sc_task`, etc.):

<p align="center">
  <img src="docs/assets/table-editor-showcase.png" alt="Universal Excel-Style Table Data Editor" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Inline Cell Editing & Auto-Save**: Double-click or click any cell to edit fields directly in place with real-time feedback and immediate PATCH persistence.
- **Admin View Customizer**: Toggle column visibility, reorder columns, and personalize grid density with preferences saved permanently to `localStorage` per table.
- **Batch Operations & Record Creation**: Add new rows via quick inline insert or structured modal form; multi-select rows for bulk deletion with atomic confirmation safeguards.
- **Instant Sorting, Filtering & CSV Export**: Column header sort toggles, multi-field regex text search, pagination size selection (15, 25, 50, 100), and 1-click client-side CSV spreadsheet export.

---

### 16. Employee Table & Spatial Location Explorer with End-of-Day Data Extraction (`/portal/data-explorer`)

A dedicated, theme-harmonized open data explorer giving employees and staff instant visibility and extraction capabilities across 25+ system and spatial tables:

<p align="center">
  <img src="docs/assets/data-explorer-showcase.png" alt="Employee Table & Spatial Data Explorer with End-of-Day CSV Extract" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

- **Dedicated Explorers for All Spatial Tiers**: Direct exploration across the full spatial hierarchy—`cmn_region`, `cmn_state`, `cmn_campus`, `cmn_building`, `cmn_floor`, `cmn_space`, `cmn_location`, and `cmn_reservation`.
- **Collapsible Table Directory Sidebar**: Browse tables organized intuitively into Workplace & Spatial, Agile Project Management, ITIL Operations, CMDB, Knowledge, and User Directory categories.
- **Direct Bookmarkable URLs**: Synchronized URL parameters (`/portal/data-explorer?table=cmn_space`) enabling direct links to any specific table explorer.
- **End-of-Day CSV Extraction**: One-click instant **Export CSV** download with automated timestamped filenames for daily auditing, compliance reporting, and external data warehousing.

---

## 🚀 Quick Start with Docker Compose

Run ServiceMeow with PostgreSQL and the background scheduler daemon using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/oleh11/servicemeow.git
cd servicemeow

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Generate a secure authentication secret
# Set AUTH_SECRET in .env with a secure 32+ character random string

# 4. Start all services (App, PostgreSQL, Background Worker)
docker compose up -d --build
```

The services will initialize:
- **Web Application**: `http://localhost:3000`
- **PostgreSQL Database**: `localhost:5432`
- **Background Worker**: running in background container `servicemeow-worker`

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **PostgreSQL** (or SQLite for quick local prototyping)

### Step-by-Step Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
# For PostgreSQL:
npx prisma migrate deploy
# Or for rapid prototyping:
npm run prisma:push

# 5. Seed initial users, dictionary schema, and demo catalog items
npm run prisma:seed

# 6. Start development server
npm run dev

# 7. (Optional) In a separate terminal, start the background worker scheduler
npm run worker
```

---

## 🧪 Testing & Verification

ServiceMeow includes a full Vitest test suite with **131 passing tests across 16 test suites** covering cryptographic signing, password hashing, rate limiting, system table ACL default-deny, QuickJS WASM sandbox security boundaries, role-based persona navigation segregation, spatial entity operations, the 6-tier Workplace Hub spatial hierarchy, CAD floorplan manipulation, modular administrator roles, search ranking, and agile / CMDB / knowledge entity integrity.

```bash
# Run Vitest test suite once
npm run test

# Run Vitest in watch mode
npm run test:watch

# Run End-to-End Security Verification suite
node scripts/e2e-security.mjs
```

---

## 🔐 Seeded Personas & Dynamic Passwords

There are **no hardcoded default passwords**. When you run the seed (`npm run db:setup` / `prisma/seed.ts` or `scripts/seed-passwords.ts`), passwords come from `SEED_ADMIN_PASSWORD` and `SEED_DEFAULT_PASSWORD`. If those are unset, cryptographically random passwords are generated and **printed once** to the seed output.

| Persona | Name | Role | Email | Password Source |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Felix Vance (Admin Cat) | `admin` | `admin@servicemeow.io` | `SEED_ADMIN_PASSWORD` |
| **Incident Commander** | Sarah Jenkins | `itil` | `sarah.jenkins@servicemeow.io` | `SEED_DEFAULT_PASSWORD` |
| **CAB Governance Chair** | Marcus Vance | `cab_approver` | `marcus.vance@servicemeow.io` | `SEED_DEFAULT_PASSWORD` |
| **Staff Engineer** | Alex Chen | `employee` | `alex.chen@servicemeow.io` | `SEED_DEFAULT_PASSWORD` |

The one-click persona buttons on the login page only work in development with `ALLOW_DEV_PERSONA_LOGIN=true` (they are always refused when `NODE_ENV=production`).

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | **Yes** |
| `AUTH_SECRET` | 32+ char cryptographic secret for session JWTs | `""` | **Yes** |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` | **Yes** |
| `PORT` | HTTP port | `3000` | No |
| `WORKER_INTERVAL_MS` | Worker scheduler poll interval (milliseconds) | `15000` | No |
| `ALLOW_DEV_PERSONA_LOGIN`| Allows 1-click persona switching without password | `false` | **Must be false** |
| `ALLOW_RAW_SESSION_ID` | Allows direct unverified session ID as Bearer | `false` | **Must be false** |

---

## 📜 License

Released under the [MIT License](LICENSE).
