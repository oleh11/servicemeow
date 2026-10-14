import { describe, it, expect } from "vitest";
import { calculateEffectiveRoles } from "../src/lib/auth";

describe("Role Hierarchy & Aggregation Engine", () => {
  it("should expand admin role to inherit itil, cab_approver, employee, and public", () => {
    const roles = calculateEffectiveRoles("admin");
    expect(roles).toContain("admin");
    expect(roles).toContain("itil");
    expect(roles).toContain("cab_approver");
    expect(roles).toContain("employee");
    expect(roles).toContain("public");
  });

  it("should expand itil role to inherit employee and public", () => {
    const roles = calculateEffectiveRoles("itil");
    expect(roles).toContain("itil");
    expect(roles).toContain("employee");
    expect(roles).toContain("public");
    expect(roles).not.toContain("admin");
    expect(roles).not.toContain("cab_approver");
  });

  it("should combine secondary roles and group roles into effective roles", () => {
    const roles = calculateEffectiveRoles(
      "employee",
      "problem_manager,catalog_admin",
      ["change_manager,service_viewer"]
    );

    expect(roles).toContain("employee");
    expect(roles).toContain("public");
    expect(roles).toContain("problem_manager");
    expect(roles).toContain("catalog_admin");
    expect(roles).toContain("change_manager");
    expect(roles).toContain("service_viewer");
    expect(roles).not.toContain("admin");
  });

  it("should eliminate duplicates and empty entries", () => {
    const roles = calculateEffectiveRoles("employee", "employee, public, ,", ["employee"]);
    const employeeOccurrences = roles.filter((r) => r === "employee").length;
    expect(employeeOccurrences).toBe(1);
    expect(roles).not.toContain("");
  });
});
