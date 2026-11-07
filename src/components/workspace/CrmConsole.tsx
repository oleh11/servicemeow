"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ShieldCheck,
  Briefcase,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string; // lead, qualified, proposal, negotiation, won, lost
  probability: number;
  expectedCloseDate?: string | null;
  organization?: { id: string; name: string; tier?: string } | null;
  contact?: { id: string; name: string; email?: string } | null;
  assignedTo?: { id: string; name: string } | null;
  notes?: string | null;
}

interface Organization {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  tier: string;
  status: string;
  healthScore: number;
  assignedTo?: { id: string; name: string } | null;
  contacts?: Array<{ id: string; name: string; email: string; isPrimary: boolean }>;
  deals?: Array<{ id: string; title: string; amount: number; stage: string }>;
  tasks?: Array<{ id: string; number: string; shortDescription: string }>;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  isPrimary: boolean;
  organization?: { id: string; name: string } | null;
}

const STAGES = [
  { key: "lead", label: "01 / LEAD", color: "border-slate-400 bg-slate-50", badge: "bg-slate-200 text-slate-800" },
  { key: "qualified", label: "02 / QUALIFIED", color: "border-blue-400 bg-blue-50/50", badge: "bg-blue-100 text-blue-900" },
  { key: "proposal", label: "03 / PROPOSAL", color: "border-amber-400 bg-amber-50/50", badge: "bg-amber-100 text-amber-900" },
  { key: "negotiation", label: "04 / NEGOTIATION", color: "border-purple-400 bg-purple-50/50", badge: "bg-purple-100 text-purple-900" },
  { key: "won", label: "05 / CLOSED WON", color: "border-emerald-500 bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-900" },
];

