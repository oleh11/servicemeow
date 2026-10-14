"use client";

import React, { useEffect, useRef } from "react";
import {
  Filter,
  FilterX,
  ExternalLink,
  Copy,
  UserCheck,
  Settings,
  Code2,
  RefreshCw,
  Save,
  ChevronRight,
  ArrowDownAZ,
  ArrowUpAZ,
  FileCode,
  Shield,
  Layers,
} from "lucide-react";

export interface ContextMenuItem {
  label: string;
  icon?: any;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
  title?: string;
}

export function ContextMenu({ x, y, onClose, items, title }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so it doesn't clip offscreen
  const menuWidth = 230;
  const menuHeight = items.length * 30 + 40;
  const adjustedX = typeof window !== "undefined" && x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = typeof window !== "undefined" && y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-56 bg-slate-900 border border-slate-700/90 rounded-lg shadow-2xl py-1.5 text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none font-sans"
    >
      {title && (
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 flex items-center justify-between">
          <span>{title}</span>
          <span className="font-mono text-[9px] text-slate-500">ServiceMeow Context</span>
        </div>
      )}

      <div className="py-0.5">
        {items.map((item, idx) => {
          if (item.divider) {
            return <div key={idx} className="my-1 border-t border-slate-800" />;
          }

          const Icon = item.icon;

          return (
            <div key={idx} className="relative group">
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                    onClose();
                  }
                }}
                className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors ${
                  item.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : item.danger
                    ? "text-rose-400 hover:bg-rose-500/20"
                    : "hover:bg-emerald-600 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100" />}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.children && <ChevronRight className="w-3 h-3 opacity-60 ml-2" />}
              </button>

              {/* Nested Submenu */}
              {item.children && (
                <div className="hidden group-hover:block absolute left-full top-0 ml-0.5 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 text-xs text-slate-200">
                  {item.children.map((sub, sIdx) => {
                    if (sub.divider) return <div key={sIdx} className="my-1 border-t border-slate-800" />;
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          if (sub.onClick) {
                            sub.onClick();
                            onClose();
                          }
                        }}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        {SubIcon && <SubIcon className="w-3.5 h-3.5 opacity-80" />}
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
