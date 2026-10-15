# ServiceMeow Architecture Blueprint

**Version**: 1.0.0 (Production Verified)  
**Standard**: 2026 Enterprise Architecture & Domain-Driven Design (DDD)  

---

## 1. System Architecture Blueprint

ServiceMeow is organized into 4 decoupled, high-resilience tiers:

```
[Tier 1: Client Surfaces]
  ├── /workspace (Operations Agent Workspace: Dockable Tabs, Kanban, CMDB Visualizer)
  ├── /portal    (Self-Service Portal: Catalog, 6-Tier CAD Floorplan Booking, 90-Day Status)
  └── /studio    (Studio Low-Code Workbench: Monaco Editor, Schema Builder, Update Sets)
         │
         ▼ (HTTP / SSE / JSON)
[Tier 2: Edge Session & Route Guard]
  └── middleware.ts (Pure Web Crypto HMAC-SHA256, Sliding Sessions, Anti-Spoofing)
         │
         ▼
[Tier 3: Core Application & Sandboxing Engines]
  ├── /api/now/table/[table] (Generic Table REST API & Query Parser)
  ├── /api/now/search         (Multi-Domain Command Palette Search)
  ├── /api/now/spatial/tree   (6-Tier Recursive Workplace Topology)
  ├── QuickJS WASM Sandbox    (Isolated 32MB Memory Heap, Prototype Pollution Defense)
  └── Hermes Flow Engine      (Trigger & Action State Machine)
         │
         ▼
[Tier 4: Enterprise Persistence & Background Daemons]
  ├── PostgreSQL 16 Cluster   (40+ Relational Tables, Cascades, Global Hash Omission)
  └── src/worker.ts           (15s Polling Scheduler & SLA Escalation Daemon)
```

---

## 2. Multi-Entry Points & Persona Matrix

| Surface | Allowed Roles | Primary Workflows | Key Usability Tools |
|---|---|---|---|
| `/workspace` | `admin`, `itil`, `cab_approver` | Incident response, Change approvals, Problem root cause, CMDB topology | Dockable Tabs, SLA Meters, Quick Filter Presets, RFC 4180 CSV Export, Canned Macros |
| `/portal` | `employee`, `itil`, `admin` | Hardware catalog orders, Space CAD picking, Knowledge base FAQs, Status | 3-View Room Booking, Shopping Cart, Spotlight Search (`Cmd+K`) |
| `/studio` | `admin` | Custom schema creation, Business rules, Monaco IDE, Update Set ALM commits | Data Dictionary, Code Runner, Preview Collision Diff |

---

## 3. Security Invariants
1. **Password Hash Omission**: Globally enforced via `omit: { user: { passwordHash: true } }` in `src/lib/db.ts`.
2. **System Table Protection**: Non-read requests to `sys_*` tables default to DENY for non-administrators.
3. **Persona Segregation**: Plain employee sessions cannot query CMDB infrastructure or internal ITIL queues.
4. **WASM Execution Boundary**: Untrusted scripts execute strictly inside `quickjs-emscripten` guest memory; host process APIs (`process`, `fs`, `eval`) are physically inaccessible.
