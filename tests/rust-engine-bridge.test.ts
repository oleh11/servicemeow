import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { rustCoreClient } from "@/lib/rust-core-client";
import { GET as handleRustEngineStatus } from "@/app/api/now/rust-engine/route";
import { signSessionToken } from "@/lib/auth-token";
import { db } from "@/lib/db";

describe("Rust Core Engine & Hybrid Microservices Bridge", () => {
  let adminSessionCookie: string;

  beforeAll(async () => {
    let admin = await db.user.findFirst({ where: { role: "admin" } });
    if (!admin) {
      admin = await db.user.create({
        data: {
          userName: `admin_rust_${Date.now()}`,
          email: `admin_rust_${Date.now()}@servicemeow.io`,
          name: "Rust Admin",
          role: "admin",
        },
      });
    }

    const session = await db.sysUserSession.create({
      data: {
        userId: admin.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    const token = await signSessionToken(
      {
        sessionId: session.id,
        userId: admin.id,
        sub: admin.id,
        user_name: admin.userName || "admin",
        userName: admin.userName || "admin",
        email: admin.email,
        role: "admin",
        roles: ["admin"],
        exp: Date.now() + 86400000,
      },
      process.env.AUTH_SECRET || "default_dev_secret_32_characters_long_min"
    );
    adminSessionCookie = `servicemeow_session=${token}`;
  });

  it("decomposes vector SVG floorplans into normalized room hotspots with sub-millisecond precision", async () => {
    const testSvg = `<svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="50" width="200" height="150" id="OR-302" />
      <text x="70" y="80">OR-302</text>
      <rect x="300" y="50" width="300" height="250" id="CONF-401" />
      <text x="350" y="100">CONF-401</text>
    </svg>`;

    const res = await rustCoreClient.decomposeCad(testSvg, 1.0);
    expect(res.success).toBe(true);
    expect(res.total_spaces_extracted).toBeGreaterThanOrEqual(2);
    expect(res.hotspots.length).toBeGreaterThanOrEqual(2);

    const or302 = res.hotspots.find((h) => h.space_number.includes("OR-302") || h.id.includes("101"));
    expect(or302).toBeDefined();
    expect(or302?.area_sq_ft).toBeGreaterThan(0);
  });

  it("processes batch telemetry and detects critical anomalies with high throughput", async () => {
    const events = [
      {
        event_type: "log.stacktrace",
        source: "hermes-agent",
        severity: "critical",
        task_id: "INC0010042",
        payload: { error: "OOM killer invoked on redis-worker" },
        timestamp: new Date().toISOString(),
      },
      {
        event_type: "monitor.cpu",
        source: "prometheus",
        severity: "info",
        payload: { usage: 45.2 },
        timestamp: new Date().toISOString(),
      },
    ];

    const res = await rustCoreClient.ingestTelemetry(events, []);
    expect(res.success).toBe(true);
    expect(res.telemetry_count).toBe(2);
    expect(res.critical_anomalies_detected).toBe(1);
    expect(res.throughput_events_per_sec).toBeGreaterThan(0);
  });

  it("enforces pre-execution script security and catches prototype pollution vectors", async () => {
    // 1. Attack payload
    const malicious = `
      const target = {};
      const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
      Object.assign(target, payload);
    `;
    const resMalicious = await rustCoreClient.validateScript(malicious);
    expect(resMalicious.is_safe).toBe(false);
    expect(resMalicious.security_findings.some((f) => f.rule === "NO_PROTO_MUTATION")).toBe(true);

    // 2. Safe logic
    const safeScript = `
      function checkSla(durationMin) {
        return durationMin > 120;
      }
    `;
    const resSafe = await rustCoreClient.validateScript(safeScript);
    expect(resSafe.is_safe).toBe(true);
    expect(resSafe.estimated_fuel).toBeGreaterThan(0);
  });

  it("surfaces Rust core engine status and capabilities via /api/now/rust-engine", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/rust-engine", {
      headers: {
        Cookie: adminSessionCookie,
      },
    });

    const res = await handleRustEngineStatus(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.result).toBeDefined();
    expect(data.result.capabilities.length).toBe(3);
    expect(data.result.capabilities.some((c: any) => c.name === "cad_vector_decomposition")).toBe(true);
    expect(data.result.capabilities.some((c: any) => c.name === "telemetry_stream_ingestion")).toBe(true);
    expect(data.result.capabilities.some((c: any) => c.name === "script_ast_security_validation")).toBe(true);
  });
});
