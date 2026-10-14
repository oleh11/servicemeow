"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ThumbsUp,
  Eye,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function KnowledgeBasePortal() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    // We can fetch tasks or articles
    fetch("/api/now/table/kb_knowledge")
      .catch(() => {})
      .then(async () => {
        // We can fetch via specialized or task API
      });
  }, []);

  return <KnowledgeBaseClient />;
}

function KnowledgeBaseClient() {
  const [articles, setArticles] = useState<any[]>([
    {
      id: "1",
      number: "KB0001001",
      title: "How to configure GlobalProtect VPN client on macOS & Windows",
      category: "Network",
      views: 1420,
      helpfulVotes: 98,
      content: `### Overview
This article provides step-by-step instructions for connecting to the corporate network using Palo Alto GlobalProtect.

### Prerequisites
- Active Okta / Auth0 corporate credentials
- Hardware token or Authenticator app registered

### Steps to Connect
1. Download GlobalProtect from the internal software portal.
2. Enter the portal address: **vpn-gw-east.corp.internal**
3. When prompted, complete your single sign-on authentication.
4. Verify the shield icon turns blue with the status **Connected**.

### Troubleshooting Common Errors
- **Connection Timeout**: Ensure you are not connected to another VPN or captive Wi-Fi portal.
- **Certificate Warning**: Download and trust the root internal CA certificate via Keychain or Certificate Manager.`,
    },
    {
      id: "2",
      number: "KB0001002",
      title: "Developer Guide: Requesting Temporary Elevated Cloud Access via AWS IAM",
      category: "Cloud Services",
      views: 890,
      helpfulVotes: 74,
      content: `### Policy Summary
Production cloud access requires zero-standing-privilege (ZSP) enforcement. All write permissions to production AWS accounts must be requested through ServiceMeow Service Catalog.

### Approval Requirements
- **Sandbox**: Auto-approved within 5 minutes.
- **Staging**: Team lead approval required.
- **Production**: CAB approval + ticket link required.

### Session Duration
All elevated IAM roles expire after 4 hours. Re-authentication with MFA is required to renew.`,
    },
    {
      id: "3",
      number: "KB0001003",
      title: "Workstation Hardware Refresh Policy & Procurement Schedule",
      category: "Hardware",
      views: 630,
      helpfulVotes: 45,
      content: `### Refresh Eligibility
- Engineering and Design staff are eligible for hardware refresh every 24 months.
- General business and administrative staff are eligible every 36 months.

### Standard Equipment
Laptops are provisioned with 3-year AppleCare+ or Dell ProSupport Plus with next-business-day on-site repair.`,
    },
  ]);

  const [selectedArticle, setSelectedArticle] = useState<any>(articles[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [helpfulCount, setHelpfulCount] = useState(selectedArticle.helpfulVotes);
  const [hasVoted, setHasVoted] = useState(false);

  const categories = ["all", "Network", "Cloud Services", "Hardware"];

  const filtered = articles.filter((a) => {
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    const matchSearch =
      !search.trim() ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleVote = () => {
    if (hasVoted) return;
    setHelpfulCount(helpfulCount + 1);
    setHasVoted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ITIL Knowledge Base</h1>
          <p className="text-xs text-slate-500">Verified IT guides, security runbooks, and self-service documentation.</p>
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles & guides..."
            className="w-full bg-white border rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-emerald-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 text-xs">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1 rounded-full font-semibold capitalize transition-colors ${
              categoryFilter === c
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Article Navigation List */}
        <div className="space-y-3">
          {filtered.map((art) => (
            <div
              key={art.id}
              onClick={() => {
                setSelectedArticle(art);
                setHelpfulCount(art.helpfulVotes);
                setHasVoted(false);
              }}
              className={`p-4 rounded-xl border bg-white shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 ${
                selectedArticle.id === art.id ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10" : ""
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono text-emerald-700 font-bold">{art.number}</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">{art.category}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-xs line-clamp-2">{art.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{art.views} reads</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <ThumbsUp className="w-3 h-3" /> {art.helpfulVotes}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Article Reading Pane */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-xs p-6 space-y-6">
          <div className="border-b pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-700 text-xs">{selectedArticle.number}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {selectedArticle.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{selectedArticle.title}</h2>
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {selectedArticle.views} Views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> {helpfulCount} Found Helpful
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ITIL Certified Solution
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
            {selectedArticle.content}
          </div>

          {/* Feedback section */}
          <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Was this article helpful to you?</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVote}
                disabled={hasVoted}
                className={`flex items-center gap-1 px-3 py-1.5 rounded font-semibold transition-colors ${
                  hasVoted ? "bg-emerald-100 text-emerald-800" : "bg-white border hover:bg-emerald-50 text-slate-700"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{hasVoted ? "Thank you!" : "Yes, solved my issue"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
