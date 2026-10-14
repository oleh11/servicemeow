"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X, CheckSquare, Square } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

interface SearchableMultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  maxDisplayedTags?: number;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SearchableMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Filter options...",
  label,
  maxDisplayedTags = 3,
  disabled = false,
  emptyMessage = "No matching options found",
  className = "",
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase())) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (disabled) return;
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter((v) => v !== val));
  };

  const selectAll = () => {
    if (disabled) return;
    const allFilteredValues = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...selectedValues, ...allFilteredValues]));
    onChange(combined);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Find labels for selected values
  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));
  const remainingCount = selectedValues.length - maxDisplayedTags;

  return (
    <div className={`relative space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-slate-300 font-medium text-xs">{label}</label>
          {selectedValues.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              {selectedValues.length} selected
            </span>
          )}
        </div>
      )}

      {/* Main Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[38px] w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-slate-800"
            : isOpen
            ? "border-emerald-500 ring-1 ring-emerald-500/40 bg-slate-900"
            : "border-slate-700 hover:border-slate-600"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-slate-500 text-xs truncate">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplayedTags).map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700 max-w-[180px] truncate"
                >
                  {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => removeValue(e, opt.value)}
                    className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                    title={`Remove ${opt.label}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {remainingCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700 font-bold">
                  +{remainingCount} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-1 text-slate-400 flex-shrink-0">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180 text-emerald-400" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800 bg-slate-900/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center justify-between text-[11px] pt-1.5 px-1 text-slate-400 font-medium">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-3 h-3 text-emerald-500" />
                <span>Select All ({filteredOptions.length})</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>Clear Selection</span>
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-slate-500 italic text-xs">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`px-3 py-2 flex items-center justify-between rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-300 font-medium"
                        : "hover:bg-slate-900 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}

                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-xs text-white">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="block truncate text-[10px] text-slate-400">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {opt.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ml-2 flex-shrink-0 ${
                          opt.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
