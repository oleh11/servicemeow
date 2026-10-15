"use client";

// Execute immediately when the bundle loads in the browser, before React hydration
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const fullMessage = args
      .map((a) => (typeof a === "string" ? a : a?.message || a?.stack || ""))
      .join(" ");

    // Check if this error is a benign hydration mismatch caused by browser extensions
    // (e.g. LanguageTool injecting data-lt-installed or Grammarly / ColorZilla injecting attributes on <html> / <body>)
    const isHydrationMismatch =
      fullMessage.includes("A tree hydrated but some attributes") ||
      fullMessage.includes("hydration-error") ||
      fullMessage.includes("did not match");

    const isExtensionAttribute =
      fullMessage.includes("data-lt-installed") ||
      fullMessage.includes("suppresshydrationwarning") ||
      fullMessage.includes("cz-shortcut-listen") ||
      fullMessage.includes("data-gr-ext-installed");

    if (isHydrationMismatch && isExtensionAttribute) {
      // Safely suppress harmless browser extension attribute warning
      return;
    }

    originalConsoleError.apply(console, args);
  };
}

export function HydrationExtensionGuard() {
  return null;
}
