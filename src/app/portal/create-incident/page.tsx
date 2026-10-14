"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { AlertCircle, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export default function CreateIncidentPortal() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("software");
  const [urgencyLevel, setUrgencyLevel] = useState("2"); // 1: Blocker, 2: Impaired, 3: Minor
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDescription.trim() || submitting) return;

    setSubmitting(true);
    try {
      const impactVal = urgencyLevel === "1" ? "1" : "2";
      const res = await fetch("/api/now/table/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_description: shortDescription,
          description,
          category,
          impact: impactVal,
          urgency: urgencyLevel,
          caller_id: currentUser.id,
          caller_name: currentUser.name,
          caller_email: currentUser.email,
        }),
      });

      const data = await res.json();
      if (data.result?.number) {
        setSubmittedTicket(data.result.number);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Incident Reported Successfully!</h2>
        <p className="text-sm text-slate-600">
          Your request has been routed to the Service Desk under tracking number:
        </p>
        <div className="font-mono text-xl font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-4 rounded-lg inline-block">
          {submittedTicket}
        </div>
        <p className="text-xs text-slate-400">
          Our on-call technicians have received this incident. You can track updates and converse with technicians directly from My Tickets.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/portal/my-tickets"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 shadow-sm"
          >
            View in My Tickets
          </Link>
          <Link
            href="/portal"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200"
          >
            Back to Service Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/portal"
          className="p-1.5 border rounded hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Report an IT Incident</h1>
          <p className="text-xs text-slate-500">
            Tell us what is broken or malfunctioning so our technicians can triage and resolve it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-xs space-y-5 text-xs">
        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Summary of the Issue <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="e.g. Cannot connect to corporate VPN from hotel network"
            className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-emerald-500"
            >
              <option value="software">Software / Application</option>
              <option value="hardware">Laptop / Monitor / Peripheral</option>
              <option value="network">Network / Wi-Fi / VPN</option>
              <option value="database">Database & Query Access</option>
              <option value="inquiry">General IT Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Business Impact</label>
            <select
              value={urgencyLevel}
              onChange={(e) => setUrgencyLevel(e.target.value)}
              className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-emerald-500"
            >
              <option value="3">Low - Minor nuisance, workaround exists</option>
              <option value="2">Medium - Significantly slows my daily work</option>
              <option value="1">High - Work completely halted / Team blocked</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Detailed Description / Error Messages
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide exact error codes, URLs, screenshots references, or timestamps..."
            className="w-full bg-slate-50 border rounded-lg p-3 text-slate-900 text-xs focus:outline-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Reporting as: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.email})
          </span>
          <button
            type="submit"
            disabled={submitting || !shortDescription.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit Incident Report"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
