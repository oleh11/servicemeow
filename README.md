# ServiceMeow 🐾

<p align="center">
  <img src="docs/assets/hero-banner.jpg" alt="ServiceMeow Banner" width="100%" style="border-radius: 12px; border: 1px solid #1e293b;" />
</p>

<p align="center">
  <strong>The Open-Source Enterprise Service Operations (ITIL) Platform</strong><br>
  Next Experience Dockable Tabs • QuickJS WASM Script Isolation • PostgreSQL 16 • Autonomous Workflow Agent
</p>

<p align="center">
  <a href="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml"><img src="https://github.com/oleh11/servicemeow/actions/workflows/ci.yml/badge.svg" alt="ServiceMeow CI" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-emerald.svg" alt="Node.js Version" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/postgresql-16-blue.svg" alt="PostgreSQL" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/vitest-63%20passed-8b5cf6.svg" alt="Tests" /></a>
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

### 6. Interactive Room & Desk Reservation System (`/workspace/reservations`)
<p align="center">
  <img src="docs/assets/workplace-showcase.png" alt="Workplace Hub Interactive Reservation System" width="100%" style="border-radius: 8px; border: 1px solid #1e293b;" />
</p>

A modern, conflict-checked workspace reservation platform allowing employees and facility coordinators to discover, filter, and book meeting spaces, collaboration hubs, and hot desks across **3 distinct interactive views**:

1. **📋 Room & Desk Catalog View**:
   - Filterable by specific room capabilities and amenities: **Teams**, **Zoom**, **Standing desk**, **Whiteboard**, **4K Projector**, **Telepresence**, and **Dual Monitor**.
   - Real-time availability badges for selected date/time intervals with attendee capacity limits.
2. **📅 Daily Calendar Schedule View**:
   - Interactive schedule timeline grid displaying active reservation blocks, organizers, and statuses.
   - Click-to-book on any vacant time slot to initiate instant reservation.
3. **🗺️ Architectural PDF / Picture Floorplan View**:
   - High-fidelity CAD / SVG architectural schematic backdrop with live-pulsing green (available) and red (booked) room hotspots.
   - Interactive hover cards and one-click direct floorplan booking.
   - Vector and PDF export support for physical printouts and facility briefings.
4. **🛡️ Conflict Prevention & Atomic Numbering**:
   - Strict double-booking prevention engine returning standard `409 Conflict` on overlapping intervals.
   - Atomic reservation sequences (`RES0001001`) with full Table API parity (`cmn_reservation`).

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

ServiceMeow includes a full Vitest test suite with **77 passing tests** covering cryptographic signing, password hashing, rate limiting, system table ACL default-deny, QuickJS WASM sandbox security boundaries, role-based persona navigation segregation, and the 6-tier Workplace Hub spatial hierarchy.

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
