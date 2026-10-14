"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ThemePickerModal } from "@/components/theme/ThemePickerModal";
import { useTheme } from "@/lib/theme-context";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentThemeDef, densityMode } = useTheme();

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
      <main className="flex-1">{children}</main>
      <footer
        className="border-t py-6 text-xs text-center transition-colors"
        style={{
          backgroundColor: currentThemeDef.colors.headerBg,
          borderColor: currentThemeDef.colors.headerBorder,
          color: currentThemeDef.colors.headerText,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ServiceMeow • Purr-fect Enterprise Service Management • ITIL Compliant</span>
          <span className="font-mono" style={{ color: currentThemeDef.colors.primary }}>
            Meow Platform OSS • {currentThemeDef.name}
          </span>
        </div>
      </footer>
    </div>
  );
}
