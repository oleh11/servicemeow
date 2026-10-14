"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  AlertCircle,
  Server,
  Terminal,
  Settings,
  Plus,
  Compass,
} from "lucide-react";

export interface NavRailItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const DEFAULT_DESTINATIONS: NavRailItem[] = [
  { label: "Workspaces", href: "/workspace", icon: Layers },
  { label: "Incidents", href: "/workspace/incident", icon: AlertCircle },
  { label: "CMDB", href: "/cmdb", icon: Server },
  { label: "Studio", href: "/studio", icon: Terminal },
  { label: "Admin", href: "/admin", icon: Settings },
];

export interface M3NavigationRailProps {
  destinations?: NavRailItem[];
  onQuickAction?: () => void;
  className?: string;
}

export function M3NavigationRail({
  destinations = DEFAULT_DESTINATIONS,
  onQuickAction,
  className = "",
}: M3NavigationRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-20 min-w-[80px] h-screen flex flex-col items-center py-6 border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] select-none z-30 ${className}`}
    >
      {/* Top Header / App Brand */}
      <Link
        href="/workspace"
        className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] transition-shadow mb-6"
        title="Service Platform"
      >
        <Compass className="w-6 h-6" />
      </Link>

      {/* Floating Action / Quick Create Button */}
      {onQuickAction && (
        <button
          type="button"
          onClick={onQuickAction}
          className="w-14 h-14 rounded-2xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center shadow-[var(--md-sys-elevation-2)] hover:shadow-[var(--md-sys-elevation-3)] active:scale-95 transition-all mb-8"
          title="New Record"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Navigation Destinations */}
      <nav className="flex-1 w-full flex flex-col items-center space-y-4">
        {destinations.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/workspace" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center w-full focus:outline-none"
            >
              {/* Active Indicator Pill (56x32px) */}
              <div
                className={`relative w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                    : "text-[var(--md-sys-color-on-surface-variant)] group-hover:bg-[var(--md-sys-color-surface-container-highest)]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                    isActive ? "text-[var(--md-sys-color-on-primary-container)]" : ""
                  }`}
                />

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold rounded-full bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Destination Label */}
              <span
                className={`text-[11px] mt-1 font-medium tracking-tight text-center truncate max-w-[72px] transition-colors ${
                  isActive
                    ? "text-[var(--md-sys-color-on-surface)] font-semibold"
                    : "text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Quick Setting */}
      <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] w-full flex justify-center">
        <Link
          href="/admin"
          className="p-2.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          title="System Administration"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </aside>
  );
}
