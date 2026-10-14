"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  AlertCircle,
  GitPullRequest,
  HelpCircle,
  CheckSquare,
  Server,
  BookOpen,
  PlusCircle,
  FileText,
  ChevronRight,
  Settings,
  Users,
  Sparkles,
  Workflow,
  Cat,
  FileCode,
  Shield,
  Layers,
  Bot,
  Table,
  BarChart3,
  LayoutDashboard,
  Activity,
  UploadCloud,
  Package,
  Code,
  Kanban,
  CheckCircle2,
  FileCheck,
  Box,
  Compass,
} from "lucide-react";

import { useUser } from "@/lib/user-context";

interface SidebarItem {
  label: string;
  href: string;
  count?: string;
  badge?: string;
  icon?: any;
}

interface SidebarSection {
  title: string;
  icon: any;
  items: SidebarItem[];
}

const ICON_LOOKUP: Record<string, any> = {
  LayoutDashboard,
  BarChart3,
  Activity,
  Kanban,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  GitPullRequest,
  HelpCircle,
  CheckSquare,
  Server,
  BookOpen,
  FileText,
  FileCheck,
  Shield,
  Layers,
  Box,
  Compass,
  Table,
};

function resolveIcon(name?: string, fallback: any = Layers) {
  if (!name) return fallback;
  return ICON_LOOKUP[name] || fallback;
}

