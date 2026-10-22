# Changelog

All notable changes to the **ServiceMeow** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-10-22

### Added
- **Enterprise Live Agent Chat Subsystem**:
  - **Employee Portal Floating Widget (`/portal`)**:
    - Floating docked bubble with badge status and sliding drawer.
    - Queue selection (Global IT Service Desk, Workplace & Facilities, People Ops & HR).
    - Real-time queue intake waiting card displaying dynamic estimated wait times, position in line, and cancel option.
    - Real-time bidirectional streaming chat with typing indicators, auto-scroll, message timestamps, and agent presence badges.
    - Post-chat CSAT 1–5 star rating review with optional feedback comment.
    - 1-click formatted chat transcript export (`.txt`).
  - **Fulfiller Live Agent Cockpit (`/workspace/chat`)**:
    - Fulfiller presence control with dynamic state toggle (`Online`, `Busy`, `Away`, `Offline`).
    - Dynamic agent concurrency capacity tracker ($N/3$ active sessions).
    - Real-time incoming queue banner with 30-second acceptance countdown and sound/visual alerts.
    - Multi-session tab navigation switching between concurrent active interactions without losing state.
    - Canned macro insertion picker (`/greet`, `/kb`, `/hold`, `/screen_share`, `/resolve`) for rapid fulfillment.
    - Internal whisper work notes (`isInternal = true`) with amber styling, strictly hidden from requesters.
    - Live caller context dossier drawer showing requester email, company, department, active open tickets, and channel metadata.
    - 1-click "Create Incident from Chat" workflow converting conversation transcript directly into a new Incident with atomic auto-numbering (`getNextNumber("INC")`).
  - **Studio Live Chat Configurator (`/studio?tab=chat`)**:
    - Module 21 added to Studio Explorer under *Server Automation*.
    - Routing Queue Management: CRUD support for support queues (`sys_live_chat_queue`) with assignment group routing, priority weighting, and concurrency limits.
    - Canned Macro Management: CRUD support for canned response shortcuts (`sys_canned_response`) with team-wide visibility.
    - Global Engine Configuration: Maximum concurrent chats per agent, intake queue timeout thresholds, session inactivity timeouts, and custom welcome greetings.
  - **Real-Time Streaming Engine & Pub/Sub Bus**:
    - High-throughput Server-Sent Events (SSE) stream (`/api/now/chat/stream`) with Web Standards `ReadableStream`, 15-second heartbeat keepalive, and auto-cleanup.
    - In-memory event pub/sub bus (`chat-bus.ts`) dispatching session events, queue broadcasts, and agent direct alerts.
    - REST fallback API routes (`/api/now/chat/session`, `/api/now/chat/message`, `/api/now/chat/agent`, `/api/now/chat/config`).
    - Persona segregation: Requesters cannot view internal whisper work notes across both REST and SSE streams.
- **Automated Test Suite**:
  - `tests/live-agent-chat.test.ts`: 12 comprehensive unit and integration tests verifying session lifecycle, queue routing, message broadcasting, whisper privacy, incident conversion, and API authorization. Test suite expanded to 156 passing tests across 21 files.

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
