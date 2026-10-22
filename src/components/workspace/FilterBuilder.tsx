"use client";

import React, { useState } from "react";
import { Filter, Play, Plus, X, ChevronRight, RotateCcw } from "lucide-react";

export interface FilterCondition {
  id: string;
  field: string;
  operator: "=" | "!=" | ">" | "<" | "LIKE" | "STARTSWITH";
  value: string;
}

interface FilterBuilderProps {
  tableName: string;
  onApplyFilter: (queryString: string) => void;
  activeConditions: FilterCondition[];
}

export function FilterBuilder({ tableName, onApplyFilter, activeConditions }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>(
    activeConditions.length > 0
      ? activeConditions
      : [{ id: "1", field: "state", operator: "!=", value: "7" }]
  );

  const getAvailableFields = (tbl: string) => {
    switch (tbl) {
      case "incident":
      case "task":
        return [
          {
            value: "state",
            label: "State",
            options: [
              { label: "New (1)", val: "1" },
              { label: "In Progress (2)", val: "2" },
              { label: "On Hold (3)", val: "3" },
              { label: "Resolved (6)", val: "6" },
              { label: "Closed (7)", val: "7" },
            ],
          },
          {
            value: "priority",
            label: "Priority",
            options: [
              { label: "1 - Critical", val: "1" },
              { label: "2 - High", val: "2" },
              { label: "3 - Moderate", val: "3" },
              { label: "4 - Low", val: "4" },
            ],
          },
          {
            value: "category",
            label: "Category",
            options: [
              { label: "Inquiry", val: "inquiry" },
              { label: "Software", val: "software" },
              { label: "Hardware", val: "hardware" },
              { label: "Network", val: "network" },
              { label: "Database", val: "database" },
            ],
          },
          { value: "short_description", label: "Short Description", isText: true },
        ];
      case "change_request":
        return [
          {
            value: "state",
            label: "State",
            options: [
              { label: "Draft (1)", val: "1" },
              { label: "Assess / Review (2)", val: "2" },
              { label: "Scheduled (3)", val: "3" },
              { label: "Implemented (6)", val: "6" },
              { label: "Closed (7)", val: "7" },
            ],
          },
          {
            value: "risk",
            label: "Risk Level",
            options: [
              { label: "High Risk", val: "high" },
              { label: "Moderate Risk", val: "moderate" },
              { label: "Low Risk", val: "low" },
            ],
          },
          {
            value: "cab_approval_state",
            label: "CAB Approval",
            options: [
              { label: "Requested", val: "requested" },
              { label: "Approved", val: "approved" },
              { label: "Rejected", val: "rejected" },
            ],
          },
          { value: "short_description", label: "Summary", isText: true },
        ];
      case "problem":
        return [
          {
            value: "state",
            label: "State",
            options: [
              { label: "New (1)", val: "1" },
              { label: "Under Investigation (2)", val: "2" },
              { label: "Workaround Established (3)", val: "3" },
              { label: "Known Error (4)", val: "4" },
              { label: "Resolved (6)", val: "6" },
              { label: "Closed (7)", val: "7" },
            ],
          },
          {
            value: "priority",
            label: "Priority",
            options: [
              { label: "1 - Critical", val: "1" },
              { label: "2 - High", val: "2" },
              { label: "3 - Moderate", val: "3" },
              { label: "4 - Low", val: "4" },
            ],
          },
          { value: "short_description", label: "Summary", isText: true },
        ];
      case "cmdb_ci":
        return [
          {
            value: "operational_status",
            label: "Operational Status",
            options: [
              { label: "Operational", val: "operational" },
              { label: "Non-Operational / Outage", val: "non_operational" },
              { label: "Maintenance", val: "maintenance" },
              { label: "Retired", val: "retired" },
            ],
          },
          {
            value: "environment",
            label: "Environment",
            options: [
              { label: "Production", val: "production" },
              { label: "Staging", val: "staging" },
              { label: "Development", val: "dev" },
            ],
          },
          { value: "name", label: "CI Name", isText: true },
        ];
      default:
        return [
          {
            value: "state",
            label: "State",
            options: [
              { label: "Active", val: "1" },
              { label: "Inactive / Closed", val: "7" },
            ],
          },
          { value: "short_description", label: "Description", isText: true },
        ];
    }
  };

  const availableFields = getAvailableFields(tableName);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: String(Date.now()), field: availableFields[0].value, operator: "=", value: "1" },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, patch: Partial<FilterCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleRun = () => {
    const queryParts = conditions.map((c) => `${c.field}${c.operator}${c.value}`);
    const queryStr = queryParts.join("^");
    onApplyFilter(queryStr);
    setIsOpen(false);
  };

  const handleReset = () => {
    setConditions([]);
    onApplyFilter("");
    setIsOpen(false);
  };

  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-4">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs border-b-2 border-black bg-neutral-50 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 font-mono text-xs font-black uppercase px-2.5 py-1 border border-black transition-colors cursor-pointer ${
              isOpen
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Builder</span>
            {conditions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] rounded-none">
                {conditions.length}
              </span>
            )}
          </button>

          <span className="text-neutral-400 font-mono font-bold px-1">&gt;</span>
          <span className="font-mono font-extrabold text-black uppercase tracking-tight">
            All {tableName}s
          </span>

          {conditions.map((c) => {
            const fieldMeta = availableFields.find((f) => f.value === c.field);
            const valLabel = fieldMeta?.options?.find((o) => o.val === c.value)?.label || c.value;
            const opLabel =
              c.operator === "="
                ? "is"
                : c.operator === "!="
                ? "is not"
                : c.operator === "LIKE"
                ? "contains"
                : c.operator === "STARTSWITH"
                ? "starts with"
                : c.operator;

            return (
              <React.Fragment key={c.id}>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
                <span className="bg-white text-black px-2 py-0.5 border border-black font-mono text-[11px] font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  {fieldMeta?.label || c.field} <span className="text-neutral-500 font-normal">{opLabel}</span> {valLabel}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {conditions.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 border border-black bg-white hover:bg-neutral-100 text-black font-mono text-xs font-bold uppercase px-2.5 py-1 transition-colors cursor-pointer"
              title="Clear all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRun}
            className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-black uppercase px-3 py-1 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Expanded Interactive Condition Rows */}
      {isOpen && (
        <div className="p-4 bg-neutral-100/70 border-t-2 border-black space-y-3 text-xs">
          {conditions.length === 0 ? (
            <div className="font-mono text-neutral-500 text-xs py-2">
              No filter conditions active. All records are currently shown.
            </div>
          ) : (
            conditions.map((cond, index) => {
              const fieldDef = availableFields.find((f) => f.value === cond.field);

              return (
                <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                  <span className="w-12 text-black font-mono font-black text-[11px] uppercase">
                    {index === 0 ? "WHERE" : "AND"}
                  </span>

                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                    className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black focus:outline-none"
                  >
                    {availableFields.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond.id, { operator: e.target.value as any })}
                    className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black focus:outline-none"
                  >
                    <option value="=">is</option>
                    <option value="!=">is not</option>
                    <option value="LIKE">contains</option>
                    <option value="STARTSWITH">starts with</option>
                    <option value=">">greater than</option>
                    <option value="<">less than</option>
                  </select>

                  {fieldDef?.options && cond.operator !== "LIKE" && cond.operator !== "STARTSWITH" ? (
                    <select
                      value={cond.value}
                      onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                      className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black focus:outline-none"
                    >
                      {fieldDef.options.map((opt) => (
                        <option key={opt.val} value={opt.val}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                      placeholder="Enter value..."
                      className="border-2 border-black bg-white px-2 py-1 font-mono text-xs text-black focus:outline-none"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeCondition(cond.id)}
                    className="border border-black bg-white text-neutral-500 hover:text-red-600 hover:bg-neutral-100 p-1 cursor-pointer"
                    title="Remove condition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}

          <div className="pt-2 flex items-center justify-between border-t border-neutral-300">
            <button
              type="button"
              onClick={addCondition}
              className="flex items-center gap-1 font-mono text-xs font-bold uppercase text-black hover:text-neutral-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add AND Condition</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 border border-black font-mono text-xs font-bold uppercase hover:bg-neutral-200 cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={handleRun}
                className="px-4 py-1 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Run Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
