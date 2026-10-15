# Changelog

All notable changes to the **ServiceMeow** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-15

### Added
- **Direct CAD Canvas Manipulation & Reshaping Engine**:
  - **Direct Room Drag-to-Move**: Click-and-drag any mapped room hotspot directly across the CAD canvas with smooth 60fps delta calculation and 0.5% grid snapping.
  - **8-Point Interactive Resize Handles**: 4 corner handles (`nw`, `ne`, `se`, `sw`) and 4 edge handles (`n`, `e`, `s`, `w`) to freely resize and reshape room bounds directly on the canvas without manual numeric calculations.
  - **Architectural Room Archetype Presets**: 7 one-click room stamping presets (Phone Pod, Small Huddle, Meeting Room, Boardroom, Workstation Cluster, Lab Suite, Breakout Lounge) for instant room scaling or drag-and-drop placement onto the floor.
  - **Floor Reshaping & Orientation Controls**: 5 architectural aspect ratios (`16:10`, `4:3`, `16:9`, `1:1`, `2:1`, plus freeform custom ratio slider), 4-way orientation rotation (`0°`, `90°`, `180°`, `270°`), and 4 viewport canvas height presets (`compact`, `standard`, `tall`, `auto`).
  - **Canvas Blueprint File Drag-and-Drop**: Users can drag and drop architectural vector blueprints (SVG, PNG, JPG) directly from their desktop onto the floorplan canvas to instantly upload and re-link the level.
  - **Live Floating Dimension HUD**: Real-time Heads-Up Display showing live normalized bounds, estimated real-world room dimensions (ft and sq. ft), and unsaved changes indicator with 1-click Save and Revert.
  - **Keyboard Ergonomics**: Arrow keys nudge position (0.5% / 0.1% with Alt), `Shift + Arrows` resize width & height, `Ctrl+S` / `Cmd+S` saves instantly, `Esc` deselects.

## [1.1.0] - 2026-10-15

### Added
- **Delegated Modular Administrator Roles**:
  - Fine-grained enterprise administrative self-management: `workplace_admin`, `catalog_admin`, `itil_admin`, `cmdb_admin`, `knowledge_admin`.
  - Configured role inheritance in `ROLE_HIERARCHY`, domain table mapping in `MODULAR_ADMIN_DOMAINS`, and edge route authorization in `middleware.ts`.
  - Added dedicated persona **Morgan 'Blueprint' Reed** (`workplace_admin` - Director of Real Estate & Workplace Technology) and **Chloe 'Spec' Montgomery** (`catalog_admin` - Principal Service Catalog Architect).
  - Studio Admin Center Explorer dynamic filtering: modular admins can access only their authorized enterprise configuration domains without requiring full system `admin`.
- **Interactive CAD Floorplan Drawing & Room Hotspot Mapper**:
  - Dedicated visual CAD editor component (`CadFloorplanEditor.tsx`) embedded directly into Studio Workplace Hub and Connected Workplace Reservation System.
  - Interactive canvas supporting click-and-drag bounding box drawing (`(floorplanX, floorplanY, floorplanWidth, floorplanHeight)` calculated in normalized 0–100% coordinates).
  - Real-time coordinate fine-tuning with 0.5% precision steppers, grid alignment overlay, and live occupancy preview simulation.
  - Architectural blueprint file upload and URL linking API (`/api/now/spatial/floorplan-upload`) associating vector SVG and CAD schematics with `cmn_floor`.
  - On-the-fly room creation and instant room hotspot persistence to `cmn_space` via Table API.

## [1.0.0] - 2026-10-14

### Added
- **Universal Command Palette (`Cmd+K` / `Ctrl+K`)**: Global spotlight modal (`CommandPaletteModal.tsx`) providing sub-50ms indexed search across ITIL tasks, catalog items, knowledge articles, CMDB CIs, and workplace spaces.
- **Global Search API (`/api/now/search`)**: Dedicated multi-domain search route executing parallel queries with strict Persona Segregation filtering.
- **One-Click Quick Filter Presets**: Interactive preset pills (`All`, `Assigned to Me`, `Unassigned`, `Critical P1/P2`, `In Progress`, `Resolved / Closed`) in `RecordList.tsx`.
- **Data Grid Export Engine**: Client-side RFC 4180 CSV export, structured JSON download, and 1-click clipboard copy in `RecordList.tsx`.
- **Canned Response Macros**: Work note diagnostic templates and customer-facing response macros in `ActivityStream.tsx`.
- **Keyboard Shortcuts Cheatsheet (`?`)**: Global cheatsheet modal documenting shortcuts for navigation, list triage, and surface switching.
- **6-Tier Connected Workplace Hierarchy**: Strict relational tree (Region ⟶ State ⟶ Campus ⟶ Building ⟶ Floor ⟶ Space) with interactive CAD SVG floorplan mapping and reservation conflict checks.
- **Next Experience Dockable Multi-Tab Workspace**: Multi-record tab bar preserving unsaved form states across Incidents, Problems, and Change Requests.
- **Studio Low-Code Workbench**: 2-pane IDE with Monaco editor, dynamic data dictionary (`sys_db_object`), and Update Set ALM package export/commit engine.
- **Autonomous Worker Scheduler**: 15s interval scheduler daemon (`src/worker.ts`) executing due scheduled jobs and running the Hermes Workflow Agent triage cycle.

### Security
- **WebAssembly Script Sandbox**: Untrusted business rules and script includes run inside an isolated QuickJS guest WASM heap (32MB ceiling, 1000ms hard timeout).
- **Edge Route Guard (`middleware.ts`)**: Pure Web Crypto HMAC-SHA256 session token verification with live database demotion checks and identity spoofing prevention.
- **Global Credential Omission**: Prisma query-level omission of `passwordHash` preventing credential leaks across all API responses.
- **System Table Default-Deny**: Non-admin write operations against `sys_*` system tables are hard blocked.

### Fixed
- **Spatial Location Breadcrumbs**: Added unified location records (`locAmericas` and `locCalifornia`) in `prisma/seed.ts` to guarantee 100% referential integrity for full 6-tier breadcrumbs.
- **Database Bootstrap**: Added autonomous `DATABASE_URL` fallback resolution in `prisma/seed.ts` for zero-config developer onboarding.
