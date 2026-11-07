"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  X,
  Ticket,
  ShoppingBag,
  BookOpen,
  Server,
  Building2,
  ArrowRight,
  PlusCircle,
  Kanban,
  FileCode,
  ShieldCheck,
  Compass,
  LayoutDashboard,
  Clock,
  Sparkles,
  MessageSquare,
} from "lucide-react";

interface SearchResults {
  tickets: Array<{
    id: string;
    number: string;
    shortDescription: string;
    sysClassName: string;
    priority: number;
    state: number;
  }>;
  catalog: Array<{
    id: string;
    name: string;
    shortDescription: string;
    category: string;
    price: number;
  }>;
  knowledge: Array<{
    id: string;
    number: string;
    title: string;
    topic: string;
    views: number;
  }>;
  cmdb: Array<{
    id: string;
    name: string;
    ciClass: string;
    status: string;
    tier: string;
  }>;
  spaces: Array<{
    id: string;
    name: string;
    spaceNumber: string;
    spaceType: string;
    status: string;
    capacity: number;
  }>;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmployee?: boolean;
}

export function CommandPaletteModal({ isOpen, onClose, isEmployee = false }: CommandPaletteModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    tickets: [],
    catalog: [],
    knowledge: [],
    cmdb: [],
    spaces: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fast navigation presets
  const quickActions = [
    {
      id: "act-new-inc",
      title: "Create Incident",
      subtitle: isEmployee ? "Submit a new IT support request" : "Open a new incident ticket in workspace",
      url: isEmployee ? "/portal/create-incident" : "/workspace/incident/new",
      icon: PlusCircle,
      badge: "Action",
      color: "text-amber-500",
    },
    ...(!isEmployee
      ? [
          {
            id: "act-live-chat",
            title: "Live Agent Cockpit",
            subtitle: "Omnichannel real-time queue triage and live requester chat",
            url: "/workspace/chat",
            icon: MessageSquare,
            badge: "Live",
            color: "text-red-500",
          },
          {
            id: "act-new-chg",
            title: "Create Change Request",
            subtitle: "Submit change planning, CAB schedule & risk",
            url: "/workspace/change_request/new",
            icon: PlusCircle,
            badge: "Action",
            color: "text-purple-500",
          },
          {
            id: "act-workspace",
            title: "Operations Agent Workspace",
            subtitle: "Dockable multi-tab incident triage and live SLAs",
            url: "/workspace",
            icon: LayoutDashboard,
            badge: "Nav",
            color: "text-sky-500",
          },
          {
            id: "act-agile",
            title: "Agile Sprint Board",
            subtitle: "Kanban backlog, in-progress tasks and sprint metrics",
            url: "/workspace/agile",
            icon: Kanban,
            badge: "Nav",
            color: "text-indigo-500",
          },
          {
            id: "act-cmdb",
            title: "CMDB Dependency Topology & 42U Racks",
            subtitle: "Inspect server topology, host relations and rack elevations",
            url: "/workspace/cmdb",
            icon: Server,
            badge: "Nav",
            color: "text-emerald-500",
          },
          {
            id: "act-studio",
            title: "Studio Admin & Low-Code IDE",
            subtitle: "Schema dictionaries, business rules, Monaco editor & Update Sets",
            url: "/studio",
            icon: FileCode,
            badge: "Nav",
            color: "text-fuchsia-500",
          },
        ]
      : []),
    {
      id: "act-reservations",
      title: "Workplace Reservations & CAD Floorplans",
      subtitle: "Book rooms, standing desks, Zoom studios or focus pods",
      url: isEmployee ? "/portal/reservations" : "/workspace/reservations",
      icon: Building2,
      badge: "Nav",
      color: "text-rose-500",
    },
    {
      id: "act-catalog",
      title: "Service Catalog & Hardware Order",
      subtitle: "Order hardware, request software licenses or cloud access",
      url: "/portal/catalog",
      icon: ShoppingBag,
      badge: "Nav",
      color: "text-teal-500",
    },
    {
      id: "act-kb",
      title: "Knowledge Base",
      subtitle: "Self-service troubleshooting guides, VPN and IT FAQs",
      url: "/portal/knowledge",
      icon: BookOpen,
      badge: "Nav",
      color: "text-blue-500",
    },
    {
      id: "act-status",
      title: "Public System Uptime Status (90 Days)",
      subtitle: "Live component health, past incidents & SLA performance",
      url: "/portal/status",
      icon: ShieldCheck,
      badge: "Nav",
      color: "text-emerald-500",
    },
  ];

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults({ tickets: [], catalog: [], knowledge: [], cmdb: [], spaces: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/now/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  // Build flattened selectable items list
  const selectableItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      url: string;
      icon: any;
      category: string;
      badge?: string;
    }> = [];

    // Filter quick actions if query is present
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      quickActions
        .filter((a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q))
        .forEach((a) => {
          items.push({
            id: a.id,
            title: a.title,
            subtitle: a.subtitle,
            url: a.url,
            icon: a.icon,
            category: "Actions & Navigation",
            badge: a.badge,
          });
        });
    }

    // Tickets
    results.tickets.forEach((t) => {
      items.push({
        id: `ticket-${t.id}`,
        title: `${t.number}: ${t.shortDescription}`,
        subtitle: `${t.sysClassName.toUpperCase()} • Priority P${t.priority} • State ${t.state}`,
        url: isEmployee ? `/portal/my-tickets` : `/workspace/${t.sysClassName || "incident"}/${t.id}`,
        icon: Ticket,
        category: "Tasks & Tickets",
        badge: t.sysClassName.toUpperCase(),
      });
    });

    // Catalog Items
    results.catalog.forEach((c) => {
      items.push({
        id: `cat-${c.id}`,
        title: c.name,
        subtitle: `${c.category || "General"} • ${c.price > 0 ? `$${c.price}` : "Free Request"} • ${c.shortDescription || ""}`,
        url: `/portal/catalog/${c.id}`,
        icon: ShoppingBag,
        category: "Service Catalog",
        badge: "CATALOG",
      });
    });

    // Knowledge Base
    results.knowledge.forEach((k) => {
      items.push({
        id: `kb-${k.id}`,
        title: `${k.number}: ${k.title}`,
        subtitle: `${k.topic || "General"} • ${k.views} views`,
        url: `/portal/knowledge`,
        icon: BookOpen,
        category: "Knowledge Base",
        badge: "ARTICLE",
      });
    });

    // CMDB Configuration Items
    if (!isEmployee) {
      results.cmdb.forEach((ci) => {
        items.push({
          id: `cmdb-${ci.id}`,
          title: ci.name,
          subtitle: `Class: ${ci.ciClass} • Status: ${ci.status} • Tier: ${ci.tier || "N/A"}`,
          url: `/workspace/cmdb`,
          icon: Server,
          category: "CMDB Infrastructure",
          badge: "CI",
        });
      });
    }

    // Spaces
    results.spaces.forEach((s) => {
      items.push({
        id: `space-${s.id}`,
        title: `${s.spaceNumber} — ${s.name}`,
        subtitle: `${s.spaceType} • Capacity ${s.capacity} • Status: ${s.status}`,
        url: isEmployee ? "/portal/reservations" : "/workspace/reservations",
        icon: Building2,
        category: "Workplace Spaces",
        badge: "SPACE",
      });
    });

    // If query is empty, show default quick actions
    if (query.trim().length === 0) {
      quickActions.forEach((a) => {
        items.push({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          url: a.url,
          icon: a.icon,
          category: "Quick Actions & Navigation",
          badge: a.badge,
        });
      });
    }

    return items;
  }, [query, results, isEmployee]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < selectableItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : selectableItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectableItems[selectedIndex]) {
          const item = selectableItems[selectedIndex];
          onClose();
          router.push(item.url);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, selectableItems, onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tickets, catalog, articles, CIs... (e.g. INC*, Mac, VPN)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {selectableItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by ticket number, hardware model, or topic</p>
            </div>
          ) : (
            selectableItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              const showCategoryHeader =
                idx === 0 || selectableItems[idx - 1].category !== item.category;

              return (
                <React.Fragment key={item.id}>
                  {showCategoryHeader && (
                    <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {item.category}
                    </div>
                  )}
                  <div
                    onClick={() => {
                      onClose();
                      router.push(item.url);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-1 ring-sky-300 dark:ring-sky-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-sky-500 translate-x-0.5" : "text-transparent"
                      }`}
                    />
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 font-semibold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ServiceMeow Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
