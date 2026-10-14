export interface NavigationLink {
  label: string;
  href: string;
  iconName: string;
}

export function getNavigationLinks(
  currentUser: { role: string; [key: string]: any },
  isImpersonating = false
): NavigationLink[] {
  const isEmployee = currentUser.role === "employee";
  const isAdmin = currentUser.role === "admin";

  if (isEmployee) {
    return [
      { label: "Employee Portal", href: "/portal", iconName: "Compass" },
      { label: "Service Catalog", href: "/portal/catalog", iconName: "ShoppingBag" },
      { label: "Book Room or Desk", href: "/portal/reservations", iconName: "Building2" },
      { label: "Track Requests", href: "/portal/my-tickets", iconName: "Ticket" },
      { label: "Knowledge Base", href: "/portal/knowledge", iconName: "BookOpen" },
      { label: "System Status", href: "/portal/status", iconName: "ShieldCheck" },
    ];
  }

  // Fulfiller and Admin Navigation
  return [
    { label: "Agent Workspace", href: "/workspace", iconName: "LayoutDashboard" },
    { label: "Workplace & Reservations", href: "/workspace/reservations", iconName: "Building2" },
    { label: "CMDB Topology", href: "/workspace/cmdb", iconName: "Server" },
    { label: "Self-Service Portal", href: "/portal", iconName: "Compass" },
    ...(isAdmin && !isImpersonating
      ? [{ label: "Studio & Admin Center", href: "/studio", iconName: "FileCode" }]
      : []),
  ];
}
