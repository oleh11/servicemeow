"use client";

import React, { useState } from "react";
import {
  useTheme,
  COLOR_THEMES,
  ColorThemeId,
  LAYOUT_MODES,
} from "@/lib/theme-context";
import {
  X,
  Palette,
  Layout,
  Maximize2,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Grid,
} from "lucide-react";

export function ThemePickerModal() {
  const {
    colorTheme,
    setColorTheme,
    layoutMode,
    setLayoutMode,
    densityMode,
    setDensityMode,
    themePickerOpen,
    setThemePickerOpen,
    resetToDefaults,
    currentThemeDef,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<"colors" | "layout" | "density">("colors");

  if (!themePickerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="rounded-[28px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: "var(--md-sys-color-surface-container-high, #ece6f0)",
          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          color: "var(--md-sys-color-on-surface, #1d1b20)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-xs"
              style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
            >
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Theme & Layout Customizer</span>
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: currentThemeDef.colors.sidebarActiveBg,
                    color: currentThemeDef.colors.sidebarActiveText,
                  }}
                >
                  {currentThemeDef.name}
                </span>
              </h2>
              <p
                className="text-xs"
                style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
              >
                Customize color palette, navigation architecture, and workspace density in real time.
              </p>
            </div>
          </div>
          <button
            onClick={() => setThemePickerOpen(false)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close theme customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (M3 Pill Tabs) */}
        <div
          className="px-6 py-2.5 border-b flex items-center space-x-2"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container-low, #f7f2fa)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <button
            onClick={() => setActiveTab("colors")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === "colors" ? "shadow-xs" : "opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            style={{
              backgroundColor: activeTab === "colors" ? currentThemeDef.colors.sidebarActiveBg : "transparent",
              color: activeTab === "colors" ? currentThemeDef.colors.sidebarActiveText : undefined,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Palette (8 Themes)</span>
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === "layout" ? "shadow-xs" : "opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            style={{
              backgroundColor: activeTab === "layout" ? currentThemeDef.colors.sidebarActiveBg : "transparent",
              color: activeTab === "layout" ? currentThemeDef.colors.sidebarActiveText : undefined,
            }}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Page Layout (4 Modes)</span>
          </button>
          <button
            onClick={() => setActiveTab("density")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === "density" ? "shadow-xs" : "opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            style={{
              backgroundColor: activeTab === "density" ? currentThemeDef.colors.sidebarActiveBg : "transparent",
              color: activeTab === "density" ? currentThemeDef.colors.sidebarActiveText : undefined,
            }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Display Density (2 Modes)</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: COLOR PALETTES */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Select Application Color Palette</h3>
                  <p
                    className="text-xs"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    Changes header, sidebar, primary actions, badges, and workspace surfaces instantly.
                  </p>
                </div>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                >
                  Active: <strong>{currentThemeDef.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((themeKey) => {
                  const theme = COLOR_THEMES[themeKey];
                  const isSelected = colorTheme === theme.id;

                  return (
                    <div
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      className={`cursor-pointer rounded-[16px] p-4 border transition-all text-left relative group ${
                        isSelected
                          ? "ring-2 shadow-md"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--md-sys-color-surface-container-lowest, #ffffff)"
                          : "var(--md-sys-color-surface-container-low, #f7f2fa)",
                        borderColor: isSelected ? theme.colors.primary : "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div
                          className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs"
                          style={{ backgroundColor: theme.colors.primary, color: "#ffffff" }}
                        >
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}

                      {/* Header row: Name + Dark Mode indicator */}
                      <div className="flex items-center space-x-2 pr-6">
                        <span className="font-bold text-xs">
                          {theme.name}
                        </span>
                        {theme.isDark ? (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-400/40 flex items-center gap-1">
                            <Moon className="w-2.5 h-2.5" /> Dark
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
                            <Sun className="w-2.5 h-2.5" /> Light
                          </span>
                        )}
                      </div>

                      <p
                        className="text-[11px] mt-1 line-clamp-2 leading-relaxed"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                      >
                        {theme.tagline}
                      </p>

                      {/* Swatch Previews */}
                      <div
                        className="mt-3 flex items-center justify-between border-t pt-2.5"
                        style={{ borderColor: "var(--md-sys-color-outline-variant, #cac4d0)" }}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                          >
                            Palette:
                          </span>
                          <div className="flex items-center -space-x-1">
                            {theme.previewSwatches.map((swatch, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs"
                                style={{ backgroundColor: swatch }}
                                title={
                                  idx === 0
                                    ? "Header"
                                    : idx === 1
                                    ? "Sidebar"
                                    : idx === 2
                                    ? "Accent"
                                    : "Canvas"
                                }
                              />
                            ))}
                          </div>
                        </div>

                        {/* Accent Pill */}
                        <div
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                          style={{
                            backgroundColor: theme.colors.sidebarActiveBg,
                            color: theme.colors.primary,
                          }}
                        >
                          {theme.colors.primary}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PAGE LAYOUTS */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Select Workspace Navigation Architecture</h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                >
                  Switch between classic sidebar, horizontal top ribbon, compact icon rail, or floating dock.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LAYOUT_MODES.map((layout) => {
                  const isSelected = layoutMode === layout.id;

                  return (
                    <div
                      key={layout.id}
                      onClick={() => setLayoutMode(layout.id)}
                      className={`cursor-pointer rounded-[16px] p-4 border transition-all text-left relative group ${
                        isSelected
                          ? "ring-2 shadow-md"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--md-sys-color-surface-container-lowest, #ffffff)"
                          : "var(--md-sys-color-surface-container-low, #f7f2fa)",
                        borderColor: isSelected
                          ? currentThemeDef.colors.primary
                          : "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div
                          className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs z-10"
                          style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
                        >
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}

                      {/* Schematic Wireframe Diagram */}
                      <div
                        className="w-full h-24 rounded-[12px] border p-2 flex flex-col gap-1.5 mb-3 select-none"
                        style={{
                          backgroundColor: "var(--md-sys-color-surface-container-highest, #e6e0e9)",
                          borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                        }}
                      >
                        {/* Top Bar for all */}
                        <div
                          className="h-3 rounded-full flex items-center px-2 justify-between border"
                          style={{
                            backgroundColor: currentThemeDef.colors.headerBg,
                            borderColor: currentThemeDef.colors.headerBorder,
                          }}
                        >
                          <div
                            className="w-2.5 h-1.5 rounded-full"
                            style={{ backgroundColor: currentThemeDef.colors.primary }}
                          />
                          <div className="w-12 h-1 rounded-full bg-slate-400 opacity-60" />
                          <div className="w-2 h-2 rounded-full bg-slate-400 opacity-60" />
                        </div>

                        {/* Schematic content area */}
                        {layout.id === "sidebar" && (
                          <div className="flex-1 flex gap-1.5">
                            {/* Left Sidebar */}
                            <div
                              className="w-10 rounded-lg flex flex-col gap-1 p-1 border"
                              style={{
                                backgroundColor: currentThemeDef.colors.sidebarBg,
                                borderColor: currentThemeDef.colors.sidebarBorder,
                              }}
                            >
                              <div
                                className="w-full h-1 rounded-full"
                                style={{ backgroundColor: currentThemeDef.colors.primary }}
                              />
                              <div className="w-full h-1 bg-slate-400 opacity-40 rounded-full" />
                              <div className="w-full h-1 bg-slate-400 opacity-40 rounded-full" />
                            </div>
                            {/* Main Content */}
                            <div className="flex-1 rounded-lg bg-white/70 dark:bg-black/20 border border-slate-300 dark:border-slate-700 p-1 flex flex-col gap-1">
                              <div className="w-16 h-1.5 bg-slate-400 opacity-50 rounded-full" />
                              <div className="grid grid-cols-2 gap-1 flex-1">
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.id === "top_ribbon" && (
                          <div className="flex-1 flex flex-col gap-1">
                            {/* Horizontal Ribbon Subnav */}
                            <div
                              className="h-3 rounded-full flex items-center px-2 gap-1.5 border"
                              style={{
                                backgroundColor: currentThemeDef.colors.sidebarBg,
                                borderColor: currentThemeDef.colors.primary,
                              }}
                            >
                              <div
                                className="w-5 h-1 rounded-full"
                                style={{ backgroundColor: currentThemeDef.colors.primary }}
                              />
                              <div className="w-6 h-1 bg-slate-400 opacity-50 rounded-full" />
                              <div className="w-6 h-1 bg-slate-400 opacity-50 rounded-full" />
                            </div>
                            {/* Full-Width Main Content */}
                            <div className="flex-1 rounded-lg bg-white/70 dark:bg-black/20 border border-slate-300 dark:border-slate-700 p-1 flex flex-col gap-1">
                              <div className="w-20 h-1.5 bg-slate-400 opacity-50 rounded-full" />
                              <div className="grid grid-cols-3 gap-1 flex-1">
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.id === "compact_rail" && (
                          <div className="flex-1 flex gap-1.5">
                            {/* Slim Icon Rail */}
                            <div
                              className="w-5 rounded-lg flex flex-col items-center gap-1.5 py-1 border"
                              style={{
                                backgroundColor: currentThemeDef.colors.sidebarBg,
                                borderColor: currentThemeDef.colors.sidebarBorder,
                              }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: currentThemeDef.colors.primary }}
                              />
                              <div className="w-2 h-2 rounded-full bg-slate-400 opacity-50" />
                              <div className="w-2 h-2 rounded-full bg-slate-400 opacity-50" />
                            </div>
                            {/* Expanded Main Content */}
                            <div className="flex-1 rounded-lg bg-white/70 dark:bg-black/20 border border-slate-300 dark:border-slate-700 p-1 flex flex-col gap-1">
                              <div className="w-20 h-1.5 bg-slate-400 opacity-50 rounded-full" />
                              <div className="grid grid-cols-2 gap-1 flex-1">
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                                <div className="bg-slate-300 dark:bg-slate-700 opacity-40 rounded-sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.id === "floating_dock" && (
                          <div className="flex-1 p-0.5 flex gap-2">
                            {/* Floating Sidebar card */}
                            <div
                              className="w-9 rounded-lg flex flex-col gap-1 p-1 shadow-xs border"
                              style={{
                                backgroundColor: currentThemeDef.colors.sidebarBg,
                                borderColor: currentThemeDef.colors.sidebarBorder,
                              }}
                            >
                              <div
                                className="w-full h-1 rounded-full"
                                style={{ backgroundColor: currentThemeDef.colors.primary }}
                              />
                              <div className="w-full h-1 bg-slate-400 opacity-50 rounded-full" />
                            </div>
                            {/* Floating Main card */}
                            <div className="flex-1 rounded-lg bg-white/70 dark:bg-black/20 border border-slate-300 dark:border-slate-700 p-1 flex flex-col gap-1 shadow-xs">
                              <div className="w-14 h-1.5 bg-slate-400 opacity-50 rounded-full" />
                              <div className="bg-slate-300 dark:bg-slate-700 opacity-40 flex-1 rounded-sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <span className="font-bold text-xs block">
                        {layout.name}
                      </span>
                      <p
                        className="text-[11px] mt-1 leading-relaxed"
                        style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                      >
                        {layout.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DISPLAY DENSITY */}
          {activeTab === "density" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Select Information Density</h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                >
                  Control row heights, padding, and font compacting for high-volume ITIL ticket processing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Comfortable Mode */}
                <div
                  onClick={() => setDensityMode("comfortable")}
                  className={`cursor-pointer rounded-[16px] p-4 border transition-all text-left relative ${
                    densityMode === "comfortable"
                      ? "ring-2 shadow-md"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: densityMode === "comfortable"
                      ? "var(--md-sys-color-surface-container-lowest, #ffffff)"
                      : "var(--md-sys-color-surface-container-low, #f7f2fa)",
                    borderColor: densityMode === "comfortable"
                      ? currentThemeDef.colors.primary
                      : "var(--md-sys-color-outline-variant, #cac4d0)",
                  }}
                >
                  {densityMode === "comfortable" && (
                    <div
                      className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs"
                      style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
                    >
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Maximize2 className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
                    <span className="font-bold text-xs">Comfortable (Standard)</span>
                  </div>
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    Standard spacious enterprise layout with comfortable padding and large tap targets.
                  </p>

                  {/* Sample table mock */}
                  <div
                    className="mt-3 p-2.5 rounded-[12px] border space-y-2"
                    style={{
                      backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
                      borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                    }}
                  >
                    <div
                      className="h-6 rounded-md px-2 flex items-center justify-between text-[10px] font-mono border"
                      style={{
                        backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      <span>INC0001001</span>
                      <span className="text-sky-600 font-semibold">New</span>
                    </div>
                    <div
                      className="h-6 rounded-md px-2 flex items-center justify-between text-[10px] font-mono border"
                      style={{
                        backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      <span>INC0001002</span>
                      <span className="text-amber-600 font-semibold">In Progress</span>
                    </div>
                  </div>
                </div>

                {/* Compact Mode */}
                <div
                  onClick={() => setDensityMode("compact")}
                  className={`cursor-pointer rounded-[16px] p-4 border transition-all text-left relative ${
                    densityMode === "compact"
                      ? "ring-2 shadow-md"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: densityMode === "compact"
                      ? "var(--md-sys-color-surface-container-lowest, #ffffff)"
                      : "var(--md-sys-color-surface-container-low, #f7f2fa)",
                    borderColor: densityMode === "compact"
                      ? currentThemeDef.colors.primary
                      : "var(--md-sys-color-outline-variant, #cac4d0)",
                  }}
                >
                  {densityMode === "compact" && (
                    <div
                      className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs"
                      style={{ backgroundColor: currentThemeDef.colors.primary, color: "#ffffff" }}
                    >
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Grid className="w-4 h-4" style={{ color: currentThemeDef.colors.primary }} />
                    <span className="font-bold text-xs">Compact (High-Density)</span>
                  </div>
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: "var(--md-sys-color-on-surface-variant, #49454f)" }}
                  >
                    Maximum rows per screen with reduced padding and tighter text metrics for power users.
                  </p>

                  {/* Sample compact table mock */}
                  <div
                    className="mt-3 p-2 rounded-[12px] border space-y-1"
                    style={{
                      backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
                      borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                    }}
                  >
                    <div
                      className="h-5 rounded px-2 flex items-center justify-between text-[9px] font-mono border"
                      style={{
                        backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      <span>INC0001001</span>
                      <span className="text-sky-600 font-semibold">New</span>
                    </div>
                    <div
                      className="h-5 rounded px-2 flex items-center justify-between text-[9px] font-mono border"
                      style={{
                        backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      <span>INC0001002</span>
                      <span className="text-amber-600 font-semibold">In Progress</span>
                    </div>
                    <div
                      className="h-5 rounded px-2 flex items-center justify-between text-[9px] font-mono border"
                      style={{
                        backgroundColor: "var(--md-sys-color-surface-container-lowest, #ffffff)",
                        borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
                      }}
                    >
                      <span>INC0001003</span>
                      <span className="text-rose-600 font-semibold">P1 Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{
            backgroundColor: "var(--md-sys-color-surface-container, #f3edf7)",
            borderColor: "var(--md-sys-color-outline-variant, #cac4d0)",
          }}
        >
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{
              borderColor: "var(--md-sys-color-outline, #79747e)",
              color: "var(--md-sys-color-on-surface, #1d1b20)",
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={() => setThemePickerOpen(false)}
            className="px-6 py-2.5 text-xs font-medium rounded-full text-white transition-all shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)]"
            style={{ backgroundColor: currentThemeDef.colors.primary }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
