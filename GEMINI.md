# ServiceMeow — Antigravity Project Guide

Welcome to the **ServiceMeow** Antigravity project! This document configures Antigravity's autonomous agent capabilities for this enterprise codebase.

## 🐾 Project Overview
ServiceMeow is an open-source Enterprise Service Management (ESM) and ITIL Operations Platform built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM (SQLite / PostgreSQL), QuickJS WASM sandboxing, and autonomous workflow daemons.

## 🏛️ Core Surfaces & Routes
- **Fulfiller Workspace** (`/workspace`): Dockable multi-record workspace, incidents (`/workspace/incident`), CMDB rack management (`/workspace/cmdb/racks`), change requests, and Purr-Assist AI.
- **Studio & Admin Center** (`/studio`): 2-pane IDE Workbench with collapsible Studio Explorer organizing 20 modules into 5 enterprise domains:
  1. *Data & Architecture* (`sys_dictionary`, `sys_app`, `sys_import_set`, `sys_update_set`)
  2. *Security & Identity* (`sys_user`, `sys_security_acl`)
  3. *Server Automation* (`sys_script`, `sys_script_include`, `sys_hub_flow`, `sys_daemon`, `sysauto_script`)
  4. *Forms, UI & Catalog* (`sc_cat_item`, `sc_cat_item_producer`, `sys_script_client`, `sys_ui_policy`, `sys_app_application`)
  5. *Platform & Workplace* (`cmn_reservation`, `sys_ws_definition`, `sysevent`, `cmn_schedule`)
- **Employee Self-Service Portal** (`/portal`): Public & employee intake catalog, fast action cards, knowledge base, 90-day uptime status, and Workplace Hub navigation.
- **Workplace Hub & Reservations** (`/portal/reservations` & `/workspace/reservations`): 3-view room booking engine (Catalog with Teams/Zoom/Standing desk filters, Daily Calendar schedule, and Architectural CAD floorplan view).
- **Spatial Hierarchy** (`/portal/spaces` & `/workspace/spaces`): Strict 6-tier spatial tree (Region ⟶ State ⟶ Campus ⟶ Building ⟶ Floor ⟶ Space/Room) with live occupancy state matrix.

## ⚙️ Essential CLI Commands
- `npm run dev` — Start the local development server on `http://localhost:3000`
- `npm test` — Run the full Vitest suite (77 tests across 10 test files)
- `npm run build` — Execute production Next.js compilation
- `npm run prisma:seed` — Re-seed dev database (`prisma/dev.db`)
- `npm run capture:screenshots` — Automatically capture 2x Retina screenshots of all UI surfaces into `docs/assets/`

## 🛡️ Coding & Architectural Rules
1. **Persona Segregation**: Fulfiller-only capabilities (CMDB topology, Agent Workspace, Studio admin) must never be displayed to plain employee personas.
2. **Platform Parity**: Zero hardcoded strings for legacy vendor names; always maintain clean, independent ServiceMeow branding.
3. **Security Standards**: Password hashes are globally omitted from database query returns (`omit: { user: { passwordHash: true } }`). System table writes (`sys_*`) are restricted to administrators by default.
