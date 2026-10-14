"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Plus,
  Home,
  AlertCircle,
  GitPullRequest,
  HelpCircle,
  Database,
  BarChart3,
  Layers,
  ChevronDown,
  Sparkles,
  Kanban,
  Building2,
} from "lucide-react";

export interface WorkspaceTab {
  id: string;
  title: string;
  href: string;
  icon?: string;
  isPinned?: boolean;
  isDirty?: boolean;
}

const DEFAULT_TABS: WorkspaceTab[] = [
  {
    id: "dashboard",
    title: "Operations Hub",
    href: "/workspace",
    icon: "home",
    isPinned: true,
  },
  {
    id: "incidents",
    title: "Incidents",
    href: "/workspace/incident",
    icon: "incident",
  },
  {
    id: "changes",
    title: "Change Requests",
    href: "/workspace/change_request",
    icon: "change",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    href: "/workspace/reports",
    icon: "report",
  },
];

export function WorkspaceTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<WorkspaceTab[]>(DEFAULT_TABS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Synchronize active route with tabs
  useEffect(() => {
    // If navigating to a specific record or table not in tabs, auto-add a tab
    if (!pathname) return;

    setTabs((prevTabs) => {
      const exists = prevTabs.find((t) => t.href === pathname);
      if (exists) return prevTabs;

      // Extract a friendly title from path
      let title = "Workspace Tab";
      let icon = "layer";

      if (pathname === "/workspace") {
        title = "Operations Hub";
        icon = "home";
      } else if (pathname.includes("/workspace/agile")) {
        title = "Agile Sprint Board";
        icon = "agile";
      } else if (pathname.includes("/workspace/incident/")) {
        const id = pathname.split("/").pop();
        title = id === "new" ? "New Incident" : `INC (${id?.slice(0, 8)}...)`;
        icon = "incident";
      } else if (pathname.includes("/workspace/change_request/")) {
        const id = pathname.split("/").pop();
        title = id === "new" ? "New Change" : `CHG (${id?.slice(0, 8)}...)`;
        icon = "change";
      } else if (pathname.includes("/workspace/reports")) {
        title = "Reports & Analytics";
        icon = "report";
      } else if (pathname.includes("/workspace/cmdb")) {
        title = "CMDB Hierarchy";
        icon = "cmdb";
      } else if (pathname.includes("/workspace/spaces") || pathname.includes("/workspace/reservations")) {
        title = "Workplace & Spaces";
        icon = "spaces";
      } else {
        const parts = pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        title = lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : "Tab";
      }

      return [
        ...prevTabs,
        {
          id: `tab-${Date.now()}`,
          title,
          href: pathname,
          icon,
        },
      ];
    });
  }, [pathname]);

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const targetTab = tabs.find((t) => t.id === tabId);
    if (!targetTab || targetTab.isPinned) return;

    const remainingTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(remainingTabs);

    // If closing active tab, redirect to nearest tab
    if (pathname === targetTab.href) {
      const lastTab = remainingTabs[remainingTabs.length - 1] || DEFAULT_TABS[0];
      router.push(lastTab.href);
    }
  };

  const getTabIcon = (iconName?: string) => {
    switch (iconName) {
      case "home":
        return <Home className="w-3.5 h-3.5 text-[var(--md-sys-color-primary,#0b57d0)]" />;
      case "agile":
        return <Kanban className="w-3.5 h-3.5 text-sky-500" />;
      case "spaces":
        return <Building2 className="w-3.5 h-3.5 text-teal-500" />;
      case "incident":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
      case "change":
        return <GitPullRequest className="w-3.5 h-3.5 text-purple-600" />;
      case "report":
        return <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />;
      case "cmdb":
        return <Database className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const quickNavLinks = [
    { title: "Agile Sprint Board", href: "/workspace/agile", icon: "agile" },
    { title: "Incident List", href: "/workspace/incident", icon: "incident" },
    { title: "New Incident", href: "/workspace/incident/new", icon: "incident" },
    { title: "Change Requests", href: "/workspace/change_request", icon: "change" },
    { title: "New Change Request", href: "/workspace/change_request/new", icon: "change" },
    { title: "Report Builder", href: "/workspace/reports", icon: "report" },
    { title: "CMDB Dependency Visualizer", href: "/workspace/cmdb", icon: "cmdb" },
  ];

  return (
    <div
      className="border-b flex items-center justify-between px-3 h-10 select-none text-xs transition-colors"
      style={{
        backgroundColor: "var(--md-sys-color-surface-container, #f0f4f9)",
        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
      }}
    >
      {/* Tab Strip */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[85%]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all border-b-2 text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-[var(--md-sys-color-primary,#0b57d0)] text-[var(--md-sys-color-primary,#0b57d0)] shadow-xs"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {getTabIcon(tab.icon)}
              <span className="truncate max-w-[140px]">{tab.title}</span>

              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
              )}

              {!tab.isPinned && (
                <button
                  type="button"
                  onClick={(e) => closeTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-opacity"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Link>
          );
        })}
      </div>

      {/* New Tab Quick Actions Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-black/5 dark:hover:bg-white/5 dark:text-slate-300 transition-colors"
          title="Open new workspace tab"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add View</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              className="absolute right-0 mt-1 w-56 rounded-xl border shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
              style={{
                backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
              }}
            >
              <div className="px-3 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">
                Next Experience Multi-Tab Dock
              </div>

              {quickNavLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {getTabIcon(item.icon)}
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
