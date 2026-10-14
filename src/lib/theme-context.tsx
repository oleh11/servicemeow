"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ColorThemeId =
  | "material3"
  | "polaris"
  | "midnight"
  | "corporate_navy"
  | "tokyo_sunset"
  | "golden_amber"
  | "synthwave"
  | "high_contrast";

export type LayoutMode = "sidebar" | "top_ribbon" | "compact_rail" | "floating_dock";

export type DensityMode = "comfortable" | "compact";

export interface ColorThemeDefinition {
  id: ColorThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    glow: string;
    headerBg: string;
    headerText: string;
    headerBorder: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarBorder: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    pageBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
  };
  previewSwatches: [string, string, string, string]; // [Header, Sidebar, Accent, Canvas]
}

export const COLOR_THEMES: Record<ColorThemeId, ColorThemeDefinition> = {
  material3: {
    id: "material3",
    name: "Material Design 3 (M3)",
    tagline: "Official Google Material You tonal surfaces, dynamic palette, and 28px rounded containers",
    isDark: false,
    colors: {
      primary: "#0b57d0", // Google M3 Primary Sapphire
      primaryHover: "#0842a0",
      primaryLight: "#d3e3fd", // Primary Container
      glow: "none",
      headerBg: "#f0f4f9", // Surface Container
      headerText: "#1f1f1f", // On-Surface
      headerBorder: "#c4c7c5", // Outline Variant
      sidebarBg: "#f7f9fc", // Surface Container Low
      sidebarText: "#444746", // On-Surface Variant
      sidebarBorder: "#c4c7c5",
      sidebarActiveBg: "#d3e3fd", // Primary Container Pill
      sidebarActiveText: "#041e49", // On-Primary Container
      pageBg: "#f8f9fa", // Surface
      cardBg: "#ffffff", // Surface Container Lowest
      cardBorder: "#c4c7c5",
      textPrimary: "#1f1f1f",
      textSecondary: "#444746",
    },
    previewSwatches: ["#f0f4f9", "#f7f9fc", "#0b57d0", "#f8f9fa"],
  },
  polaris: {
    id: "polaris",
    name: "Polaris Modern",
    tagline: "Modern enterprise dark slate with signature emerald mint accents",
    isDark: false,
    colors: {
      primary: "#10b981", // emerald-500
      primaryHover: "#059669", // emerald-600
      primaryLight: "#d1fae5",
      glow: "rgba(16, 185, 129, 0.25)",
      headerBg: "#020617", // slate-950
      headerText: "#ffffff",
      headerBorder: "#1e293b",
      sidebarBg: "#0f172a", // slate-900
      sidebarText: "#cbd5e1",
      sidebarBorder: "#1e293b",
      sidebarActiveBg: "rgba(16, 185, 129, 0.15)",
      sidebarActiveText: "#34d399",
      pageBg: "#f8fafc",
      cardBg: "#ffffff",
      cardBorder: "#e2e8f0",
      textPrimary: "#0f172a",
      textSecondary: "#64748b",
    },
    previewSwatches: ["#020617", "#0f172a", "#10b981", "#f8fafc"],
  },
  midnight: {
    id: "midnight",
    name: "Midnight Cyber",
    tagline: "True OLED obsidian dark mode with electric cyan & indigo accents",
    isDark: true,
    colors: {
      primary: "#06b6d4", // cyan-500
      primaryHover: "#0891b2", // cyan-600
      primaryLight: "#164e63",
      glow: "rgba(6, 182, 212, 0.3)",
      headerBg: "#030712", // gray-950
      headerText: "#f9fafb",
      headerBorder: "#1f2937",
      sidebarBg: "#0b0f19",
      sidebarText: "#9ca3af",
      sidebarBorder: "#1f2937",
      sidebarActiveBg: "rgba(6, 182, 212, 0.18)",
      sidebarActiveText: "#22d3ee",
      pageBg: "#070a12",
      cardBg: "#0f172a",
      cardBorder: "#1e293b",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
    },
    previewSwatches: ["#030712", "#0b0f19", "#06b6d4", "#070a12"],
  },
  corporate_navy: {
    id: "corporate_navy",
    name: "Corporate Navy",
    tagline: "Enterprise classic deep cobalt navy with royal blue highlights",
    isDark: false,
    colors: {
      primary: "#2563eb", // blue-600
      primaryHover: "#1d4ed8",
      primaryLight: "#dbeafe",
      glow: "rgba(37, 99, 235, 0.25)",
      headerBg: "#0a192f", // deep navy
      headerText: "#ffffff",
      headerBorder: "#1e3a5f",
      sidebarBg: "#0f2744", // corporate navy
      sidebarText: "#bfdbfe",
      sidebarBorder: "#1e3a5f",
      sidebarActiveBg: "rgba(37, 99, 235, 0.2)",
      sidebarActiveText: "#60a5fa",
      pageBg: "#f1f5f9",
      cardBg: "#ffffff",
      cardBorder: "#cbd5e1",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
    },
    previewSwatches: ["#0a192f", "#0f2744", "#2563eb", "#f1f5f9"],
  },
  tokyo_sunset: {
    id: "tokyo_sunset",
    name: "Tokyo Sunset",
    tagline: "Deep plum charcoal with vibrant sunset rose & magenta coral glow",
    isDark: false,
    colors: {
      primary: "#f43f5e", // rose-500
      primaryHover: "#e11d48",
      primaryLight: "#ffe4e6",
      glow: "rgba(244, 63, 94, 0.25)",
      headerBg: "#190e24", // dark plum
      headerText: "#ffffff",
      headerBorder: "#2e1a42",
      sidebarBg: "#221332",
      sidebarText: "#fbcfe8",
      sidebarBorder: "#341a4d",
      sidebarActiveBg: "rgba(244, 63, 94, 0.18)",
      sidebarActiveText: "#fb7185",
      pageBg: "#fdf8f9",
      cardBg: "#ffffff",
      cardBorder: "#fecdd3",
      textPrimary: "#1f1625",
      textSecondary: "#70536d",
    },
    previewSwatches: ["#190e24", "#221332", "#f43f5e", "#fdf8f9"],
  },
  golden_amber: {
    id: "golden_amber",
    name: "Golden Tabby",
    tagline: "Warm dark espresso stone with rich golden amber honey tones",
    isDark: false,
    colors: {
      primary: "#f59e0b", // amber-500
      primaryHover: "#d97706",
      primaryLight: "#fef3c7",
      glow: "rgba(245, 158, 11, 0.25)",
      headerBg: "#1c1917", // stone-900
      headerText: "#ffffff",
      headerBorder: "#292524",
      sidebarBg: "#292524", // stone-800
      sidebarText: "#e7e5e4",
      sidebarBorder: "#3b3430",
      sidebarActiveBg: "rgba(245, 158, 11, 0.18)",
      sidebarActiveText: "#fbbf24",
      pageBg: "#fafaf9", // warm stone
      cardBg: "#ffffff",
      cardBorder: "#e7e5e4",
      textPrimary: "#1c1917",
      textSecondary: "#57534e",
    },
    previewSwatches: ["#1c1917", "#292524", "#f59e0b", "#fafaf9"],
  },
  synthwave: {
    id: "synthwave",
    name: "Synthwave Neon",
    tagline: "Cosmic dark purple night with glowing neon fuchsia and neon violet",
    isDark: true,
    colors: {
      primary: "#d946ef", // fuchsia-500
      primaryHover: "#c026d3",
      primaryLight: "#701a75",
      glow: "rgba(217, 70, 239, 0.35)",
      headerBg: "#120726", // cosmic dark
      headerText: "#fae8ff",
      headerBorder: "#28124d",
      sidebarBg: "#1a0b36",
      sidebarText: "#e9d5ff",
      sidebarBorder: "#34135e",
      sidebarActiveBg: "rgba(217, 70, 239, 0.22)",
      sidebarActiveText: "#f0abfc",
      pageBg: "#0c041b",
      cardBg: "#180a32",
      cardBorder: "#351566",
      textPrimary: "#f5f3ff",
      textSecondary: "#c084fc",
    },
    previewSwatches: ["#120726", "#1a0b36", "#d946ef", "#0c041b"],
  },
  high_contrast: {
    id: "high_contrast",
    name: "High Contrast (AAA)",
    tagline: "Maximum accessibility stark black & white with high-visibility yellow",
    isDark: false,
    colors: {
      primary: "#eab308", // yellow-500
      primaryHover: "#ca8a04",
      primaryLight: "#fef08a",
      glow: "rgba(234, 179, 8, 0.4)",
      headerBg: "#000000",
      headerText: "#ffffff",
      headerBorder: "#333333",
      sidebarBg: "#0a0a0a",
      sidebarText: "#ffffff",
      sidebarBorder: "#333333",
      sidebarActiveBg: "#222222",
      sidebarActiveText: "#facc15",
      pageBg: "#ffffff",
      cardBg: "#ffffff",
      cardBorder: "#000000",
      textPrimary: "#000000",
      textSecondary: "#1f2937",
    },
    previewSwatches: ["#000000", "#0a0a0a", "#eab308", "#ffffff"],
  },
};

