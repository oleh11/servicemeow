"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { useUser } from "@/lib/user-context";
import {
  AlertCircle,
  GitPullRequest,
  HelpCircle,
  CheckSquare,
  Server,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Layers,
  Table,
  PlusCircle,
  BarChart3,
  Activity,
  Shield,
  Users,
  FileText,
  Code,
  Sparkles,
  Workflow,
  UploadCloud,
  Package,
  Bot,
  FileCode,
  Kanban,
  Building2,
} from "lucide-react";

interface RibbonDropdownItem {
  label: string;
  href: string;
  icon?: any;
  badge?: string;
  count?: string;
}

interface RibbonCategory {
  title: string;
  icon: any;
  items: RibbonDropdownItem[];
}

export function TopRibbonNav() {
  const pathname = usePathname();
  const { currentThemeDef } = useTheme();
  const { currentUser } = useUser();
  const isAdmin = currentUser.role === "admin";
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customTables, setCustomTables] = useState<any[]>([]);
  const ribbonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/now/schema")
      .then((r) => r.json())
      .then((data) => {
        if (data.result && Array.isArray(data.result)) {
          const custom = data.result.filter((t: any) => t.isCustom || t.name.startsWith("u_"));
          setCustomTables(custom);
        }
      })
      .catch((err) => console.error("Error loading custom tables for ribbon:", err));
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ribbonRef.current && !ribbonRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories: RibbonCategory[] = [
    {
      title: "Workspace",
      icon: LayoutDashboard,
      items: [
        { label: "Executive Dashboards", href: "/workspace/dashboard", icon: BarChart3 },
        { label: "Operations Center", href: "/workspace", icon: Activity },
      ],
    },
    {
      title: "Agile Hub",
      icon: Kanban,
      items: [
        { label: "Agile Sprint Board", href: "/workspace/agile", icon: Kanban, badge: "New" },
        { label: "User Stories (rm_story)", href: "/workspace/rm_story" },
        { label: "Sprints (rm_sprint)", href: "/workspace/rm_sprint" },
        { label: "Epics (rm_epic)", href: "/workspace/rm_epic" },
      ],
    },
    {
      title: "Incidents",
      icon: AlertCircle,
      items: [
        { label: "All Incidents", href: "/workspace/incident", count: "3" },
        { label: "Critical Incidents (P1)", href: "/workspace/incident?priority=1", count: "1", badge: "bg-red-500 text-white" },
        { label: "New Incident", href: "/workspace/incident/new", icon: PlusCircle },
      ],
    },
    {
      title: "Changes",
      icon: GitPullRequest,
      items: [
        { label: "All Changes", href: "/workspace/change_request" },
        { label: "CAB Pending Review", href: "/workspace/change_request?cab=requested", badge: "bg-amber-500 text-white" },
        { label: "New Change Request", href: "/workspace/change_request/new", icon: PlusCircle },
      ],
    },
    {
      title: "Problems",
      icon: HelpCircle,
      items: [
        { label: "All Problems", href: "/workspace/problem" },
        { label: "Known Error Database", href: "/workspace/problem?known_error=true" },
      ],
    },
    {
      title: "Service Catalog",
      icon: CheckSquare,
      items: [
        { label: "Fulfillment Tasks", href: "/workspace/sc_task" },
        { label: "Catalog Portal", href: "/portal/catalog" },
      ],
    },
    {
      title: "CMDB & Topology",
      icon: Server,
      items: [
        { label: "Interactive Topology", href: "/workspace/cmdb" },
        { label: "All Configuration Items", href: "/workspace/cmdb_ci" },
      ],
    },
    {
      title: "Knowledge",
      icon: BookOpen,
      items: [
        { label: "Browse Knowledge Base", href: "/portal/knowledge" },
      ],
    },
    ...(customTables.length > 0
      ? [
          {
            title: "Custom Tables",
            icon: Layers,
            items: customTables.map((t) => ({
              label: t.label,
              href: `/workspace/${t.name}`,
              icon: Table,
            })),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Admin Studio",
            icon: Settings,
            items: [
              { label: "Schema Dictionary", href: "/studio?tab=schema", icon: FileCode },
              { label: "Access Control (ACLs)", href: "/studio?tab=acls", icon: Shield },
              { label: "User Management (sys_user)", href: "/studio?tab=users&sub=users", icon: Users },
              { label: "Group Management (sys_user_group)", href: "/studio?tab=users&sub=groups", icon: Users },
              { label: "Business Rules", href: "/studio?tab=business_rules", icon: FileText },
              { label: "Client Scripts", href: "/studio?tab=client_scripts", icon: Code },
              { label: "UI Policies", href: "/studio?tab=ui_policies", icon: Sparkles },
              { label: "Flow Designer", href: "/studio?tab=flows", icon: Workflow },
              { label: "Import Sets & Transforms", href: "/studio?tab=import_sets", icon: UploadCloud },
              { label: "Update Sets", href: "/studio?tab=update_sets", icon: Package },
              { label: "Workflow Agent (Daemon)", href: "/studio?tab=agent", icon: Bot },
            ],
          },
        ]
      : []),
  ];

  return (
    <div
      ref={ribbonRef}
      className="w-full border-b shadow-xs sticky top-14 z-30 transition-colors backdrop-blur-md"
      style={{
        backgroundColor: currentThemeDef.colors.sidebarBg,
        borderColor: currentThemeDef.colors.sidebarBorder,
      }}
    >
      <div className="w-full px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
        <span
          className="text-[10px] uppercase font-bold tracking-wider font-mono mr-2 px-2 py-0.5 rounded shrink-0 hidden md:inline-flex"
          style={{
            backgroundColor: currentThemeDef.colors.sidebarActiveBg,
            color: currentThemeDef.colors.primary,
          }}
        >
          Horizon Ribbon
        </span>

        {categories.map((cat) => {
          const Icon = cat.icon;
          const isOpen = activeDropdown === cat.title;
          const hasActiveChild = cat.items.some((item) => pathname === item.href);

          return (
            <div key={cat.title} className="relative shrink-0">
              <button
                onClick={() => setActiveDropdown(isOpen ? null : cat.title)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hasActiveChild
                    ? "font-bold text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
                style={{
                  backgroundColor: hasActiveChild ? currentThemeDef.colors.sidebarActiveBg : undefined,
                  color: hasActiveChild ? currentThemeDef.colors.primary : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.title}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Popover */}
              {isOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-60 rounded-xl shadow-2xl border p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100"
                  style={{
                    backgroundColor: currentThemeDef.colors.sidebarBg,
                    borderColor: currentThemeDef.colors.sidebarBorder,
                  }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                    <span>{cat.title}</span>
                    <span className="font-mono text-[9px] text-slate-500">{cat.items.length} items</span>
                  </div>

                  <div className="space-y-0.5 max-h-72 overflow-y-auto">
                    {cat.items.map((item) => {
                      const isActive = pathname === item.href;
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? "font-semibold shadow-xs"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                          style={{
                            backgroundColor: isActive ? currentThemeDef.colors.sidebarActiveBg : undefined,
                            color: isActive ? currentThemeDef.colors.primary : undefined,
                          }}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge ? (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badge}`}>
                              !
                            </span>
                          ) : item.count ? (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
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
  );
}
