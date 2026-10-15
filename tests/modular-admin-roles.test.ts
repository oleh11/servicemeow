import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateEffectiveRoles, isModularAdmin, MODULAR_ADMIN_ROLES } from "../src/lib/auth";
import { evaluateAcl, MODULAR_ADMIN_DOMAINS } from "../src/lib/acl-engine";

describe("Modular Administrator Delegated Roles & Domain Authority", () => {
  describe("Role Hierarchy & Inheritance", () => {
    it("should include all 5 modular admin roles in MODULAR_ADMIN_ROLES", () => {
      expect(MODULAR_ADMIN_ROLES).toContain("workplace_admin");
      expect(MODULAR_ADMIN_ROLES).toContain("catalog_admin");
      expect(MODULAR_ADMIN_ROLES).toContain("itil_admin");
      expect(MODULAR_ADMIN_ROLES).toContain("cmdb_admin");
      expect(MODULAR_ADMIN_ROLES).toContain("knowledge_admin");
      expect(MODULAR_ADMIN_ROLES).toContain("admin");
    });

    it("should allow platform admin to inherit all modular admin roles", () => {
      const adminRoles = calculateEffectiveRoles("admin");
      expect(adminRoles).toContain("admin");
      expect(adminRoles).toContain("workplace_admin");
      expect(adminRoles).toContain("catalog_admin");
      expect(adminRoles).toContain("itil_admin");
      expect(adminRoles).toContain("cmdb_admin");
      expect(adminRoles).toContain("knowledge_admin");
      expect(adminRoles).toContain("itil");
      expect(adminRoles).toContain("employee");
      expect(adminRoles).toContain("public");
    });

    it("should correctly identify modular admins with isModularAdmin helper", () => {
      expect(isModularAdmin("workplace_admin")).toBe(true);
      expect(isModularAdmin("catalog_admin")).toBe(true);
      expect(isModularAdmin("admin")).toBe(true);
      expect(isModularAdmin("employee")).toBe(false);
      expect(isModularAdmin("employee", ["workplace_admin"])).toBe(true);
      expect(isModularAdmin("employee", ["itil", "public"])).toBe(false);
    });

    it("should allow workplace_admin to inherit employee and public but not admin or itil", () => {
      const roles = calculateEffectiveRoles("workplace_admin");
      expect(roles).toContain("workplace_admin");
      expect(roles).toContain("employee");
      expect(roles).toContain("public");
      expect(roles).not.toContain("admin");
      expect(roles).not.toContain("itil");
    });

    it("should allow itil_admin to inherit itil, employee, and public", () => {
      const roles = calculateEffectiveRoles("itil_admin");
      expect(roles).toContain("itil_admin");
      expect(roles).toContain("itil");
      expect(roles).toContain("employee");
      expect(roles).toContain("public");
      expect(roles).not.toContain("admin");
    });
  });

  describe("Domain Table Authority Mapping", () => {
    it("should map spatial tables and reservations to workplace_admin", () => {
      const workplaceTables = MODULAR_ADMIN_DOMAINS["workplace_admin"];
      expect(workplaceTables).toContain("cmn_region");
      expect(workplaceTables).toContain("cmn_state");
      expect(workplaceTables).toContain("cmn_campus");
      expect(workplaceTables).toContain("cmn_building");
      expect(workplaceTables).toContain("cmn_floor");
      expect(workplaceTables).toContain("cmn_space");
      expect(workplaceTables).toContain("cmn_reservation");
      expect(workplaceTables).toContain("cmn_location");
    });

    it("should map catalog tables to catalog_admin", () => {
      const catalogTables = MODULAR_ADMIN_DOMAINS["catalog_admin"];
      expect(catalogTables).toContain("sc_cat_item");
      expect(catalogTables).toContain("sc_category");
      expect(catalogTables).toContain("sc_cat_item_producer");
      expect(catalogTables).toContain("item_option_new");
    });

    it("should map cmdb tables to cmdb_admin", () => {
      const cmdbTables = MODULAR_ADMIN_DOMAINS["cmdb_admin"];
      expect(cmdbTables).toContain("cmdb_ci");
      expect(cmdbTables).toContain("cmdb_rel_ci");
      expect(cmdbTables).toContain("cmdb_ci_rack");
    });
  });

  describe("ACL Evaluation for Delegated Modular Admins", () => {
    it("allows workplace_admin to perform write and delete on cmn_space", async () => {
      const resWrite = await evaluateAcl({
        role: "workplace_admin",
        operation: "write",
        tableName: "cmn_space",
      });
      expect(resWrite.allowed).toBe(true);
      expect(resWrite.reason).toContain("workplace_admin");

      const resDelete = await evaluateAcl({
        role: "workplace_admin",
        operation: "delete",
        tableName: "cmn_space",
      });
      expect(resDelete.allowed).toBe(true);
    });

    it("allows workplace_admin to manage cmn_floor and cmn_reservation", async () => {
      const resFloor = await evaluateAcl({
        role: "workplace_admin",
        operation: "write",
        tableName: "cmn_floor",
      });
      expect(resFloor.allowed).toBe(true);

      const resReservation = await evaluateAcl({
        role: "workplace_admin",
        operation: "write",
        tableName: "cmn_reservation",
      });
      expect(resReservation.allowed).toBe(true);
    });

    it("allows catalog_admin to manage sc_cat_item", async () => {
      const res = await evaluateAcl({
        role: "catalog_admin",
        operation: "write",
        tableName: "sc_cat_item",
      });
      expect(res.allowed).toBe(true);
      expect(res.reason).toContain("catalog_admin");
    });

    it("prevents workplace_admin from writing to security system tables without admin", async () => {
      const res = await evaluateAcl({
        role: "workplace_admin",
        operation: "write",
        tableName: "sys_security_acl",
      });
      expect(res.allowed).toBe(false);
    });
  });
});
