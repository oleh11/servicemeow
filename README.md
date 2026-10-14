# ServiceMeow 🐾

> Enterprise Cloud Service Management (ESM) & ITIL Workflow Engine with Next Experience Multi-Tab Docking, Zero-Trust Security, and Autonomous AI Triage.

[![ServiceMeow CI](https://github.com/servicemeow/servicemeow/actions/workflows/ci.yml/badge.svg)](https://github.com/servicemeow/servicemeow/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-emerald.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📑 Overview

**ServiceMeow** is a full-featured, open-source Enterprise Service Management (ESM) and IT Operations platform designed for modern engineering organizations. It unifies ITSM incident management, change governance with CAB approvals, CMDB configuration topology, service catalog fulfillment, record producers, dynamic business logic, and automated background scheduling.

---

## 🏛️ Architecture & Core Modules

```
                           +---------------------------+
                           |  Next.js 15 App Router    |
                           |  (Edge Route Middleware)  |
                           +-------------+-------------+
                                         |
                +------------------------+------------------------+
                |                                                 |
  +-------------v-------------+                     +-------------v-------------+
  |    Fulfiller Workspace    |                     |   Self-Service Portal     |
  |  - Polymorphic Task Forms |                     |  - Service Catalog Items  |
  |  - CMDB Dependency Graph  |                     |  - Record Producers       |
  |  - Visual Kanban Board    |                     |  - System Health & Uptime |
  |  - Executive Dashboards   |                     |  - Knowledge & Articles   |
  +-------------+-------------+                     +-------------+-------------+
                |                                                 |
                +------------------------+------------------------+
                                         |
                           +-------------v-------------+
                           |  Studio & Admin Center    |
                           |  - Data Dictionary & Schema
                           |  - ACL Access Controls    |
                           |  - Business Rules Engine  |
                           |  - Flow Designer & Agent  |
                           |  - Application Scopes     |
                           |  - Update Sets (ALM)      |
                           +-------------+-------------+
                                         |
                                  Prisma Client
                                         |
                           +-------------v-------------+
                           |    PostgreSQL 16 Engine   |
                           +-------------+-------------+
                                         ^
                                         |
                           +-------------+-------------+
                           |  Background Worker Daemon |
                           |  (Worker.ts / Scheduler)  |
                           |  - Due Scheduled Jobs     |
                           |  - Workflow Triage Agent  |
                           +---------------------------+
```

### 1. Data Model & Polymorphic Tasks
- **Task Hierarchy (`task`)**: Single shared inheritance model across Incident, Problem, Change Request, Service Request, and Catalog Task.
- **Data Dictionary (`sys_dictionary`, `sys_db_object`, `sys_choice`)**: Dynamic runtime column definitions, table extensions (`u_*`), choices, and reference qualifiers.
- **Audit History Engine (`sys_audit`)**: Real-time attribute-level delta tracking with user and timestamp attribution.

### 2. Zero-Trust Security & Access Governance
- **Next.js Edge Middleware (`middleware.ts`)**: Pure Web Crypto (`crypto.subtle`) HMAC SHA-256 session token verification at the edge with zero Node runtime dependencies.
- **Server-Side Database Sessions (`sys_user_session`)**: Persistent sessions with sliding 7-day expiration and server-side impersonation.
- **Zero-Trust Role Resolution**: Roles are dynamically evaluated server-side from direct assignments and group memberships. Client-sent headers (`x-user-role`) are ignored.
- **Bcrypt Password Security**: Passwords salted and hashed with `bcryptjs` (work factor 10).
- **Rate Limiting & Lockout Guard**: Sliding window limiter (5 attempts per 15-minute window) protecting against brute-force attacks.
- **VM Script Sandboxing**: All runtime scripts (scheduled jobs, record producers, script includes) execute in isolated Node.js `vm` contexts with blocked access to `process`, `require`, and filesystem APIs.

### 3. Fulfiller Workspace & Portal
- **Workspace Tab Bar**: Browser-like dockable tab strip supporting multi-record multitasking with persistent state.
- **Material Design 3 (M3 / Material You)**: Dynamic theme engine with 7 color palettes (Enterprise Polaris, Midnight Cyber, Corporate Navy, Tokyo Sunset, Golden Tabby, Synthwave Neon, High Contrast) and 4 layout architectures.
- **CMDB & ITOM**: Configuration items, directional dependency graphs, and datacenter 42U rack chassis elevations.
- **Self-Service Portal**: Service Catalog item fulfillment, shopping cart checkout, record producers, and 90-day service uptime status pages.

### 4. Background Worker Daemon (`src/worker.ts`)
- Standalone interval scheduler executing due `sys_scheduled_jobs` on a timer.
- Autonomous Workflow Agent auditing P1 escalations, SLA breach timers, and ticket auto-assignments.

---

## 🚀 Quick Start with Docker Compose

The easiest way to run ServiceMeow with PostgreSQL and the background worker is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/servicemeow/servicemeow.git
cd servicemeow

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Generate a secure authentication secret
# Replace AUTH_SECRET in .env with a secure 32+ character random string

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

ServiceMeow includes a full Vitest test suite covering cryptographic signing, password hashing, rate limiting, role resolution, and script sandbox security boundaries.

```bash
# Run Vitest test suite once
npm run test

# Run Vitest in watch mode
npm run test:watch
```

---

## 🔐 Default Persona Credentials (Development Only)

> **IMPORTANT**: In production, change all passwords immediately. The system enforces bcrypt password hashing.

| Persona | Name | Role | Email | Default Password |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Felix Vance (Admin Cat) | `admin` | `admin@servicemeow.io` | `admin123` |
| **Incident Commander** | Sarah Jenkins | `itil` | `sarah.jenkins@servicemeow.io` | `ServiceMeow!2026` |
| **CAB Governance Chair** | Marcus Vance | `cab_approver` | `marcus.vance@servicemeow.io` | `ServiceMeow!2026` |
| **Staff Engineer** | Alex Chen | `employee` | `alex.chen@servicemeow.io` | `ServiceMeow!2026` |

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
