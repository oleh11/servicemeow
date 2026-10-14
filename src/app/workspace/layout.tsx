"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopRibbonNav } from "@/components/layout/TopRibbonNav";
import { ThemePickerModal } from "@/components/theme/ThemePickerModal";
import { useTheme } from "@/lib/theme-context";

import { WorkspaceTabBar } from "@/components/workspace/WorkspaceTabBar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { layoutMode, densityMode, currentThemeDef } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        densityMode === "compact" ? "density-compact" : "density-comfortable"
      }`}
      style={{
        backgroundColor: currentThemeDef.colors.pageBg,
        color: currentThemeDef.colors.textPrimary,
      }}
    >
      <Navbar />
      <ThemePickerModal />

      {layoutMode === "top_ribbon" ? (
        <>
          <TopRibbonNav />
          <main className="flex-1 w-full overflow-x-hidden transition-all flex flex-col">
            <WorkspaceTabBar />
            <div className="flex-1">{children}</div>
          </main>
        </>
      ) : layoutMode === "floating_dock" ? (
        <div className="flex flex-1 gap-4 p-3 max-w-[1920px] w-full mx-auto">
          <Sidebar />
          <main
            className="flex-1 overflow-x-hidden rounded-2xl border shadow-xl transition-all flex flex-col"
            style={{
              backgroundColor: currentThemeDef.colors.cardBg,
              borderColor: currentThemeDef.colors.cardBorder,
            }}
          >
            <WorkspaceTabBar />
            <div className="flex-1">{children}</div>
          </main>
        </div>
      ) : (
        /* Standard Sidebar or Compact Rail */
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden transition-all flex flex-col">
            <WorkspaceTabBar />
            <div className="flex-1">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
