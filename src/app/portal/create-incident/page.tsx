"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { ArrowLeft, CheckCircle2, Send, Laptop, Wifi, AppWindow, HelpCircle, AlertTriangle } from "lucide-react";

export default function CreateIncidentPortal() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("hardware");
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
      console.error("Failed to submit incident:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    {
      id: "hardware",
      label: "Computer or Hardware",
      desc: "Laptop, screen, keyboard, mouse, power adapter",
      icon: Laptop,
    },
    {
      id: "network",
      label: "Internet or Wi-Fi",
      desc: "Office Wi-Fi, VPN, home connection, slow network",
      icon: Wifi,
    },
    {
      id: "software",
      label: "Programs or Apps",
      desc: "Email, Slack, Zoom, error messages on screen",
      icon: AppWindow,
    },
    {
      id: "inquiry",
      label: "Something Else",
      desc: "General IT question, password help, or other request",
      icon: HelpCircle,
    },
  ];

  const urgencyOptions = [
    {
      id: "3",
      label: "Low Urgency",
      desc: "I can still do my work. Fix whenever convenient.",
      color: "border-neutral-300 hover:border-black",
      activeColor: "border-black bg-neutral-100",
      indicator: "bg-neutral-400",
    },
    {
      id: "2",
      label: "Normal Urgency",
      desc: "This is slowing me down or causing problems.",
      color: "border-neutral-300 hover:border-amber-500",
      activeColor: "border-amber-600 bg-amber-50/50",
      indicator: "bg-amber-500",
    },
    {
      id: "1",
      label: "Emergency (Work Stopped)",
      desc: "I cannot work at all until this is resolved.",
      color: "border-neutral-300 hover:border-red-600",
      activeColor: "border-red-600 bg-red-50/50",
      indicator: "bg-red-600",
    },
  ];

  if (submittedTicket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="border-2 border-black p-8 md:p-12 bg-white space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span className="font-mono text-sm uppercase tracking-widest font-bold">Report Received</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight uppercase">
            We have received your problem report.
          </h1>

          <p className="text-base text-neutral-700 leading-relaxed">
            Our IT engineers have been alerted. Your unique reference number is:
          </p>

          <div className="border border-black p-4 bg-neutral-50 inline-block">
            <span className="text-xs uppercase font-mono block text-neutral-500 mb-1">Tracking Number</span>
            <span className="text-3xl font-extrabold font-mono text-black">{submittedTicket}</span>
          </div>

          <p className="text-sm text-neutral-600">
            You do not need to do anything else right now. You can check the live progress or write messages to the technician at any time.
          </p>

          <div className="pt-6 border-t border-neutral-200 flex flex-wrap gap-4">
            <Link
              href="/portal/my-tickets"
              className="px-6 py-4 bg-black text-white text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
            >
              <span>View in My Requests &rarr;</span>
            </Link>
            <Link
              href="/portal"
              className="px-6 py-4 border border-black text-black text-sm font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Swiss Header Bar */}
      <div className="border-b-2 border-black pb-6 space-y-2">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Main Screen</span>
        </Link>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold text-red-600">01 /</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
            Report a Problem
          </h1>
        </div>
        <p className="text-sm sm:text-base text-neutral-600 max-w-2xl">
          Complete the four simple steps below. No technical jargon needed. An IT technician will be assigned immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Summary */}
        <div className="border border-neutral-300 p-6 bg-white space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase">Step 01 &mdash;</span>
            <label htmlFor="problem-summary" className="font-bold text-base uppercase tracking-tight text-black">
              What is wrong? <span className="text-red-600">*</span>
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Describe the issue in plain words (e.g. &ldquo;My laptop screen is completely black&rdquo; or &ldquo;Cannot log in to email&rdquo;).
          </p>
          <input
            id="problem-summary"
            type="text"
            required
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Type your problem here..."
            className="w-full text-base px-4 py-3 border-2 border-black text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        {/* Step 2: Category Matrix */}
        <div className="border border-neutral-300 p-6 bg-white space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase">Step 02 &mdash;</span>
            <span className="font-bold text-base uppercase tracking-tight text-black">
              What kind of problem is this?
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Click the card that best matches what you are experiencing:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`text-left p-4 border-2 transition-all flex items-start gap-4 cursor-pointer ${
                    isSelected
                      ? "border-black bg-neutral-100 ring-1 ring-black"
                      : "border-neutral-200 hover:border-neutral-400 bg-white"
                  }`}
                >
                  <div className={`p-2.5 shrink-0 ${isSelected ? "bg-black text-white" : "bg-neutral-100 text-black"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-black uppercase tracking-tight">{c.label}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{c.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Urgency Matrix */}
        <div className="border border-neutral-300 p-6 bg-white space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase">Step 03 &mdash;</span>
            <span className="font-bold text-base uppercase tracking-tight text-black">
              How urgent is this?
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Let us know if you can still work so we can prioritize correctly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {urgencyOptions.map((u) => {
              const isSelected = urgencyLevel === u.id;
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setUrgencyLevel(u.id)}
                  className={`text-left p-4 border-2 transition-all cursor-pointer space-y-2 ${
                    isSelected ? u.activeColor : u.color
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${u.indicator}`} />
                    <span className="font-bold text-sm uppercase text-black">{u.label}</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{u.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Additional Details */}
        <div className="border border-neutral-300 p-6 bg-white space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase">Step 04 &mdash;</span>
            <label htmlFor="problem-details" className="font-bold text-base uppercase tracking-tight text-black">
              Extra details (Optional)
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            If you have an error code, link, or more details, write them here. If not, feel free to leave this blank.
          </p>
          <textarea
            id="problem-details"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Type any additional details or error messages..."
            className="w-full text-sm p-4 border border-neutral-300 text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
          />
        </div>

        {/* Action Submit Bar */}
        <div className="border-t-2 border-black pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-neutral-500 font-mono">
            Submitting as: <strong className="text-black">{currentUser.name}</strong> ({currentUser.email})
          </div>

          <button
            type="submit"
            disabled={submitting || !shortDescription.trim()}
            className="px-8 py-5 bg-black hover:bg-neutral-800 text-white font-bold text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-none"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? "Sending Report..." : "Submit Problem Report"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