export function Sidebar() {
  const pathname = usePathname();
  const { layoutMode, currentThemeDef } = useTheme();
  const { currentUser } = useUser();
  const isAdmin = currentUser.role === "admin";
  const [customTables, setCustomTables] = useState<any[]>([]);
  const [navApplications, setNavApplications] = useState<any[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/now/navigation/applications")
      .then((r) => r.json())
      .then((data) => {
        if (data.result && Array.isArray(data.result) && data.result.length > 0) {
          setNavApplications(data.result);
        }
      })
      .catch((err) => console.error("Error loading navigation applications:", err));

    fetch("/api/now/schema")
      .then((r) => r.json())
      .then((data) => {
        if (data.result && Array.isArray(data.result)) {
          const custom = data.result.filter((t: any) => t.isCustom || t.name.startsWith("u_"));
          setCustomTables(custom);
        }
      })
      .catch((err) => console.error("Error loading custom tables for sidebar:", err));
  }, [pathname]);

  const dynamicSections: SidebarSection[] = navApplications
    .filter((app) => {
      if (isAdmin) return true;
      if (!app.roles || app.roles === "public") return true;
      const allowedRoles = app.roles.split(",").map((r: string) => r.trim());
      const userRoles = [currentUser.role, ...(currentUser.effectiveRoles || [])];
      return allowedRoles.some((r: string) => userRoles.includes(r));
    })
    .map((app) => ({
      title: app.title,
      icon: resolveIcon(app.icon, Layers),
      items: (app.modules || []).map((m: any) => {
        let href = m.url || "#";
        if (m.linkType === "list") {
          href = `/workspace/${m.tableName || "task"}${
            m.filterQuery ? `?sysparm_query=${encodeURIComponent(m.filterQuery)}` : ""
          }`;
        } else if (m.linkType === "new") {
          href = `/workspace/${m.tableName || "task"}/new`;
        }

        return {
          label: m.title,
          href,
          icon: m.icon ? resolveIcon(m.icon, undefined) : undefined,
        };
      }),
    }));

  const fallbackCoreSections: SidebarSection[] = [
    {
      title: "Agent Workspace",
      icon: LayoutDashboard,
      items: [
        { label: "Executive Dashboards", href: "/workspace/dashboard", icon: BarChart3 },
        { label: "Operations Center", href: "/workspace", icon: Activity },
        { label: "Visual Task Board (VTB)", href: "/workspace/task-board", icon: Kanban },
        { label: "Approvals Hub", href: "/workspace/approvals", icon: CheckCircle2 },
        { label: "Service Health & Status", href: "/workspace/status", icon: Activity },
      ],
    },
    {
      title: "Incident Management",
      icon: AlertCircle,
      items: [
        { label: "All Incidents", href: "/workspace/incident", count: "3" },
        { label: "Critical Incidents (P1)", href: "/workspace/incident?priority=1", count: "1", badge: "bg-red-500 text-white" },
        { label: "New Incident", href: "/workspace/incident/new", icon: PlusCircle },
      ],
    },
    {
      title: "Change Management",
      icon: GitPullRequest,
      items: [
        { label: "All Changes", href: "/workspace/change_request" },
        { label: "CAB Pending Review", href: "/workspace/change_request?cab=requested", badge: "bg-amber-500 text-white" },
        { label: "New Change Request", href: "/workspace/change_request/new", icon: PlusCircle },
      ],
    },
    {
      title: "Problem Management",
      icon: HelpCircle,
      items: [
        { label: "All Problems", href: "/workspace/problem" },
        { label: "Known Error Database", href: "/workspace/problem?known_error=true" },
      ],
    },
    {
      title: "Service Catalog Tasks",
      icon: CheckSquare,
      items: [
        { label: "Fulfillment Tasks", href: "/workspace/sc_task" },
        { label: "Catalog Portal", href: "/portal/catalog" },
      ],
    },
    {
      title: "Configuration & CMDB",
      icon: Server,
      items: [
        { label: "Interactive Topology", href: "/workspace/cmdb" },
        { label: "All Configuration Items", href: "/workspace/cmdb_ci" },
        { label: "Datacenter Rack Elevations", href: "/workspace/cmdb/racks", icon: Server },
        { label: "ITAM Contracts & Leases", href: "/workspace/contracts", icon: FileCheck },
      ],
    },
    {
      title: "Knowledge Management",
      icon: BookOpen,
      items: [
        { label: "Browse Knowledge Base", href: "/portal/knowledge" },
      ],
    },
  ];

  const adminSection: SidebarSection = {
    title: "Admin Configuration Suite",
    icon: Settings,
    items: [
      { label: "Schema Dictionary (sys_dictionary)", href: "/studio?tab=schema", icon: FileCode },
      { label: "Custom Applications (sys_app)", href: "/studio?tab=apps", icon: Box },
      { label: "Application Menus & Modules", href: "/studio?tab=navigation", icon: Layers },
      { label: "Access Control (sys_security_acl)", href: "/studio?tab=acls", icon: Shield },
      { label: "User Management (sys_user)", href: "/studio?tab=users&sub=users", icon: Users },
      { label: "Group Management (sys_user_group)", href: "/studio?tab=users&sub=groups", icon: Users },
      { label: "Business Rules (sys_script)", href: "/studio?tab=business_rules", icon: FileText },
      { label: "Client Scripts (sys_script_client)", href: "/studio?tab=client_scripts", icon: Code },
      { label: "UI Policies (sys_ui_policy)", href: "/studio?tab=ui_policies", icon: Sparkles },
      { label: "Flow Designer (sys_hub_flow)", href: "/studio?tab=flows", icon: Workflow },
      { label: "Import Sets & Transforms", href: "/studio?tab=import_sets", icon: UploadCloud },
      { label: "Update Sets (sys_update_set)", href: "/studio?tab=update_sets", icon: Package },
      { label: "Workflow Agent (Daemon)", href: "/studio?tab=agent", icon: Bot },
    ],
  };

  const sections: SidebarSection[] = [
    ...(navApplications.length > 0 ? dynamicSections : fallbackCoreSections),
    ...(customTables.length > 0 && navApplications.length === 0
      ? [
          {
            title: "Custom Applications / Tables",
            icon: Layers,
            items: customTables.map((t) => ({
              label: t.label,
              href: `/workspace/${t.name}`,
              icon: Table,
            })),
          },
        ]
      : []),
    ...(isAdmin ? [adminSection] : []),
  ];

  // COMPACT RAIL MODE (M3 Navigation Rail with popover flyouts)
  if (layoutMode === "compact_rail") {
    return (
      <aside
        className="w-20 border-r flex flex-col shrink-0 min-h-[calc(100vh-4rem)] items-center py-4 select-none relative z-30 transition-all"
        style={{
          backgroundColor: currentThemeDef.colors.sidebarBg,
          borderColor: currentThemeDef.colors.sidebarBorder,
          color: currentThemeDef.colors.sidebarText,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-5 font-bold shadow-xs transition-transform hover:scale-105"
          style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
          title="ServiceMeow Application Rail"
        >
          <Cat className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto px-1.5 scrollbar-none">
          {sections.map((section) => {
            const Icon = section.icon;
            const hasActiveChild = section.items.some((item) => pathname === item.href);
            const isHovered = hoveredSection === section.title;

            return (
              <div
                key={section.title}
                className="relative group w-full flex justify-center"
                onMouseEnter={() => setHoveredSection(section.title)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <button
                  className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${
                    hasActiveChild
                      ? "shadow-xs"
                      : "opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  style={{
                    backgroundColor: hasActiveChild ? currentThemeDef.colors.sidebarActiveBg : undefined,
                    color: hasActiveChild ? currentThemeDef.colors.sidebarActiveText : currentThemeDef.colors.sidebarText,
                  }}
                  title={section.title}
                >
                  <Icon className="w-4 h-4" />
                </button>

                {/* Floating Popout Flyout Menu (M3 Menu Card: rounded-[16px]) */}
                {isHovered && (
                  <div
                    className="absolute left-16 top-0 w-64 rounded-[16px] shadow-xl border p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-100"
                    style={{
                      backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
                      borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      color: "var(--md-sys-color-on-surface, #1d1b20)",
                    }}
                  >
                    <div
                      className="px-3 py-1.5 text-[11px] font-bold border-b mb-1.5 flex items-center justify-between"
                      style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" style={{ color: currentThemeDef.colors.primary }} />
                        <span>{section.title}</span>
                      </span>
                    </div>

                    <div className="space-y-0.5 max-h-80 overflow-y-auto">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-full text-xs transition-colors ${
                              isActive
                                ? "font-semibold shadow-xs"
                                : "hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                            style={{
                              backgroundColor: isActive ? currentThemeDef.colors.sidebarActiveBg : undefined,
                              color: isActive ? currentThemeDef.colors.sidebarActiveText : undefined,
                            }}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              {ItemIcon ? (
                                <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              ) : (
                                <ChevronRight className="w-2.5 h-2.5 shrink-0 opacity-50" />
                              )}
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge ? (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badge}`}>
                                !
                              </span>
                            ) : item.count ? (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                                style={{
                                  backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                                  color: "var(--md-sys-color-on-surface-variant, #49454f)",
                                }}
                              >
                                {item.count}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  // FLOATING DOCK OR STANDARD M3 NAVIGATION DRAWER
  const isFloating = layoutMode === "floating_dock";

  return (
    <aside
      className={`flex flex-col shrink-0 select-none transition-all ${
        isFloating
          ? "w-72 my-4 ml-4 rounded-[28px] border shadow-xl min-h-[calc(100vh-6rem)]"
          : "w-72 border-r min-h-[calc(100vh-4rem)]"
      }`}
      style={{
        backgroundColor: currentThemeDef.colors.sidebarBg,
        borderColor: currentThemeDef.colors.sidebarBorder,
        color: currentThemeDef.colors.sidebarText,
      }}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 text-xs font-bold uppercase tracking-wider border-b flex items-center justify-between ${
          isFloating ? "rounded-t-[28px]" : ""
        }`}
        style={{
          borderColor: currentThemeDef.colors.sidebarBorder,
          color: currentThemeDef.colors.sidebarText,
        }}
      >
        <span className="flex items-center gap-2">
          <Cat className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
          <span>Application Navigator</span>
        </span>
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: currentThemeDef.colors.sidebarActiveBg,
            color: currentThemeDef.colors.sidebarActiveText,
          }}
        >
          {isFloating ? "Floating Dock" : "ITIL"}
        </span>
      </div>

      {/* Sections & Navigation Items (M3 Navigation Drawer: rounded-full pills) */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div
              className="px-3 py-1 text-xs font-semibold flex items-center space-x-2"
              style={{ color: currentThemeDef.colors.sidebarText, opacity: 0.75 }}
            >
              <section.icon className="w-3.5 h-3.5" style={{ color: currentThemeDef.colors.primary }} />
              <span className="truncate">{section.title}</span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs rounded-full transition-all ${
                      isActive
                        ? "font-semibold shadow-xs"
                        : "hover:bg-black/5 dark:hover:bg-white/5 opacity-90 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: isActive ? currentThemeDef.colors.sidebarActiveBg : undefined,
                      color: isActive ? currentThemeDef.colors.sidebarActiveText : currentThemeDef.colors.sidebarText,
                    }}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      {Icon ? (
                        <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      ) : (
                        <ChevronRight className="w-2.5 h-2.5 opacity-40 shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badge}`}>
                        !
                      </span>
                    ) : item.count ? (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                        style={{
                          backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                          color: "var(--md-sys-color-on-surface-variant, #49454f)",
                        }}
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
