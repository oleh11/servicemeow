import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Search,
  AlertTriangle,
  ShoppingBag,
  Ticket,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployeePortal() {
  const [
    catalogHighlights,
    popularArticles,
    recentTickets,
    availableSpacesCount,
    activeReservationsCount,
  ] = await Promise.all([
    db.catalogItem.findMany({ where: { active: true }, take: 4 }),
    db.knowledgeArticle.findMany({ where: { isPublished: true }, orderBy: { views: "desc" }, take: 4 }),
    db.task.findMany({
      where: { sysClassName: { in: ["incident", "sc_req_item"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.cmnSpace.count({ where: { status: { in: ["available", "vacant"] } } }),
    db.cmnReservation.count({ where: { status: { not: "cancelled" } } }),
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans pb-20">
      {/* Swiss Hero: Big, Bold, Objective Typographic Introduction */}
      <section className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-neutral-500">
            <span className="w-2.5 h-2.5 bg-[#eb0029] inline-block" />
            <span>01 / EMPLOYEE SERVICE CENTER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.05]">
            What do you need help with today?
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Click any of the 4 numbered boxes below, or type your question in the box. Our team will handle the rest.
          </p>

          {/* Large, Simple Search Box (Impossible to Miss) */}
          <div className="pt-2 max-w-3xl">
            <div className="relative flex items-center">
              <Search className="w-6 h-6 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Type here to search (e.g. WiFi password, new laptop, book meeting room, VPN)..."
                className="w-full h-14 sm:h-16 pl-14 pr-4 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-none text-base sm:text-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#0047ff] transition-colors shadow-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-neutral-500 font-mono">
              <span>Quick searches:</span>
              <Link href="/portal/create-incident" className="underline hover:text-[#eb0029]">Broken Laptop</Link>
              <span>&bull;</span>
              <Link href="/portal/catalog" className="underline hover:text-[#0047ff]">Request Monitor</Link>
              <span>&bull;</span>
              <Link href="/portal/reservations?view=floorplan" className="underline hover:text-[#00875a]">Floor 18 CAD Map</Link>
              <span>&bull;</span>
              <Link href="/portal/status" className="underline hover:text-neutral-900 dark:hover:text-white">Is Slack Down?</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 space-y-16">
        {/* ========================================================================= */}
        {/* THE 4-QUADRANT SWISS PRIMARY ACTION MATRIX                                */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-2">
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-900 dark:text-white">
              PRIMARY ACTIONS
            </h2>
            <span className="text-xs font-mono text-neutral-400">CHOOSE AN ACTION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-neutral-300 dark:border-neutral-800 divide-y md:divide-y-0 md:divide-x divide-neutral-300 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
            {/* Quadrant 01: Report a Problem (Swiss Red) */}
            <div className="p-6 sm:p-8 flex flex-col justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors border-l-4 border-l-[#eb0029]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#eb0029]">01</span>
                  <span className="text-xs font-mono px-2 py-0.5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold">
                    IT &amp; FACILITIES HELP
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Report a Problem
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Is something broken? Computer won&apos;t turn on, software error, printer jammed, or office temperature issue.
                </p>
              </div>

              <div className="pt-8">
                <Link
                  href="/portal/create-incident"
                  className="w-full h-14 bg-[#eb0029] hover:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Report Problem Now &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Quadrant 02: Request Something (Swiss Blue) */}
            <div className="p-6 sm:p-8 flex flex-col justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors border-l-4 border-l-[#0047ff]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#0047ff]">02</span>
                  <span className="text-xs font-mono px-2 py-0.5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                    HARDWARE &amp; SOFTWARE
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Order Equipment or Services
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Need a new laptop, second monitor, Figma or GitHub license, desk phone, or building security badge.
                </p>
              </div>

              <div className="pt-8">
                <Link
                  href="/portal/catalog"
                  className="w-full h-14 bg-[#0047ff] hover:bg-blue-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Browse Catalog &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-neutral-300 dark:border-neutral-800 divide-y md:divide-y-0 md:divide-x divide-neutral-300 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
            {/* Quadrant 03: Book Room or Desk (Swiss Emerald) */}
            <div className="p-6 sm:p-8 flex flex-col justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors border-l-4 border-l-[#00875a]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#00875a]">03</span>
                  <span className="text-xs font-mono px-2 py-0.5 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                    {availableSpacesCount > 0 ? `${availableSpacesCount} ROOMS READY` : "LIVE FLOOR MAP"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Book a Room or Desk
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Reserve a meeting room with Teams/Zoom, a quiet desk, or view the interactive architectural floorplan drawing.
                </p>
              </div>

              <div className="pt-8">
                <Link
                  href="/portal/reservations?view=floorplan"
                  className="w-full h-14 bg-[#00875a] hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Layers className="w-5 h-5" />
                  <span>Open Floorplan &amp; Book &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Quadrant 04: Track Requests (Swiss Amber) */}
            <div className="p-6 sm:p-8 flex flex-col justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors border-l-4 border-l-[#d97706]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#d97706]">04</span>
                  <span className="text-xs font-mono px-2 py-0.5 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold">
                    TICKET PROGRESS
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Check on Your Requests
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Track the status of everything you have submitted. See who is working on it and when it will be finished.
                </p>
              </div>

              <div className="pt-8">
                <Link
                  href="/portal/my-tickets"
                  className="w-full h-14 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Ticket className="w-5 h-5" />
                  <span>View My Tickets &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SWISS 2-COLUMN MODULAR SECTION: HELPFUL ANSWERS & SYSTEM STATUS           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Popular Answers (Knowledge Articles) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2">
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0047ff]" />
                <span>FREQUENT QUESTIONS &amp; INSTANT ANSWERS</span>
              </h2>
              <Link href="/portal/knowledge" className="text-xs font-bold text-[#0047ff] hover:underline">
                All Articles &rarr;
              </Link>
            </div>

            <div className="border border-neutral-300 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {popularArticles.length === 0 ? (
                <div className="p-6 text-sm text-neutral-500">
                  Knowledge articles are loading or none have been published yet.
                </div>
              ) : (
                popularArticles.map((article, idx) => (
                  <Link
                    key={article.id}
                    href={`/portal/knowledge/${article.id}`}
                    className="p-5 flex items-start justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group block"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400 font-bold">
                          0{idx + 1}
                        </span>
                        <h4 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-[#0047ff] transition-colors">
                          {article.title}
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1">
                        {article.content ? article.content.substring(0, 100) : "Click to read step-by-step resolution instructions."}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-[#0047ff] transition-all shrink-0 mt-1" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Live Company Systems Operational Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2">
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00875a]" />
                <span>SYSTEM HEALTH</span>
              </h2>
              <Link href="/portal/status" className="text-xs font-bold text-neutral-600 hover:underline">
                Status Page &rarr;
              </Link>
            </div>

            <div className="border border-neutral-300 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#00875a] flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-sm text-neutral-950 dark:text-white">
                    All Systems Operational
                  </div>
                  <div className="text-xs text-neutral-500">
                    No active service interruptions
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-4 text-xs">
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Enterprise Email &amp; Teams</span>
                  <span className="font-mono text-[#00875a] font-bold">100% UP</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Internal Wi-Fi &amp; VPN</span>
                  <span className="font-mono text-[#00875a] font-bold">100% UP</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-600 dark:text-neutral-400 font-medium">Meeting Room AV &amp; Displays</span>
                  <span className="font-mono text-[#00875a] font-bold">100% UP</span>
                </div>
              </div>

              <Link
                href="/portal/status"
                className="w-full py-2.5 px-3 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white text-xs font-bold text-center block transition-colors mt-2"
              >
                View 90-Day Uptime Log &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
