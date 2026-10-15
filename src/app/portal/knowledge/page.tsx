"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Plus,
  X,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface KnowledgeArticle {
  id: string;
  sys_id?: string;
  number: string;
  title: string;
  short_description?: string;
  category: string;
  content: string;
  views: number;
  helpfulVotes?: number;
  helpful_votes?: number;
  isPublished?: boolean;
  is_published?: boolean;
  author?: { display_value?: string; value?: string } | null;
  sys_created_on?: string;
}

const DEFAULT_ARTICLES: KnowledgeArticle[] = [
  {
    id: "kb-001",
    number: "KB0001001",
    title: "How to configure GlobalProtect VPN client on macOS & Windows",
    category: "Network",
    views: 1420,
    helpfulVotes: 98,
    isPublished: true,
    content: `### Overview
This article provides step-by-step instructions for connecting to the corporate network using Palo Alto GlobalProtect.

### Prerequisites
- Active corporate credentials
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
    id: "kb-002",
    number: "KB0001002",
    title: "Developer Guide: Requesting Temporary Elevated Cloud Access via AWS IAM",
    category: "Cloud Services",
    views: 890,
    helpfulVotes: 74,
    isPublished: true,
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
    id: "kb-003",
    number: "KB0001003",
    title: "Workstation Hardware Refresh Policy & Procurement Schedule",
    category: "Hardware",
    views: 630,
    helpfulVotes: 45,
    isPublished: true,
    content: `### Refresh Eligibility
- Engineering and Design staff are eligible for hardware refresh every 24 months.
- General business and administrative staff are eligible every 36 months.

### Standard Equipment
Laptops are provisioned with 3-year AppleCare+ or Dell ProSupport Plus with next-business-day on-site repair.`,
  },
];

export default function KnowledgeBasePortal() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  // New Article Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("IT Services");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/now/table/kb_knowledge");
      if (!res.ok) throw new Error("Failed to load knowledge articles");
      const data = await res.json();
      const fetched: KnowledgeArticle[] = (data.result || []).map((a: any) => ({
        id: a.id || a.sys_id,
        sys_id: a.sys_id || a.id,
        number: a.number || "KB0001000",
        title: a.title || a.short_description || "Untitled Article",
        category: a.category || "General",
        content: a.content || "",
        views: Number(a.views || 0),
        helpfulVotes: Number(a.helpfulVotes ?? a.helpful_votes ?? 0),
        isPublished: a.isPublished ?? a.is_published ?? true,
        author: a.author,
        sys_created_on: a.sys_created_on,
      }));

      if (fetched.length > 0) {
        setArticles(fetched);
        if (!selectedArticle) {
          setSelectedArticle(fetched[0]);
        } else {
          const stillThere = fetched.find((f) => f.id === selectedArticle.id);
          if (stillThere) setSelectedArticle(stillThere);
        }
      } else {
        // Fallback to default articles if empty
        setArticles(DEFAULT_ARTICLES);
        if (!selectedArticle) setSelectedArticle(DEFAULT_ARTICLES[0]);
      }
    } catch (err) {
      console.warn("Using fallback articles due to fetch error:", err);
      setArticles(DEFAULT_ARTICLES);
      if (!selectedArticle) setSelectedArticle(DEFAULT_ARTICLES[0]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchArticles();
  };

  // Derive categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["all", ...Array.from(set)];
  }, [articles]);

  // Filtered articles
  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = categoryFilter === "all" || a.category === categoryFilter;
      const matchSearch =
        !search.trim() ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.number.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [articles, categoryFilter, search]);

  // Vote handler
  const handleVote = async (art: KnowledgeArticle) => {
    if (votedMap[art.id]) return;

    const newVoteCount = (art.helpfulVotes || 0) + 1;

    // Optimistic update
    setVotedMap((prev) => ({ ...prev, [art.id]: true }));
    setArticles((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, helpfulVotes: newVoteCount } : a))
    );
    if (selectedArticle?.id === art.id) {
      setSelectedArticle({ ...selectedArticle, helpfulVotes: newVoteCount });
    }

    // Persist to backend if real ID
    if (!art.id.startsWith("kb-")) {
      try {
        await fetch(`/api/now/table/kb_knowledge/${art.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ helpful_votes: newVoteCount }),
        });
      } catch (e) {
        console.error("Failed to persist vote:", e);
      }
    }
  };

  // Create article handler
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/now/table/kb_knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory.trim(),
          content: newContent.trim(),
          is_published: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create knowledge article");
      }

      const data = await res.json();
      if (data.result) {
        const created: KnowledgeArticle = {
          id: data.result.id || data.result.sys_id,
          number: data.result.number || "KB000100x",
          title: data.result.title || newTitle.trim(),
          category: data.result.category || newCategory.trim(),
          content: data.result.content || newContent.trim(),
          views: 1,
          helpfulVotes: 0,
          isPublished: true,
        };

        setArticles((prev) => [created, ...prev]);
        setSelectedArticle(created);
        setCreateModalOpen(false);
        setNewTitle("");
        setNewContent("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to publish article");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Swiss Header */}
      <div className="border-b-2 border-black pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&larr; Back to Employee Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 border-2 border-black bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh Articles"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            <Link
              href="/workspace/kb_knowledge"
              className="px-3 py-2 border-2 border-black bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MANAGE KB (WORKSPACE)</span>
            </Link>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Article</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-2">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-neutral-500">06 /</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-black">
                Knowledge &amp; Helpful Guides
              </h1>
            </div>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mt-1">
              Step-by-step setup guides, Wi-Fi connectivity runbooks, and ITIL verified solutions.
            </p>
          </div>

          <div className="relative sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides by keyword or KB#..."
              className="w-full bg-white border-2 border-black py-2.5 pl-9 pr-3 text-xs text-black placeholder:text-neutral-400 focus:outline-none"
            />
            <Search className="w-4 h-4 text-black absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              categoryFilter === c
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-700 border-neutral-300 hover:border-black"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center font-mono text-sm text-neutral-500 border-2 border-dashed border-neutral-300">
          Loading knowledge articles from ServiceMeow repository...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border-2 border-neutral-200 bg-neutral-50 space-y-3">
          <BookOpen className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="font-mono text-sm font-bold text-neutral-700 uppercase">
            No knowledge articles matched your search query.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
            }}
            className="px-4 py-2 bg-black text-white text-xs font-mono font-bold uppercase cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article Navigation List */}
          <div className="space-y-3">
            {filtered.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className={`p-4 border-2 transition-all cursor-pointer space-y-2 ${
                  selectedArticle?.id === art.id
                    ? "border-black bg-neutral-100 ring-1 ring-black"
                    : "border-neutral-200 hover:border-black bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="font-mono text-black font-extrabold">{art.number}</span>
                  <span className="bg-neutral-100 border border-neutral-300 text-neutral-800 px-1.5 py-0.5 font-mono uppercase font-bold">
                    {art.category}
                  </span>
                </div>
                <h3 className="font-bold text-black text-xs uppercase leading-snug line-clamp-2">
                  {art.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-100">
                  <span>{art.views} reads</span>
                  <span className="flex items-center gap-1 text-black font-bold">
                    <ThumbsUp className="w-3 h-3" /> {art.helpfulVotes || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Article Reading Pane */}
          {selectedArticle ? (
            <div className="lg:col-span-2 bg-white border-2 border-black p-6 space-y-6">
              <div className="border-b-2 border-black pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-black text-xs">
                    {selectedArticle.number}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 border border-black bg-neutral-100 text-black">
                    {selectedArticle.category}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-black uppercase tracking-tight">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center space-x-4 text-xs font-mono text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-black" /> {selectedArticle.views} Views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-black" /> {selectedArticle.helpfulVotes || 0} Found Helpful
                  </span>
                  <span className="text-black font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ITIL Verified Solution
                  </span>
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-sm max-w-none text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {selectedArticle.content}
              </div>

              {/* Feedback section */}
              <div className="p-4 bg-neutral-100 border-2 border-black flex items-center justify-between text-xs">
                <span className="font-mono font-bold uppercase text-black">
                  Was this article helpful to you?
                </span>
                <button
                  type="button"
                  onClick={() => handleVote(selectedArticle)}
                  disabled={votedMap[selectedArticle.id]}
                  className={`flex items-center gap-1.5 px-4 py-2 border-2 border-black font-mono font-bold uppercase transition-colors cursor-pointer ${
                    votedMap[selectedArticle.id]
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{votedMap[selectedArticle.id] ? "Thank you!" : "Yes, solved my issue"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 border-2 border-neutral-200 p-12 text-center text-neutral-500 font-mono text-xs">
              Select an article from the left pane to view details.
            </div>
          )}
        </div>
      )}

      {/* CREATE ARTICLE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-xl w-full p-6 space-y-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-black" />
                <h3 className="font-extrabold text-base uppercase text-black font-mono">
                  Publish New Knowledge Article
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-black hover:bg-neutral-100 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-black font-bold uppercase mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to connect to Corporate Office Wi-Fi"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-black placeholder:text-neutral-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-black font-bold uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none"
                >
                  <option value="IT Services">IT Services</option>
                  <option value="Network">Network</option>
                  <option value="Cloud Services">Cloud Services</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-black font-bold uppercase mb-1">
                  Article Content (Markdown Supported) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="### Overview&#10;Write the guide steps, resolution notes, and troubleshooting hints..."
                  className="w-full bg-white border-2 border-black px-3 py-2 text-black placeholder:text-neutral-400 focus:outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="border-t-2 border-black pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-neutral-100 text-black font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 font-bold uppercase disabled:opacity-50 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                >
                  {creating ? "Publishing..." : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
