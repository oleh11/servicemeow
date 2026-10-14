import { describe, it, expect } from "vitest";
import { getNavigationLinks } from "../src/lib/navigation";

describe("Role-Based Persona Navigation Segregation", () => {
  it("gives regular employees zero fulfiller links and full self-service options", () => {
    const employeeUser = { id: "emp-1", role: "employee", name: "Alex Chen" };
    const links = getNavigationLinks(employeeUser);

    const hrefs = links.map((l) => l.href);
    const labels = links.map((l) => l.label);

    // Verify employee has pure self-service links
    expect(hrefs).toContain("/portal");
    expect(hrefs).toContain("/portal/catalog");
    expect(hrefs).toContain("/portal/reservations");
    expect(hrefs).toContain("/portal/my-tickets");
    expect(hrefs).toContain("/portal/knowledge");
    expect(hrefs).toContain("/portal/status");

    // CRITICAL: Employees must NEVER see fulfiller-only CMDB or Agent Workspace
    expect(hrefs).not.toContain("/workspace");
    expect(hrefs).not.toContain("/workspace/cmdb");
    expect(hrefs).not.toContain("/studio");

    expect(labels).not.toContain("Agent Workspace");
    expect(labels).not.toContain("CMDB Topology");
    expect(labels).not.toContain("Studio & Admin Center");
  });

  it("gives fulfillers (itil) access to agent workspace and CMDB topology", () => {
    const itilUser = { id: "itil-1", role: "itil", name: "Sarah Jenkins" };
    const links = getNavigationLinks(itilUser);

    const hrefs = links.map((l) => l.href);

    expect(hrefs).toContain("/workspace");
    expect(hrefs).toContain("/workspace/reservations");
    expect(hrefs).toContain("/workspace/cmdb");
    expect(hrefs).toContain("/portal");
    expect(hrefs).not.toContain("/studio");
  });

  it("gives administrators access to fulfiller links plus Studio & Admin Center", () => {
    const adminUser = { id: "admin-1", role: "admin", name: "System Administrator" };
    const links = getNavigationLinks(adminUser);

    const hrefs = links.map((l) => l.href);

    expect(hrefs).toContain("/workspace");
    expect(hrefs).toContain("/workspace/reservations");
    expect(hrefs).toContain("/workspace/cmdb");
    expect(hrefs).toContain("/portal");
    expect(hrefs).toContain("/studio");
  });

  it("hides Studio from admin when impersonating an employee", () => {
    // When impersonating an employee, role is employee
    const impersonatedUser = { id: "emp-2", role: "employee", name: "Impersonated Employee" };
    const links = getNavigationLinks(impersonatedUser, true);

    const hrefs = links.map((l) => l.href);
    expect(hrefs).toContain("/portal");
    expect(hrefs).toContain("/portal/reservations");
    expect(hrefs).not.toContain("/workspace");
    expect(hrefs).not.toContain("/workspace/cmdb");
    expect(hrefs).not.toContain("/studio");
  });
});
