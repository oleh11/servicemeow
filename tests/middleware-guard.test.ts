import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let currentSession: any = null;
vi.mock("../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/auth")>();
  return {
    ...actual,
    getServerSession: vi.fn(async () => currentSession),
  };
});

import { middleware } from "../src/middleware";

function sessionFor(role: string, opts: { impersonating?: boolean } = {}) {
  const user = { id: `${role}-id`, role };
  return {
    session: { id: "sess-1" },
    user,
    actualUser: opts.impersonating ? { id: "admin-id", role: "admin" } : user,
    isImpersonating: !!opts.impersonating,
    primaryRole: role,
    roles: [role],
    isAdmin: role === "admin",
  };
}

async function call(method: string, path: string, headers: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, "http://localhost:3000"), { method, headers });
  return middleware(req);
}

describe("middleware API guard", () => {
  beforeEach(() => {
    currentSession = null;
  });

  it("rejects unauthenticated API calls", async () => {
    const res = await call("GET", "/api/now/table/incident");
    expect(res.status).toBe(401);
  });

  it("allows public API routes without a session", async () => {
    const res = await call("POST", "/api/auth/login");
    expect(res.status).toBe(200);
  });

  describe("record producers (server-side scripts)", () => {
    it("blocks non-admin create", async () => {
      currentSession = sessionFor("employee");
      expect((await call("POST", "/api/now/producers")).status).toBe(403);
      currentSession = sessionFor("itil");
      expect((await call("POST", "/api/now/producers")).status).toBe(403);
    });

    it("blocks non-admin update/delete", async () => {
      currentSession = sessionFor("itil");
      expect((await call("PATCH", "/api/now/producers/abc")).status).toBe(403);
      expect((await call("DELETE", "/api/now/producers/abc")).status).toBe(403);
      expect((await call("POST", "/api/now/producers/abc/variable")).status).toBe(403);
    });

    it("lets employees read and submit producers", async () => {
      currentSession = sessionFor("employee");
      expect((await call("GET", "/api/now/producers/abc")).status).toBe(200);
      expect((await call("POST", "/api/now/producers/abc/submit")).status).toBe(200);
    });

    it("lets admins create producers", async () => {
      currentSession = sessionFor("admin");
      expect((await call("POST", "/api/now/producers")).status).toBe(200);
    });
  });

  it("blocks non-admin writes to catalog items and apps but allows reads", async () => {
    currentSession = sessionFor("itil");
    expect((await call("POST", "/api/now/catalog/item")).status).toBe(403);
    expect((await call("POST", "/api/now/catalog/item/variable")).status).toBe(403);
    expect((await call("DELETE", "/api/now/apps/x")).status).toBe(403);
    expect((await call("GET", "/api/now/catalog/item")).status).toBe(200);
    expect((await call("GET", "/api/now/apps")).status).toBe(200);
  });

  it("blocks non-admin access to admin config APIs", async () => {
    currentSession = sessionFor("itil");
    expect((await call("POST", "/api/now/scheduled-jobs")).status).toBe(403);
    expect((await call("GET", "/api/now/script-includes")).status).toBe(403);
  });

  it("an admin impersonating a non-admin is not treated as admin", async () => {
    currentSession = sessionFor("employee", { impersonating: true });
    expect((await call("POST", "/api/now/scheduled-jobs")).status).toBe(403);
  });

  it("strips client-supplied identity headers", async () => {
    currentSession = null;
    const res = await call("GET", "/api/health", { "x-auth-role": "admin", "x-auth-user-id": "evil" });
    // NextResponse.next() forwards overridden request headers via x-middleware-override-headers
    const overridden = res.headers.get("x-middleware-override-headers") || "";
    expect(res.headers.get("x-middleware-request-x-auth-role")).toBeNull();
    expect(overridden.includes("x-auth-role")).toBe(false);
  });

  describe("workspace and portal route persona segregation", () => {
    it("redirects regular employees from /workspace to /portal", async () => {
      currentSession = sessionFor("employee");
      const res = await call("GET", "/workspace");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/portal");
    });

    it("redirects regular employees from /workspace/cmdb to /portal", async () => {
      currentSession = sessionFor("employee");
      const res = await call("GET", "/workspace/cmdb");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/portal");
    });

    it("allows fulfillers (itil) to access /workspace", async () => {
      currentSession = sessionFor("itil");
      const res = await call("GET", "/workspace");
      expect(res.status).toBe(200);
    });

    it("requires authentication for /portal/reservations", async () => {
      currentSession = null;
      const res = await call("GET", "/portal/reservations");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("allows authenticated employees to access /portal/reservations", async () => {
      currentSession = sessionFor("employee");
      const res = await call("GET", "/portal/reservations");
      expect(res.status).toBe(200);
    });

    it("allows workplace_admin to access /studio and /workspace", async () => {
      currentSession = sessionFor("workplace_admin");
      const studioRes = await call("GET", "/studio");
      expect(studioRes.status).toBe(200);

      const workspaceRes = await call("GET", "/workspace");
      expect(workspaceRes.status).toBe(200);
    });

    it("allows catalog_admin to write to catalog item APIs", async () => {
      currentSession = sessionFor("catalog_admin");
      const res = await call("POST", "/api/now/catalog/item");
      expect(res.status).toBe(200);
    });

    it("blocks standard employee without modular admin from accessing /studio", async () => {
      currentSession = sessionFor("employee");
      const res = await call("GET", "/studio");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("studio_admin_required");
    });
  });
});

