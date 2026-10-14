# ServiceMeow 🐾

<p align="center">
  <img src="docs/assets/servicemeow-banner.png" alt="ServiceMeow Banner" width="100%" style="border-radius: 12px; border: 1px solid #1e293b;" />
</p>

<p align="center">
  <strong>The Open-Source Enterprise Service Operations (ITIL) Platform</strong><br>
  Next Experience Dockable Tabs • QuickJS WASM Script Isolation • PostgreSQL 16 • Autonomous Workflow Agent
</p>

<p align="center">
  <a href="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml"><img src="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml/badge.svg" alt="ServiceMeow CI" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-emerald.svg" alt="Node.js Version" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/postgresql-16-blue.svg" alt="PostgreSQL" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/vitest-89%20passed-8b5cf6.svg" alt="Tests" /></a>
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

### 9. Agile 2.0 Sprint Management & Interactive Kanban Board (`/workspace/agile`)
<p align="center">
  <img src="docs/assets/agile-board-showcase.png" alt="Agile 2.0 Project Management Board" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

ServiceMeow includes a full Agile Project Management module modeled on modern engineering standards and ITIL Agile 2.0:
- **5-Column Flow State Matrix**: Organize work across *Backlog (1)*, *Sprint Ready (2)*, *In Progress (3)*, *Testing & QA (4)*, and *Complete (7)*.
- **Sprint Management & Velocity Progress**: Live sprint tabs (e.g. *Sprint 26.1*, *Sprint 26.2*, *Backlog Unassigned*) with real-time story point burn-up calculation and percentage completion meters.
- **Fibonacci Story Pointing & Epic Attribution**: Assign standard Fibonacci complexity points (1, 2, 3, 5, 8, 13, 21 pts) and link stories directly to business Epics (`rm_epic`) and Projects (`rm_project`).
- **Interactive Optimistic State Controls**: Rapidly advance or regress story states with 1-click `<` and `>` controls backed by the Table API (`rm_story`).
- **Story Creation & Detail Inspection**: Modal forms for creating new user stories and deep-dive drawer panels inspecting acceptance criteria, task number sequence (`STRY0001001`), assignees, and state history.

---

### 10. Universal Excel-Style Table Data Editor (`/studio?tab=table_editor`)
<p align="center">
  <img src="docs/assets/table-editor-showcase.png" alt="Universal Excel-Style Table Data Editor" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

A high-productivity, spreadsheet-grade administrative data grid providing platform admins complete control over all system and operational tables (`incident`, `change_request`, `sys_user`, `cmdb_ci`, `rm_story`, `cmn_location`, `sc_task`, etc.):
- **Inline Cell Editing & Auto-Save**: Double-click or click any cell to edit fields directly in place with real-time green pulse feedback and immediate PATCH persistence.
- **Admin View Customizer**: Toggle column visibility, reorder columns, and personalize grid density with preferences saved permanently to `localStorage` per table (`servicemeow_view_${table}`).
- **Batch Operations & Record Creation**: Add new rows via quick inline insert or structured modal form; multi-select rows for bulk deletion with atomic confirmation safeguards.
- **Instant Sorting, Filtering & CSV Export**: Column header sort toggles, multi-field regex text search, pagination size selection (15, 25, 50, 100), and 1-click client-side CSV spreadsheet export.

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

ServiceMeow includes a full Vitest test suite with **89 passing tests across 10 test suites** covering cryptographic signing, password hashing, rate limiting, system table ACL default-deny, QuickJS WASM sandbox security boundaries, role-based persona navigation segregation, spatial entity operations, and the 6-tier Workplace Hub spatial hierarchy.

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
