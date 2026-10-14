"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useTheme } from "@/lib/theme-context";
import {
  Cat,
  Search,
  ChevronDown,
  LayoutDashboard,
  Server,
  Compass,
  FileCode,
  UserCheck,
  LogOut,
  AlertTriangle,
  X,
  Users,
  Command,
  Palette,
  Camera,
  Building2,
  Calendar,
  ShoppingBag,
  Ticket,
  BookOpen,
  ShieldCheck,
  Kanban,
  Database,
  Layers,
  ArrowRight,
} from "lucide-react";
import { ProfilePictureModal } from "@/components/common/ProfilePictureModal";
import { UpdateSetPicker } from "./UpdateSetPicker";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    actualUser,
    isImpersonating,
    impersonateUser,
    endImpersonation,
    setCurrentUser,
    allPersonas,
    logout,
  } = useUser();
  const { setThemePickerOpen, currentThemeDef, colorTheme, layoutMode } = useTheme();

  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [impersonateSearch, setImpersonateSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEmployee = currentUser.role === "employee";
  const isAdmin = currentUser.role === "admin";

  const isPortalSurface = pathname.startsWith("/portal");
  const isWorkspaceSurface = pathname.startsWith("/workspace");
  const isStudioSurface = pathname.startsWith("/studio");

  const navLinks = isEmployee || isPortalSurface
    ? [
        { label: "Catalog", href: "/portal/catalog", icon: ShoppingBag },
        { label: "Book Space", href: "/portal/reservations", icon: Building2 },
        { label: "Track Requests", href: "/portal/my-tickets", icon: Ticket },
        { label: "Knowledge", href: "/portal/knowledge", icon: BookOpen },
        { label: "Status", href: "/portal/status", icon: ShieldCheck },
      ]
    : isStudioSurface
    ? [
        { label: "Table Data Editor", href: "/studio?tab=table_editor", icon: Database },
        { label: "Schema Dictionary", href: "/studio?tab=schema", icon: Layers },
      ]
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setAvatarDropdownOpen(false);
    router.push("/login");
  };

  const filteredUsers = allPersonas.filter((p) => {
    const q = impersonateSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      (p.department && p.department.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Persistent Impersonation Banner */}
      {isImpersonating && (
        <div className="w-full bg-amber-500 text-slate-950 font-medium px-4 sm:px-6 py-1.5 text-xs flex items-center justify-between shadow-xs z-50 sticky top-0 border-b border-amber-600">
          <div className="flex items-center space-x-2 truncate">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">
              <strong>Impersonating:</strong> {currentUser.name} (
              <span className="uppercase font-mono font-bold text-[10px] bg-slate-950 text-amber-300 px-1 py-0.5 rounded">
                {currentUser.role}
              </span>
              ) &mdash; All actions & security ACLs reflect this user.
            </span>
          </div>
          <button
            onClick={endImpersonation}
            className="shrink-0 bg-slate-950 hover:bg-slate-900 text-amber-300 px-3 py-1 rounded font-bold text-xs transition-colors shadow-xs ml-3"
          >
            End Impersonation
          </button>
        </div>
      )}

      {/* Privileged user viewing employee portal notification bar */}
      {!isEmployee && isPortalSurface && !isImpersonating && (
        <div className="w-full bg-slate-900/95 border-b border-slate-800 text-slate-300 px-4 sm:px-6 py-1.5 text-xs flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              You are previewing the <strong className="text-white">Employee Frontend Portal</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="px-2.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold border border-sky-500/30 transition-colors"
            >
              Fulfiller Workspace &rarr;
            </Link>
            {isAdmin && (
              <Link
                href="/studio"
                className="px-2.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold border border-purple-500/30 transition-colors"
              >
                Admin Backend &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Full-Width Header Bar (M3 Top App Bar: 64px, Surface Container) */}
      <header
        className="sticky top-0 z-40 w-full border-b shadow-xs transition-colors"
        style={{
          backgroundColor: currentThemeDef.colors.headerBg,
          borderColor: currentThemeDef.colors.headerBorder,
          color: currentThemeDef.colors.headerText,
        }}
      >
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Left: Brand & 3-Surface Switcher */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {/* Logo */}
            <Link
              href={isEmployee ? "/portal" : "/workspace"}
              className="flex items-center space-x-2.5 group shrink-0"
              title={isEmployee ? "ServiceMeow Employee Service Center" : "ServiceMeow Enterprise Management"}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-xs transition-all hover:scale-105"
                style={{
                  backgroundColor: currentThemeDef.colors.primary,
                  color: "#ffffff",
                }}
              >
                <Cat className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className="font-bold text-sm tracking-tight flex items-center gap-0.5"
                  style={{ color: currentThemeDef.colors.headerText }}
                >
                  Service<span style={{ color: currentThemeDef.colors.primary }} className="font-extrabold">Meow</span>
                </span>
                <span
                  className={`text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    isStudioSurface
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : isWorkspaceSurface
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isStudioSurface
                        ? "bg-purple-400"
                        : isWorkspaceSurface
                        ? "bg-sky-400"
                        : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  <span>
                    {isStudioSurface
                      ? "BACKEND ADMIN"
                      : isWorkspaceSurface
                      ? "OPERATIONS"
                      : "FRONTEND PORTAL"}
                  </span>
                </span>
              </div>
            </Link>

            {/* 3-Surface Segmented Context Switcher */}
            {!isEmployee && (
              <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold shrink-0">
                <Link
                  href="/portal"
                  className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                    isPortalSurface
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  title="Employee Frontend Portal"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Frontend</span>
                </Link>

                <Link
                  href="/workspace"
                  className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                    isWorkspaceSurface
                      ? "bg-sky-600 text-white shadow-xs font-bold"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  title="Fulfiller Operations Workspace"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Operations</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/studio"
                    className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                      isStudioSurface
                        ? "bg-purple-600 text-white shadow-xs font-bold"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    title="Platform Backend Admin Console"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Backend</span>
                  </Link>
                )}
              </div>
            )}

            {/* Navigation Tabs (Only for Portal / Studio) */}
            {navLinks.length > 0 && (
              <nav className="hidden lg:flex items-center space-x-1 ml-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded-full transition-all ${
                        isActive
                          ? "font-semibold shadow-xs"
                          : "opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                      style={{
                        backgroundColor: isActive ? currentThemeDef.colors.sidebarActiveBg : undefined,
                        color: isActive ? currentThemeDef.colors.sidebarActiveText : currentThemeDef.colors.headerText,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Global Search & User Profile */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Global Search Bar (M3 Pill Search Bar: 44px, Surface Container High) */}
            <div className="relative hidden lg:block w-72">
              <input
                type="text"
                placeholder={
                  isEmployee
                    ? "Search services, book desks, articles..."
                    : "Search tickets, CIs, articles (e.g. INC*)..."
                }
                className="w-full rounded-full py-2 pl-9 pr-12 text-xs transition-all border outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container-high, #ece6f0)",
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                  color: "var(--md-sys-color-on-surface, #1d1b20)",
                }}
              />
              <Search
                className="w-3.5 h-3.5 absolute left-3 top-2.5"
                style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
              />
              <div
                className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                  color: "var(--md-sys-color-on-surface-variant, #49454f)",
                }}
              >
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </div>

            {/* ServiceMeow Update Set & Application Scope Picker */}
            <UpdateSetPicker />

            {/* Theme & Layout Customizer Button (M3 Tonal Chip / Pill) */}
            <button
              onClick={() => setThemePickerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-xs shrink-0 border"
              style={{
                backgroundColor: currentThemeDef.colors.sidebarActiveBg,
                borderColor: currentThemeDef.colors.primary,
                color: currentThemeDef.colors.sidebarActiveText,
              }}
              title="Theme & Page Layout Customizer"
              aria-label="Theme & Page Layout Customizer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Theme</span>
              <span
                className="w-2 h-2 rounded-full inline-block ml-0.5"
                style={{ backgroundColor: currentThemeDef.colors.primary }}
              />
            </button>

            {/* User Profile Menu (Avatar + Name only, M3 circular state layer) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="flex items-center space-x-2.5 px-2 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                style={{ color: currentThemeDef.colors.headerText }}
                aria-label="User Account Menu"
              >
                <img
                  src={
                    currentUser.avatar ||
                    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64"
                  }
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1"
                  style={{ borderColor: currentThemeDef.colors.primary }}
                />
                <span className="text-xs font-medium hidden sm:inline truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </button>

              {/* Profile Dropdown Popover (M3 Menu Card: rounded-2xl, surface container low) */}
              {avatarDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-[16px] shadow-xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{
                    backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
                    borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                    color: "var(--md-sys-color-on-surface, #1d1b20)",
                  }}
                >
                  {/* User Information Header */}
                  <div
                    className="px-4 py-3 border-b"
                    style={{
                      borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate">{currentUser.name}</p>
                      <span
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: currentThemeDef.colors.sidebarActiveBg,
                          color: currentThemeDef.colors.sidebarActiveText,
                        }}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p
                      className="text-[11px] font-mono truncate mt-0.5"
                      style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                    >
                      {currentUser.email}
                    </p>
                    {currentUser.department && (
                      <p
                        className="text-[10px] mt-1"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                      >
                        {currentUser.title || currentUser.department}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="py-1.5">
                    {/* Update Profile Picture Action */}
                    <button
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
                      <div>
                        <span className="font-medium">Update Profile Picture...</span>
                        <span
                          className="block text-[10px]"
                          style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        >
                          Upload photo, choose mascot, or image URL
                        </span>
                      </div>
                    </button>

                    {/* Theme & Page Layout Action */}
                    <button
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        setThemePickerOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Palette className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
                      <div>
                        <span className="font-medium">Theme & Page Layout...</span>
                        <span
                          className="block text-[10px]"
                          style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        >
                          {currentThemeDef.name}
                        </span>
                      </div>
                    </button>

                    {/* Workplace & Reservations Configuration (Admin) */}
                    {isAdmin && (
                      <Link
                        href="/studio?tab=workplace"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <div>
                          <span className="font-medium">Workplace & Reservations Config...</span>
                          <span
                            className="block text-[10px]"
                            style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                          >
                            Spatial tiers, room capabilities & floorplans
                          </span>
                        </div>
                      </Link>
                    )}

                    {/* Impersonate User Action */}
                    <button
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        setImpersonateModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-medium">Impersonate User...</span>
                        <span
                          className="block text-[10px]"
                          style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        >
                          Simulate permissions as any employee
                        </span>
                      </div>
                    </button>

                    {/* End Impersonation if currently active */}
                    {isImpersonating && (
                      <button
                        onClick={() => {
                          endImpersonation();
                          setAvatarDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-amber-700 dark:text-amber-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Return to {actualUser.name}</span>
                      </button>
                    )}

                    {/* Quick Persona Switcher for pair-testing */}
                    <div
                      className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border-t mt-1"
                      style={{
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                        color: "var(--md-sys-color-on-surface-variant, #49454f)",
                      }}
                    >
                      Quick Switch Persona
                    </div>
                    <div className="max-h-40 overflow-y-auto px-2 space-y-0.5">
                      {allPersonas.map((p) => (
                        <button
                          key={p.id || p.email}
                          onClick={() => {
                            setCurrentUser(p);
                            setAvatarDropdownOpen(false);
                            if (p.role === "employee" && (pathname.startsWith("/workspace") || pathname.startsWith("/studio"))) {
                              router.push("/portal");
                            }
                          }}
                          className={`w-full px-2.5 py-1.5 text-left rounded-lg text-xs flex items-center justify-between transition-colors ${
                            currentUser.email === p.email
                              ? "font-semibold"
                              : "hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                          style={{
                            backgroundColor:
                              currentUser.email === p.email
                                ? currentThemeDef.colors.sidebarActiveBg
                                : undefined,
                            color:
                              currentUser.email === p.email
                                ? currentThemeDef.colors.sidebarActiveText
                                : undefined,
                          }}
                        >
                          <span className="truncate">{p.name}</span>
                          <span
                            className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                              color: "var(--md-sys-color-on-surface-variant, #49454f)",
                            }}
                          >
                            {p.role}
                          </span>
                        </button>
                      ))}
                    </div>

                    {isAdmin && (
                      <div
                        className="border-t pt-1.5 mt-1.5"
                        style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
                      >
                        <Link
                          href="/studio?tab=users"
                          onClick={() => setAvatarDropdownOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                        >
                          <Users className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
                          <span>User & Group Management</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div
                    className="border-t pt-1"
                    style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Impersonate User Modal (M3 Dialog: rounded-[28px], Surface Container High) */}
      {impersonateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border"
            style={{
              backgroundColor: "var(--md-sys-color-surface-container-high, #ece6f0)",
              borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
              color: "var(--md-sys-color-on-surface, #1d1b20)",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm">Impersonate User</h3>
              </div>
              <button
                onClick={() => setImpersonateModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p
              className="text-xs"
              style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
            >
              Select an account to impersonate. The platform will immediately render all workspaces, forms, and security ACLs under this persona.
            </p>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={impersonateSearch}
                onChange={(e) => setImpersonateSearch(e.target.value)}
                placeholder="Search user by name, email, department or role..."
                className="w-full rounded-full px-4 py-2 text-xs border outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                  borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                  color: "var(--md-sys-color-on-surface, #1d1b20)",
                }}
              />
              <Search
                className="w-3.5 h-3.5 absolute right-4 top-2.5"
                style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
              />
            </div>

            <div
              className="max-h-64 overflow-y-auto space-y-1 divide-y"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            >
              {filteredUsers.length === 0 ? (
                <div
                  className="py-6 text-center text-xs"
                  style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                >
                  No users found matching &quot;{impersonateSearch}&quot;
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id || u.email}
                    onClick={() => {
                      impersonateUser(u);
                      setImpersonateModalOpen(false);
                      if (u.role === "employee" && (pathname.startsWith("/workspace") || pathname.startsWith("/studio"))) {
                        router.push("/portal");
                      }
                    }}
                    className={`w-full p-2.5 text-left rounded-[16px] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition-colors ${
                      currentUser.email === u.email
                        ? "ring-2 ring-primary bg-primary/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          u.avatar ||
                          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64"
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300"
                      />
                      <div>
                        <span className="font-semibold text-xs block">{u.name}</span>
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        >
                          {u.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                          color: "var(--md-sys-color-on-surface-variant, #49454f)",
                        }}
                      >
                        {u.role}
                      </span>
                      {u.department && (
                        <span
                          className="block text-[10px]"
                          style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                        >
                          {u.department}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div
              className="border-t pt-3 flex justify-end"
              style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
            >
              <button
                onClick={() => setImpersonateModalOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{
                  borderColor: "var(--md-sys-color-outline, #79747e)",
                  color: "var(--md-sys-color-on-surface, #1d1b20)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Service Profile Picture Modal */}
      <ProfilePictureModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
