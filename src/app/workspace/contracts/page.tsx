"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Trash2,
  Edit3,
  X,
  ShieldCheck,
} from "lucide-react";

interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  vendor: string;
  contractType: string;
  cost: number;
  startDate: string;
  endDate: string;
  status: string;
  terms?: string;
  daysRemaining: number;
  computedStatus: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [contractType, setContractType] = useState("service");
  const [cost, setCost] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/contracts");
      if (res.ok) {
        const json = await res.json();
        setContracts(json.result || []);
      }
    } catch (e) {
      console.error("Error loading contracts:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setContractNumber(`CTR-2026-${String(contracts.length + 1).padStart(3, "0")}`);
    setName("");
    setVendor("");
    setContractType("service");
    setCost(0);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setTerms("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Contract) => {
    setEditingId(c.id);
    setContractNumber(c.contractNumber);
    setName(c.name);
    setVendor(c.vendor);
    setContractType(c.contractType);
    setCost(c.cost);
    setStartDate(new Date(c.startDate).toISOString().split("T")[0]);
    setEndDate(new Date(c.endDate).toISOString().split("T")[0]);
    setTerms(c.terms || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: editingId || undefined,
        contractNumber,
        name,
        vendor,
        contractType,
        cost: Number(cost) || 0,
        startDate,
        endDate,
        terms,
      };

      const res = await fetch("/api/now/contracts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadContracts();
      }
    } catch (e) {
      console.error("Error saving contract:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to delete contract ${num}?`)) return;
    try {
      const res = await fetch(`/api/now/contracts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadContracts();
      }
    } catch (e) {
      console.error("Error deleting contract:", e);
    }
  };

  // Metrics
  const totalValue = contracts.reduce((acc, c) => acc + (c.cost || 0), 0);
  const activeCount = contracts.filter((c) => c.computedStatus === "active").length;
  const expiringCount = contracts.filter((c) => c.computedStatus === "expiring_soon").length;
  const expiredCount = contracts.filter((c) => c.computedStatus === "expired").length;

  const filteredContracts = contracts.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.computedStatus === statusFilter;
    if (!search.trim()) return matchesStatus;
    const q = search.toLowerCase();
    return (
      matchesStatus &&
      (c.contractNumber.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        c.contractType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">ITAM Contracts & Vendor Agreements</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              ast_contract
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage hardware maintenance leases, software licensing entitlements, vendor SLAs, and automated renewal countdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadContracts}
            className="p-2 border rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Agreement</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-medium">Total Managed Portfolio</span>
          <div className="flex items-baseline gap-1">
            <DollarSign className="w-4 h-4 text-emerald-600 self-center" />
            <span className="text-xl font-bold text-slate-900">{totalValue.toLocaleString()}</span>
            <span className="text-xs text-slate-400">USD</span>
          </div>
          <p className="text-[10px] text-slate-400">{contracts.length} enterprise agreements</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-medium">Active & Compliant</span>
          <div className="text-xl font-bold text-emerald-600">{activeCount}</div>
          <p className="text-[10px] text-slate-400">Validated vendor support</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-medium">Expiring &lt; 30 Days</span>
          <div className="text-xl font-bold text-amber-600">{expiringCount}</div>
          <p className="text-[10px] text-amber-600 font-medium">Action required for renewal</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-medium">Expired Contracts</span>
          <div className="text-xl font-bold text-rose-600">{expiredCount}</div>
          <p className="text-[10px] text-slate-400">Archived or pending RMA</p>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Agreements" },
            { id: "active", label: "Active" },
            { id: "expiring_soon", label: "Expiring Soon" },
            { id: "expired", label: "Expired" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === st.id
                  ? "bg-teal-600 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreement number, vendor, title..."
            className="w-full bg-slate-50 border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4">Contract #</th>
              <th className="p-4">Agreement Name & Details</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Type</th>
              <th className="p-4">Value ($)</th>
              <th className="p-4">Expiration / SLA</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs text-slate-700">
            {filteredContracts.map((c) => {
              const isExpiring = c.computedStatus === "expiring_soon";
              const isExpired = c.computedStatus === "expired";

              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-teal-700">{c.contractNumber}</td>
                  <td className="p-4 font-semibold text-slate-900 max-w-sm">
                    <div>
                      <span>{c.name}</span>
                      {c.terms && (
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1">{c.terms}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.vendor}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                      {c.contractType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900">
                    ${c.cost.toLocaleString()}
                  </td>
                  <td className="p-4">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Expired ({Math.abs(c.daysRemaining)}d ago)</span>
                      </span>
                    ) : isExpiring ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Renews in {c.daysRemaining} days</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active ({c.daysRemaining}d left)</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit Agreement"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.contractNumber)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Agreement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create / Edit Contract */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? "Edit Contract Agreement" : "New Contract Agreement"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract Number *</label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full border rounded-lg p-2 font-mono text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier *</label>
                  <input
                    type="text"
                    required
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agreement Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Enterprise 24x7 Infrastructure Support"
                  className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract Type</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                  >
                    <option value="service">Service & Cloud Support</option>
                    <option value="software_license">Software Licensing</option>
                    <option value="hardware_lease">Hardware Chassis Lease</option>
                    <option value="maintenance">Maintenance & RMA Care</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Cost ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Renewal / End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms & SLA Details</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g. 15-minute response SLA for critical outages..."
                  className="w-full border rounded-lg p-2 text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-full text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full shadow-xs"
                >
                  {saving ? "Saving..." : "Save Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
