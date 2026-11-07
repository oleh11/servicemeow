"use client";

import React, { useEffect } from "react";
import { Keyboard, X, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: "Global Navigation",
      shortcuts: [
        { keys: ["⌘", "K"], description: "Open Command Palette / Universal Search" },
        { keys: ["?"], description: "Open Keyboard Shortcuts cheatsheet" },
        { keys: ["Esc"], description: "Close active modal, drawer or dropdown" },
      ],
    },
    {
      category: "Surface Switcher",
      shortcuts: [
        { keys: ["G", "W"], description: "Go to Fulfiller Operations Workspace" },
        { keys: ["G", "P"], description: "Go to Employee Frontend Portal" },
        { keys: ["G", "S"], description: "Go to Studio Admin & Low-Code IDE (admin)" },
        { keys: ["G", "R"], description: "Go to Workplace Reservations & Floorplans" },
      ],
    },
    {
      category: "List View & Triage",
      shortcuts: [
        { keys: ["N"], description: "Create New Record in active table" },
        { keys: ["R"], description: "Refresh active table data grid" },
        { keys: ["E"], description: "Export table data to CSV or JSON" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-slate-500">Fast navigation and triage commands</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {sc.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 min-w-[20px] text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono font-bold shadow-xs text-slate-700 dark:text-slate-300"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono">?</kbd> anytime to open this cheatsheet
        </div>
      </div>
    </div>
  );
}