export interface LayoutDefinition {
  id: LayoutMode;
  name: string;
  description: string;
  iconType: string;
}

export const LAYOUT_MODES: LayoutDefinition[] = [
  {
    id: "sidebar",
    name: "Classic Left Navigator",
    description: "Standard layout with persistent left Application Navigator",
    iconType: "sidebar",
  },
  {
    id: "top_ribbon",
    name: "Horizon Top Ribbon",
    description: "Horizontal mega-ribbon under navbar; 100% full-width workspace canvas",
    iconType: "top_ribbon",
  },
  {
    id: "compact_rail",
    name: "Slim Icon Rail",
    description: "Ultra-compact 60px icon sidebar with popout flyout menus for power users",
    iconType: "compact_rail",
  },
  {
    id: "floating_dock",
    name: "Floating Canvas Cards",
    description: "Elevated rounded cards with outer margin and soft shadow aesthetic",
    iconType: "floating_dock",
  },
];

interface ThemeContextType {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (layout: LayoutMode) => void;
  densityMode: DensityMode;
  setDensityMode: (density: DensityMode) => void;
  themePickerOpen: boolean;
  setThemePickerOpen: (open: boolean) => void;
  currentThemeDef: ColorThemeDefinition;
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("material3");
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("sidebar");
  const [densityMode, setDensityModeState] = useState<DensityMode>("comfortable");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("servicemeow_color_theme") as ColorThemeId | null;
      if (savedTheme && COLOR_THEMES[savedTheme]) {
        setColorThemeState(savedTheme);
      } else {
        setColorThemeState("material3");
      }
      const savedLayout = localStorage.getItem("servicemeow_layout_mode") as LayoutMode | null;
      if (savedLayout && ["sidebar", "top_ribbon", "compact_rail", "floating_dock"].includes(savedLayout)) {
        setLayoutModeState(savedLayout);
      }
      const savedDensity = localStorage.getItem("servicemeow_density_mode") as DensityMode | null;
      if (savedDensity && ["comfortable", "compact"].includes(savedDensity)) {
        setDensityModeState(savedDensity);
      }
    } catch (e) {
      console.error("Theme storage load error:", e);
    }
    setMounted(true);
  }, []);

  // Apply theme attributes and CSS variables whenever colorTheme, layoutMode, or densityMode changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const themeDef = COLOR_THEMES[colorTheme] || COLOR_THEMES.polaris;
    const root = document.documentElement;

    // Set DOM data attributes
    root.setAttribute("data-color-theme", colorTheme);
    root.setAttribute("data-layout-mode", layoutMode);
    root.setAttribute("data-density-mode", densityMode);
    root.setAttribute("data-theme-mode", themeDef.isDark ? "dark" : "light");

    if (themeDef.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Inject CSS variables into :root style
    root.style.setProperty("--theme-accent", themeDef.colors.primary);
    root.style.setProperty("--theme-accent-hover", themeDef.colors.primaryHover);
    root.style.setProperty("--theme-accent-light", themeDef.colors.primaryLight);
    root.style.setProperty("--theme-accent-glow", themeDef.colors.glow);
    root.style.setProperty("--theme-header-bg", themeDef.colors.headerBg);
    root.style.setProperty("--theme-header-text", themeDef.colors.headerText);
    root.style.setProperty("--theme-header-border", themeDef.colors.headerBorder);
    root.style.setProperty("--theme-sidebar-bg", themeDef.colors.sidebarBg);
    root.style.setProperty("--theme-sidebar-text", themeDef.colors.sidebarText);
    root.style.setProperty("--theme-sidebar-border", themeDef.colors.sidebarBorder);
    root.style.setProperty("--theme-sidebar-active-bg", themeDef.colors.sidebarActiveBg);
    root.style.setProperty("--theme-sidebar-active-text", themeDef.colors.sidebarActiveText);
    root.style.setProperty("--theme-page-bg", themeDef.colors.pageBg);
    root.style.setProperty("--theme-card-bg", themeDef.colors.cardBg);
    root.style.setProperty("--theme-card-border", themeDef.colors.cardBorder);
    root.style.setProperty("--theme-text-primary", themeDef.colors.textPrimary);
    root.style.setProperty("--theme-text-secondary", themeDef.colors.textSecondary);

    // Persist to localStorage
    if (mounted) {
      try {
        localStorage.setItem("servicemeow_color_theme", colorTheme);
        localStorage.setItem("servicemeow_layout_mode", layoutMode);
        localStorage.setItem("servicemeow_density_mode", densityMode);
      } catch (e) {
        console.error("Theme storage save error:", e);
      }
    }
  }, [colorTheme, layoutMode, densityMode, mounted]);

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme);
  };

  const setLayoutMode = (layout: LayoutMode) => {
    setLayoutModeState(layout);
  };

  const setDensityMode = (density: DensityMode) => {
    setDensityModeState(density);
  };

  const resetToDefaults = () => {
    setColorThemeState("material3");
    setLayoutModeState("sidebar");
    setDensityModeState("comfortable");
  };

  const currentThemeDef = COLOR_THEMES[colorTheme] || COLOR_THEMES.material3;

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        setColorTheme,
        layoutMode,
        setLayoutMode,
        densityMode,
        setDensityMode,
        themePickerOpen,
        setThemePickerOpen,
        currentThemeDef,
        resetToDefaults,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
