import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory stand-in for the Prisma client used by the ACL engine.
const state: { acls: any[] } = { acls: [] };
vi.mock("../src/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(async () => null) },
    sysSecurityAcl: {
      findMany: vi.fn(async ({ where }: any) =>
        state.acls.filter(
          (a) => a.active && where.tableName.in.includes(a.tableName) && where.operation.in.includes(a.operation)
        )
      ),
    },
  },
}));

import { evaluateAcl } from "../src/lib/acl-engine";

const acl = (tableName: string, operation: string, roleRequired: string) => ({
  name: `${tableName}.${operation}`,
  tableName,
  operation,
  roleRequired,
  fieldName: null,
  active: true,
});

describe("ACL engine: system tables are default-deny for writes", () => {
  beforeEach(() => {
    state.acls = [];
  });

  for (const table of ["sys_user", "sys_user_group", "sys_user_grmember", "sys_security_acl"]) {
    for (const op of ["write", "create", "delete"]) {
      it(`denies ${op} on ${table} for non-admins when no ACL exists`, async () => {
        const res = await evaluateAcl({ roles: ["employee"], operation: op, tableName: table });
        expect(res.allowed).toBe(false);
        const itil = await evaluateAcl({ roles: ["itil"], operation: op, tableName: table });
        expect(itil.allowed).toBe(false);
      });
    }
  }

  it("still allows reads of sys_user (reference fields need it)", async () => {
    const res = await evaluateAcl({ roles: ["employee"], operation: "read", tableName: "sys_user" });
    expect(res.allowed).toBe(true);
  });

  it("admins keep full access", async () => {
    const res = await evaluateAcl({ roles: ["admin"], operation: "write", tableName: "sys_user" });
    expect(res.allowed).toBe(true);
  });

  it("a wildcard '*' table ACL never grants writes to system tables", async () => {
    state.acls = [acl("*", "write", "employee")];
    const res = await evaluateAcl({ roles: ["employee"], operation: "write", tableName: "sys_user" });
    expect(res.allowed).toBe(false);
  });

  it("an explicit ACL on the system table is honored", async () => {
    state.acls = [acl("sys_user_group", "write", "itil")];
    const res = await evaluateAcl({ roles: ["itil"], operation: "write", tableName: "sys_user_group" });
    expect(res.allowed).toBe(true);
  });

  it("non-system tables keep default-allow behaviour", async () => {
    const res = await evaluateAcl({ roles: ["employee"], operation: "write", tableName: "u_custom_thing" });
    expect(res.allowed).toBe(true);
  });
});
