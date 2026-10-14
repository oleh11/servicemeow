"use client";

import React, { useState } from "react";
import { Filter, Play, Plus, X, ChevronRight } from "lucide-react";

export interface FilterCondition {
  id: string;
  field: string;
  operator: "=" | "!=" | ">" | "<";
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

  const availableFields = [
    { value: "state", label: "State", options: [{ label: "New", val: "1" }, { label: "In Progress", val: "2" }, { label: "On Hold", val: "3" }, { label: "Resolved", val: "6" }, { label: "Closed", val: "7" }] },
    { value: "priority", label: "Priority", options: [{ label: "1 - Critical", val: "1" }, { label: "2 - High", val: "2" }, { label: "3 - Moderate", val: "3" }, { label: "4 - Low", val: "4" }] },
    { value: "category", label: "Category", options: [{ label: "Inquiry", val: "inquiry" }, { label: "Software", val: "software" }, { label: "Hardware", val: "hardware" }, { label: "Network", val: "network" }, { label: "Database", val: "database" }] },
  ];

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: String(Date.now()), field: "priority", operator: "=", value: "1" },
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

  return (
    <div className="bg-white border rounded-md shadow-sm mb-3">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between px-3 py-2 text-xs border-b">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 font-semibold px-2 py-1 rounded transition-colors ${
              isOpen ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <span className="text-slate-400 font-bold px-1">&gt;</span>
          <span className="font-semibold text-slate-800 capitalize">All {tableName}s</span>

          {conditions.map((c) => {
            const fieldMeta = availableFields.find((f) => f.value === c.field);
            const valLabel = fieldMeta?.options?.find((o) => o.val === c.value)?.label || c.value;
            const opLabel = c.operator === "=" ? "is" : c.operator === "!=" ? "is not" : c.operator;

            return (
              <React.Fragment key={c.id}>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px] border">
                  {fieldMeta?.label || c.field} {opLabel} {valLabel}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        <button
          onClick={handleRun}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded text-xs transition-colors shadow-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Run</span>
        </button>
      </div>

      {/* Expanded Interactive Condition Rows */}
      {isOpen && (
        <div className="p-3 bg-slate-50/70 border-t space-y-2 text-xs">
          {conditions.map((cond, index) => {
            const fieldDef = availableFields.find((f) => f.value === cond.field);

            return (
              <div key={cond.id} className="flex items-center gap-2">
                <span className="w-10 text-slate-500 font-bold text-[11px]">
                  {index === 0 ? "WHERE" : "AND"}
                </span>

                <select
                  value={cond.field}
                  onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                  className="bg-white border rounded px-2 py-1 text-xs text-slate-800 focus:outline-emerald-500"
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
                  className="bg-white border rounded px-2 py-1 text-xs text-slate-800 focus:outline-emerald-500"
                >
                  <option value="=">is</option>
                  <option value="!=">is not</option>
                  <option value=">">greater than</option>
                  <option value="<">less than</option>
                </select>

                {fieldDef?.options ? (
                  <select
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    className="bg-white border rounded px-2 py-1 text-xs text-slate-800 focus:outline-emerald-500"
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
                    className="bg-white border rounded px-2 py-1 text-xs text-slate-800"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={addCondition}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add AND Condition</span>
            </button>
            <button
              type="button"
              onClick={handleRun}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
