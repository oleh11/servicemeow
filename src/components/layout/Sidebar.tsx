"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Building2,
  MapPin,
  Map,
  Calendar,
  PanelLeftOpen,
  PanelLeftClose,
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
  Building2,
  MapPin,
  Map,
  Table,
  Calendar,
};

function resolveIcon(name?: string, fallback: any = Layers) {
  if (!name) return fallback;
  return ICON_LOOKUP[name] || fallback;
}

export function Sidebar() {
  const pathname = usePathname();
  const { layoutMode, setLayoutMode, currentThemeDef } = useTheme();
  const { currentUser } = useUser();
  const isAdmin = currentUser.role === "admin";
  const [customTables, setCustomTables] = useState<any[]>([]);
  const [navApplications, setNavApplications] = useState<any[]>([]);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [pinnedSection, setPinnedSection] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openFlyout = (sectionTitle: string, top: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredSection(sectionTitle);
    setFlyoutTop(top);
  };

  const scheduleClose = () => {
    if (pinnedSection) return; // Keep pinned open if user clicked to pin
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredSection(null);
    }, 350); // 350ms grace period so users can comfortably move to items without closing
  };

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sidebar-flyout]") && !target.closest("[data-sidebar-rail-item]")) {
        setHoveredSection(null);
        setPinnedSection(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close flyout on route navigation
  useEffect(() => {
    setHoveredSection(null);
    setPinnedSection(null);
  }, [pathname]);

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
      title: "Agile Management",
      icon: Kanban,
      items: [
        { label: "Agile Sprint Board", href: "/workspace/agile", icon: Kanban, badge: "New" },
        { label: "User Stories (rm_story)", href: "/workspace/rm_story" },
        { label: "Sprints (rm_sprint)", href: "/workspace/rm_sprint" },
        { label: "Epics (rm_epic)", href: "/workspace/rm_epic" },
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
      title: "Workplace Hub",
      icon: Building2,
      items: [
        { label: "Room & Desk Reservations", href: "/workspace/reservations", icon: Calendar, badge: "New" },
        { label: "Spatial Explorer", href: "/workspace/spaces", icon: Compass },
        { label: "All Reservations", href: "/workspace/cmn_reservation", icon: Calendar },
        { label: "Regions (Tier 1)", href: "/workspace/cmn_region", icon: Map },
        { label: "States / Prov (Tier 2)", href: "/workspace/cmn_state", icon: MapPin },
        { label: "Campuses (Tier 3)", href: "/workspace/cmn_campus", icon: Building2 },
        { label: "Buildings (Tier 4)", href: "/workspace/cmn_building", icon: Building2 },
        { label: "Floors & Levels (Tier 5)", href: "/workspace/cmn_floor", icon: Layers },
        { label: "Spaces & Rooms (Tier 6)", href: "/workspace/cmn_space", icon: Box },
        { label: "Unified Locations", href: "/workspace/cmn_location", icon: MapPin },
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

  const workplaceSection: SidebarSection = {
    title: "Workplace Hub",
    icon: Building2,
    items: [
      { label: "Room & Desk Reservations", href: "/workspace/reservations", icon: Calendar, badge: "New" },
      { label: "Spatial Explorer", href: "/workspace/spaces", icon: Compass },
      { label: "All Reservations", href: "/workspace/cmn_reservation", icon: Calendar },
      { label: "Regions (Tier 1)", href: "/workspace/cmn_region", icon: Map },
      { label: "States / Prov (Tier 2)", href: "/workspace/cmn_state", icon: MapPin },
      { label: "Campuses (Tier 3)", href: "/workspace/cmn_campus", icon: Building2 },
      { label: "Buildings (Tier 4)", href: "/workspace/cmn_building", icon: Building2 },
      { label: "Floors & Levels (Tier 5)", href: "/workspace/cmn_floor", icon: Layers },
      { label: "Spaces & Rooms (Tier 6)", href: "/workspace/cmn_space", icon: Box },
      { label: "Unified Locations", href: "/workspace/cmn_location", icon: MapPin },
    ],
  };

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
      { label: "Workplace & Reservations Config", href: "/studio?tab=workplace", icon: Building2 },
    ],
  };

  const hasWorkplaceInNav = navApplications.some((app) =>
    app.title?.toLowerCase().includes("workplace") || app.title?.toLowerCase().includes("spatial")
  );

  const sections: SidebarSection[] = [
    ...(navApplications.length > 0 ? dynamicSections : fallbackCoreSections),
    ...(navApplications.length > 0 && !hasWorkplaceInNav ? [workplaceSection] : []),
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

  const getPrimaryHref = (section: SidebarSection) => {
    if (section.title === "Admin Configuration Suite") return "/studio";
    if (section.title === "Incident Management") return "/workspace/incident";
    if (section.title === "Change Management") return "/workspace/change_request";
    if (section.title === "Problem Management") return "/workspace/problem";
    if (section.title === "Service Catalog Tasks") return "/workspace/sc_task";
    if (section.title === "Configuration & CMDB") return "/workspace/cmdb";
    if (section.title === "Workplace Hub" || section.title === "Connected Workplace") return "/workspace/reservations";
    if (section.title === "Knowledge Management") return "/portal/knowledge";
    if (section.title === "Agent Workspace") return "/workspace";
    return section.items[0]?.href || "/workspace";
  };

  // COMPACT RAIL MODE (M3 Navigation Rail with unclipped fixed popover flyouts)
  if (layoutMode === "compact_rail") {
    return (
      <aside
        className="w-20 border-r flex flex-col shrink-0 min-h-[calc(100vh-4rem)] items-center py-4 select-none relative z-30 transition-all justify-between"
        style={{
          backgroundColor: currentThemeDef.colors.sidebarBg,
          borderColor: currentThemeDef.colors.sidebarBorder,
          color: currentThemeDef.colors.sidebarText,
        }}
      >
        <div className="w-full flex flex-col items-center">
          {/* Logo Button - Click to Home */}
          <Link
            href="/workspace"
            className="w-10 h-10 rounded-full flex items-center justify-center mb-5 font-bold shadow-xs transition-transform hover:scale-105 cursor-pointer shrink-0"
            style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
            title="ServiceMeow Operations Center (Workspace Home)"
          >
            <Cat className="w-5 h-5 text-white" />
          </Link>

          {/* Navigation Icons List */}
          <div className="w-full flex flex-col items-center space-y-2.5 px-1.5">
            {sections.map((section) => {
              const Icon = section.icon;
              const primaryHref = getPrimaryHref(section);
              const hasActiveChild = section.items.some((item) => {
                const cleanItem = item.href.split("?")[0];
                if (cleanItem === "/workspace") return pathname === "/workspace";
                return pathname === item.href || (cleanItem !== "/" && pathname.startsWith(cleanItem));
              });
              const isMenuVisible = hoveredSection === section.title || pinnedSection === section.title;

              return (
                <div
                  key={section.title}
                  data-sidebar-rail-item={section.title}
                  className="relative group w-full flex justify-center"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    openFlyout(section.title, rect.top);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pinnedSection === section.title) {
                        setPinnedSection(null);
                        setHoveredSection(null);
                      } else {
                        setPinnedSection(section.title);
                        const rect = e.currentTarget.getBoundingClientRect();
                        openFlyout(section.title, rect.top);
                      }
                    }}
                    className={`w-12 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                      hasActiveChild || isMenuVisible
                        ? "shadow-sm ring-1 ring-white/10"
                        : "opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: hasActiveChild || isMenuVisible ? currentThemeDef.colors.sidebarActiveBg : undefined,
                      color: hasActiveChild || isMenuVisible ? currentThemeDef.colors.sidebarActiveText : currentThemeDef.colors.sidebarText,
                    }}
                    title={`${section.title} - Click to open/pin menu`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </button>

                  {/* Floating Popout Flyout Menu (Unclipped, Fixed Viewport Position) */}
                  {isMenuVisible && (
                    <div
                      data-sidebar-flyout={section.title}
                      className="fixed left-[76px] w-64 rounded-[16px] shadow-2xl border p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                      style={{
                        top: Math.max(68, Math.min(flyoutTop, typeof window !== "undefined" ? window.innerHeight - 360 : 100)),
                        backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                        color: "var(--md-sys-color-on-surface, #1d1b20)",
                      }}
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                    >
                      {/* Invisible Hit Bridge to completely eliminate any hover dead-zone */}
                      <div className="absolute -left-6 top-0 bottom-0 w-6 pointer-events-auto" />

                      <div
                        className="px-3 py-1.5 text-[11px] font-bold border-b mb-1.5 flex items-center justify-between"
                        style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
                      >
                        <Link
                          href={primaryHref}
                          className="flex items-center gap-1.5 hover:underline"
                          style={{ color: currentThemeDef.colors.primary }}
                          onClick={() => {
                            setHoveredSection(null);
                            setPinnedSection(null);
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{section.title}</span>
                        </Link>
                        <Link
                          href={primaryHref}
                          className="text-[9px] font-mono opacity-60 hover:opacity-100 hover:underline uppercase"
                          onClick={() => {
                            setHoveredSection(null);
                            setPinnedSection(null);
                          }}
                        >
                          Open &rarr;
                        </Link>
                      </div>

                      <div className="space-y-0.5 max-h-80 overflow-y-auto">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href;
                          const ItemIcon = item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                setHoveredSection(null);
                                setPinnedSection(null);
                              }}
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
        </div>

        {/* Bottom Rail Action: Expand to Full Sidebar */}
        <div
          className="w-full pt-3 pb-2 border-t flex flex-col items-center shrink-0 mt-auto"
          style={{ borderColor: currentThemeDef.colors.sidebarBorder }}
        >
          <button
            onClick={() => setLayoutMode("sidebar")}
            className="w-10 h-10 rounded-full flex items-center justify-center opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            style={{ color: currentThemeDef.colors.sidebarText }}
            title="Expand to Full Sidebar with Text Labels"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
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
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: currentThemeDef.colors.sidebarActiveBg,
              color: currentThemeDef.colors.sidebarActiveText,
            }}
          >
            {isFloating ? "Floating Dock" : "ITIL"}
          </span>
          <button
            onClick={() => setLayoutMode("compact_rail")}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
            style={{ color: currentThemeDef.colors.sidebarText }}
            title="Collapse to Compact Icon Rail"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
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
