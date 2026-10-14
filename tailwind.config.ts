import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        snow: {
          nav: "#1f2d3d",
          header: "#293e52",
          brand: "#81b5a1",
          accent: "#293e40",
          border: "#e2e8f0",
          card: "#ffffff",
          hover: "#f1f5f9",
          muted: "#64748b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