export function CrmConsole() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<"pipeline" | "organizations" | "contacts">("pipeline");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealAmount, setNewDealAmount] = useState<number>(50000);
  const [newDealStage, setNewDealStage] = useState("lead");
  const [newDealOrgId, setNewDealOrgId] = useState("");
  const [newDealNotes, setNewDealNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dealsRes, orgsRes, contactsRes] = await Promise.all([
        fetch("/api/now/table/crm_deal?sysparm_limit=100").then((r) => r.json()),
        fetch("/api/now/table/crm_organization?sysparm_limit=100").then((r) => r.json()),
        fetch("/api/now/table/crm_contact?sysparm_limit=100").then((r) => r.json()),
      ]);

      if (dealsRes.result) setDeals(dealsRes.result);
      if (orgsRes.result) setOrganizations(orgsRes.result);
      if (contactsRes.result) setContacts(contactsRes.result);
    } catch (err) {
      console.error("Error loading CRM data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      // Optimistic update
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
      );

      await fetch(`/api/now/table/crm_deal/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (err) {
      console.error("Error updating deal stage:", err);
      loadAllData();
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/now/table/crm_deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDealTitle,
          amount: Number(newDealAmount),
          stage: newDealStage,
          organization_id: newDealOrgId || null,
          notes: newDealNotes,
          assigned_to_id: currentUser.id,
        }),
      });

      if (res.ok) {
        setShowNewDealModal(false);
        setNewDealTitle("");
        setNewDealNotes("");
        await loadAllData();
      }
    } catch (err) {
      console.error("Error creating deal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalPipeline = deals.reduce((acc, d) => acc + (d.stage !== "lost" ? d.amount : 0), 0);
  const wonRevenue = deals.filter((d) => d.stage === "won").reduce((acc, d) => acc + d.amount, 0);
  const weightedPipeline = deals.reduce(
    (acc, d) => acc + (d.stage !== "lost" && d.stage !== "won" ? (d.amount * d.probability) / 100 : 0),
    0
  );
  const avgHealth =
    organizations.length > 0
      ? Math.round(organizations.reduce((acc, o) => acc + o.healthScore, 0) / organizations.length)
      : 100;

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-black pb-16">
      {/* Swiss Header Strip */}
      <div className="border-b-2 border-black bg-white px-6 py-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#eb0029] uppercase mb-1">
              <span>CUSTOMER SERVICE MANAGEMENT • CRM ENGINE</span>
              <span className="w-2 h-2 rounded-full bg-[#eb0029] animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-black stroke-[2.5]" />
              Enterprise CRM & Accounts Cockpit
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData()}
              className="p-2.5 border-2 border-black bg-white hover:bg-neutral-100 transition-colors"
              title="Refresh CRM Data"
            >
              <RefreshCw className={`w-4 h-4 text-black ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowNewDealModal(true)}
              className="px-4 py-2.5 border-2 border-black bg-[#eb0029] hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Opportunity / Deal
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-7xl mx-auto mt-6 flex border-b-2 border-black">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t-2 border-x-2 -mb-[2px] transition-colors ${
              activeTab === "pipeline"
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-600 border-transparent hover:text-black"
            }`}
          >
            <Kanban className="w-4 h-4" />
            Deal Pipeline ({deals.length})
          </button>
          <button
            onClick={() => setActiveTab("organizations")}
            className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t-2 border-x-2 -mb-[2px] transition-colors ${
              activeTab === "organizations"
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-600 border-transparent hover:text-black"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Customer Organizations ({organizations.length})
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t-2 border-x-2 -mb-[2px] transition-colors ${
              activeTab === "contacts"
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-600 border-transparent hover:text-black"
            }`}
          >
            <Users className="w-4 h-4" />
            Contacts Directory ({contacts.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top 4-Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border-2 border-black bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-500">
              <span>01 / TOTAL PIPELINE</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-black mt-2">
              ${totalPipeline.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 mt-1">
              Active Opportunities
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-500">
              <span>02 / WEIGHTED FORECAST</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-black mt-2">
              ${Math.round(weightedPipeline).toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 mt-1">
              Probability Weighted Value
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-500">
              <span>03 / CLOSED WON</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-black mt-2">
              ${wonRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 mt-1">
              Executed Contracts
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-500">
              <span>04 / ACCOUNT HEALTH</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-black mt-2">
              {avgHealth}%
            </div>
            <div className="text-[11px] font-mono text-neutral-600 mt-1">
              Across {organizations.length} Enterprise Orgs
            </div>
          </div>
        </div>

        {/* Tab 1: Deal Pipeline Kanban */}
        {activeTab === "pipeline" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            {STAGES.map((col) => {
              const colDeals = deals.filter((d) => d.stage === col.key);
              const colTotal = colDeals.reduce((sum, d) => sum + d.amount, 0);

              return (
                <div key={col.key} className="border-2 border-black bg-white flex flex-col">
                  {/* Column Header */}
                  <div className={`p-3 border-b-2 border-black ${col.color}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold tracking-tight">
                        {col.label}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded ${col.badge}`}>
                        {colDeals.length}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-neutral-700 mt-1">
                      ${colTotal.toLocaleString()}
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="p-2 space-y-2 min-h-[360px] bg-neutral-50">
                    {colDeals.length === 0 ? (
                      <div className="text-center py-10 font-mono text-xs text-neutral-400">
                        No deals in stage
                      </div>
                    ) : (
                      colDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="border border-black bg-white p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-xs leading-snug line-clamp-2">
                                {deal.title}
                              </h4>
                            </div>
                            <div className="text-[11px] font-mono font-bold text-emerald-700 mt-1">
                              ${deal.amount.toLocaleString()}
                            </div>
                            {deal.organization && (
                              <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-mono mt-1">
                                <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span className="truncate">{deal.organization.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Stage Transition Buttons */}
                          <div className="border-t border-neutral-100 pt-2 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-neutral-400 font-bold">{deal.probability}% Prob</span>
                            <div className="flex items-center gap-1">
                              {col.key !== "lead" && (
                                <button
                                  onClick={() => {
                                    const currIdx = STAGES.findIndex((s) => s.key === col.key);
                                    if (currIdx > 0) handleStageChange(deal.id, STAGES[currIdx - 1].key);
                                  }}
                                  className="px-1.5 py-0.5 border border-neutral-300 hover:border-black bg-white"
                                  title="Previous Stage"
                                >
                                  ←
                                </button>
                              )}
                              {col.key !== "won" && (
                                <button
                                  onClick={() => {
                                    const currIdx = STAGES.findIndex((s) => s.key === col.key);
                                    if (currIdx < STAGES.length - 1) handleStageChange(deal.id, STAGES[currIdx + 1].key);
                                  }}
                                  className="px-1.5 py-0.5 border border-black bg-neutral-900 text-white font-bold hover:bg-black flex items-center gap-0.5"
                                  title="Next Stage"
                                >
                                  <span>Advance</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Organizations Directory */}
        {activeTab === "organizations" && (
          <div className="border-2 border-black bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-black" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                  Enterprise Customer Accounts ({organizations.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-neutral-100 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
                    <th className="p-3 border-r border-neutral-300">Organization Name</th>
                    <th className="p-3 border-r border-neutral-300">Domain / Industry</th>
                    <th className="p-3 border-r border-neutral-300">Tier</th>
                    <th className="p-3 border-r border-neutral-300">Account Health</th>
                    <th className="p-3 border-r border-neutral-300">Primary Contact</th>
                    <th className="p-3 border-r border-neutral-300">Active Pipeline</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {organizations.map((org) => {
                    const primaryContact = org.contacts?.find((c) => c.isPrimary) || org.contacts?.[0];
                    const orgPipeline = org.deals?.reduce((sum, d) => sum + d.amount, 0) || 0;

                    return (
                      <tr key={org.id} className="hover:bg-neutral-50 font-sans">
                        <td className="p-3 border-r border-neutral-200 font-bold">
                          <div className="text-sm">{org.name}</div>
                          <div className="text-[11px] font-mono text-neutral-500">ID: {org.id.slice(-8)}</div>
                        </td>
                        <td className="p-3 border-r border-neutral-200 font-mono">
                          <div>{org.domain || "—"}</div>
                          <div className="text-neutral-500 text-[11px]">{org.industry || "General"}</div>
                        </td>
                        <td className="p-3 border-r border-neutral-200 font-mono">
                          <span className="px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-neutral-100">
                            {org.tier}
                          </span>
                        </td>
                        <td className="p-3 border-r border-neutral-200 font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              org.healthScore >= 90
                                ? "bg-emerald-100 text-emerald-800"
                                : org.healthScore >= 75
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {org.healthScore}% Nominal
                          </span>
                        </td>
                        <td className="p-3 border-r border-neutral-200">
                          {primaryContact ? (
                            <div>
                              <div className="font-bold">{primaryContact.name}</div>
                              <div className="text-[11px] font-mono text-neutral-500">{primaryContact.email}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="p-3 border-r border-neutral-200 font-mono font-bold text-emerald-700">
                          ${orgPipeline.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/workspace/crm_organization/${org.id}`}
                            className="px-2.5 py-1 border border-black text-xs font-mono font-bold bg-white hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Contacts Directory */}
        {activeTab === "contacts" && (
          <div className="border-2 border-black bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-black bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-black" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
                  Customer Contacts Directory ({contacts.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-neutral-100 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
                    <th className="p-3 border-r border-neutral-300">Name / Title</th>
                    <th className="p-3 border-r border-neutral-300">Customer Organization</th>
                    <th className="p-3 border-r border-neutral-300">Email</th>
                    <th className="p-3 border-r border-neutral-300">Phone</th>
                    <th className="p-3 border-r border-neutral-300">Primary Contact</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3 border-r border-neutral-200 font-bold">
                        <div className="text-sm">{contact.name}</div>
                        <div className="text-[11px] font-mono text-neutral-500">{contact.title || "Customer Stakeholder"}</div>
                      </td>
                      <td className="p-3 border-r border-neutral-200 font-mono">
                        {contact.organization ? contact.organization.name : "—"}
                      </td>
                      <td className="p-3 border-r border-neutral-200 font-mono flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{contact.email}</span>
                      </td>
                      <td className="p-3 border-r border-neutral-200 font-mono">
                        {contact.phone || "—"}
                      </td>
                      <td className="p-3 border-r border-neutral-200 font-mono">
                        {contact.isPrimary ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-400 font-bold text-[10px]">
                            PRIMARY
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/workspace/crm_contact/${contact.id}`}
                          className="px-2.5 py-1 border border-black text-xs font-mono font-bold bg-white hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Deal Modal */}
      {showNewDealModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="border-4 border-black bg-white max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#eb0029]" />
                <h3 className="font-mono text-base font-extrabold uppercase">Create New Opportunity</h3>
              </div>
              <button
                onClick={() => setShowNewDealModal(false)}
                className="font-mono font-bold text-sm px-2 py-1 border border-black hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase mb-1">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDealTitle}
                  onChange={(e) => setNewDealTitle(e.target.value)}
                  placeholder="e.g. Acme 500-Rack Datacenter ESM Expansion"
                  className="w-full p-2.5 border-2 border-black font-sans focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase mb-1">
                    Contract Value ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newDealAmount}
                    onChange={(e) => setNewDealAmount(Number(e.target.value))}
                    className="w-full p-2.5 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newDealStage}
                    onChange={(e) => setNewDealStage(e.target.value)}
                    className="w-full p-2.5 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase mb-1">
                  Customer Organization
                </label>
                <select
                  value={newDealOrgId}
                  onChange={(e) => setNewDealOrgId(e.target.value)}
                  className="w-full p-2.5 border-2 border-black font-sans focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
                >
                  <option value="">— Select Customer Organization —</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold uppercase mb-1">
                  Deal Notes & Scope Summary
                </label>
                <textarea
                  rows={3}
                  value={newDealNotes}
                  onChange={(e) => setNewDealNotes(e.target.value)}
                  placeholder="Outline client service requirements, rack quantities, and SLA terms..."
                  className="w-full p-2.5 border-2 border-black font-sans focus:outline-none focus:ring-2 focus:ring-[#eb0029]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowNewDealModal(false)}
                  className="px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDealTitle.trim()}
                  className="px-5 py-2 border-2 border-black bg-[#eb0029] hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
