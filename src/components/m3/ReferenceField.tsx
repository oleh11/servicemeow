"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, X, Filter, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ReferenceValue } from "@/lib/schema";

export interface ReferenceCandidate {
  value: string;
  display_value: string;
  subtitle?: string;
  details?: any;
}

export interface ReferenceFieldProps {
  label: string;
  targetTable: string; // e.g. "sys_user", "sys_user_group", "cmdb_ci", "cmn_location"
  value: string | ReferenceValue | null;
  onChange: (value: ReferenceValue | null) => void;
  dependentField?: string;
  dependentValue?: string;
  dependentLabel?: string;
  dependentDisplayValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

export function ReferenceField({
  label,
  targetTable,
  value,
  onChange,
  dependentField,
  dependentValue,
  dependentLabel,
  dependentDisplayValue,
  disabled = false,
  readOnly = false,
  required = false,
  helperText,
  error = false,
  errorMessage,
  className = "",
}: ReferenceFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<ReferenceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dependentApplied, setDependentApplied] = useState(false);
  const limit = 10;

  // Resolve display string from value prop
  const displayString =
    typeof value === "object" && value !== null
      ? value.display_value || value.value
      : typeof value === "string"
      ? value
      : "";

  const recordId =
    typeof value === "object" && value !== null
      ? value.value
      : typeof value === "string"
      ? value
      : null;

  // Fetch candidate records from reference API
  const fetchCandidates = async (pageToFetch = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: targetTable,
        search: searchQuery,
        page: String(pageToFetch),
        limit: String(limit),
      });

      if (dependentField && dependentValue) {
        params.set("dependent_field", dependentField);
        params.set("dependent_value", dependentValue);
      }

      const res = await fetch(`/api/now/reference?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load reference candidates");
      const data = await res.json();
      setCandidates(data.results || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setDependentApplied(Boolean(data.dependentQualifierApplied));
    } catch (err) {
      console.error("Reference fetch error:", err);
      setCandidates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on user query changes
  useEffect(() => {
    if (!modalOpen) return;
    const timer = setTimeout(() => {
      fetchCandidates(1, search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, modalOpen, dependentValue]);

  const handleOpenModal = () => {
    if (disabled || readOnly) return;
    setSearch("");
    setPage(1);
    setModalOpen(true);
    fetchCandidates(1, "");
  };

  const handleSelect = (candidate: ReferenceCandidate) => {
    onChange({
      value: candidate.value,
      display_value: candidate.display_value,
      link: `/api/now/table/${targetTable}/${candidate.value}`,
      details: candidate.details,
    });
    setModalOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className={`relative flex flex-col font-sans ${className}`}>
      {/* M3 Outlined Container */}
      <div
        className={`relative flex items-center min-h-[56px] px-4 rounded-[8px] border transition-all duration-150 bg-[var(--md-sys-color-surface-container-lowest)] ${
          disabled
            ? "opacity-60 bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] cursor-not-allowed"
            : error
            ? "border-[var(--md-sys-color-error)] ring-1 ring-[var(--md-sys-color-error)]"
            : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)]/20 focus-within:border-2"
        }`}
      >
        {/* Floating Label */}
        <label
          className={`absolute left-4 pointer-events-none transition-all duration-150 origin-top-left ${
            displayString
              ? "-top-2.5 px-1.5 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium tracking-[0.15px] text-[var(--md-sys-color-primary)]"
              : "top-4 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]"
          }`}
        >
          {label} {required && <span className="text-[var(--md-sys-color-error)]">*</span>}
        </label>

        {/* Display Text Area */}
        <div
          onClick={handleOpenModal}
          className={`w-full pt-3 pb-1 text-sm text-[var(--md-sys-color-on-surface)] truncate ${
            !disabled && !readOnly ? "cursor-pointer" : ""
          }`}
        >
          {displayString || <span className="text-transparent">Placeholder</span>}
        </div>

        {/* Trailing Action Controls */}
        <div className="flex items-center space-x-1 ml-2">
          {/* Clear button */}
          {displayString && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Open Record Link button */}
          {recordId && (
            <a
              href={`/workspace/${targetTable}/${recordId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open record in new tab"
              className="p-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] rounded-full transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Lookup Modal Trigger Button */}
          {!disabled && !readOnly && (
            <button
              type="button"
              onClick={handleOpenModal}
              title={`Lookup ${label}`}
              className="p-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] rounded-full transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Supporting / Error Text */}
      {(errorMessage || helperText) && (
        <div
          className={`text-xs mt-1 px-4 ${
            error
              ? "text-[var(--md-sys-color-error)] font-medium"
              : "text-[var(--md-sys-color-on-surface-variant)]"
          }`}
        >
          {error ? errorMessage : helperText}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Interactive M3 Target Lookup Modal Dialog                                  */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[28px] shadow-[var(--md-sys-elevation-3)] border border-[var(--md-sys-color-outline-variant)] overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-high)]">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--md-sys-color-primary)]">
                  Reference Lookup
                </div>
                <h3 className="text-xl font-normal text-[var(--md-sys-color-on-surface)]">
                  Select {label} <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">({targetTable})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Reference Qualifier Badge / Assist Chip */}
            {dependentField && dependentValue && (
              <div className="px-6 py-3 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-xs font-medium bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
                  <Filter className="w-3.5 h-3.5" />
                  Filtered by {dependentLabel || dependentField}:{" "}
                  <strong>{dependentDisplayValue || dependentValue}</strong>
                </span>
                {dependentApplied && (
                  <span className="ml-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    (via sys_user_grmember)
                  </span>
                )}
              </div>
            )}

            {/* Search Input Bar */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search by name, identifier, or keyword...`}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-sm text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 outline-none transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Table / List */}
            <div className="flex-1 overflow-y-auto min-h-[240px] bg-[var(--md-sys-color-surface-container-lowest)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
                  Fetching records...
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  <p className="font-medium text-[var(--md-sys-color-on-surface)]">No records found</p>
                  <p className="text-xs mt-1">
                    {search
                      ? `No match for "${search}". Try adjusting your search query.`
                      : dependentField && dependentValue
                      ? `No members found matching active filter.`
                      : `The table '${targetTable}' contains no active records.`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                      <th className="py-2.5 px-4">Display Value</th>
                      <th className="py-2.5 px-4">Secondary Information</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {candidates.map((item) => {
                      const isSelected = item.value === recordId;
                      return (
                        <tr
                          key={item.value}
                          onClick={() => handleSelect(item)}
                          className={`cursor-pointer transition-colors hover:bg-[var(--md-sys-color-surface-container-high)] ${
                            isSelected ? "bg-[var(--md-sys-color-primary-container)]/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                            {isSelected && <Check className="w-4 h-4 text-[var(--md-sys-color-primary)] flex-shrink-0" />}
                            <span>{item.display_value}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                            {item.subtitle || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(item);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected
                                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                                  : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer with Pagination */}
            <div className="px-6 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <div>
                Showing <strong>{candidates.length}</strong> of <strong>{total}</strong> entries
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => fetchCandidates(page - 1, search)}
                  className="p-1 rounded border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40 hover:bg-[var(--md-sys-color-surface-container)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => fetchCandidates(page + 1, search)}
                  className="p-1 rounded border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40 hover:bg-[var(--md-sys-color-surface-container)]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
