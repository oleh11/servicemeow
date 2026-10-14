import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  Search,
  AlertCircle,
  ShoppingBag,
  Ticket,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Compass,
  Video,
  Sliders,
  MapPin,
  Sparkles,
  Layers,
  ArrowUpRight,
  Eye,
  Box,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployeePortal() {
  const [
    catalogHighlights,
    popularArticles,
    recentTickets,
    availableSpacesCount,
    activeReservationsCount,
    workplaceCatalogItems,
  ] = await Promise.all([
    db.catalogItem.findMany({ where: { active: true }, take: 4 }),
    db.knowledgeArticle.findMany({ where: { isPublished: true }, orderBy: { views: "desc" }, take: 3 }),
    db.task.findMany({
      where: { sysClassName: { in: ["incident", "sc_req_item"] } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.cmnSpace.count({ where: { status: "available" } }),
    db.cmnReservation.count({ where: { status: { not: "cancelled" } } }),
    db.catalogItem.findMany({
      where: { category: "Workplace & Facilities", active: true },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-700/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>ServiceMeow Employee Service Center 🐾</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How can we assist you today?
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Book meeting rooms & standing desks, report IT incidents, order hardware, request cloud entitlements, or explore spatial campus maps.
          </p>

          {/* Large Search Input */}
          <div className="max-w-2xl mx-auto pt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search services, book desks, find answers (e.g., Conference Room, Teams, VPN, MacBook)..."
                className="w-full py-3.5 pl-11 pr-4 bg-white/10 backdrop-blur-md border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 transition-all shadow-lg"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Service Status Pill */}
          <div className="pt-3 flex justify-center">
            <Link
              href="/portal/status"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/25 transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">All Enterprise Systems Operational</span>
              <span className="text-emerald-500/60">&bull;</span>
              <span className="underline decoration-emerald-400/50 font-medium">Live Status & 90-Day Uptime</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Fast Action Cards (6 Core Self-Service Actions) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 -mt-10">
          {/* Action 1: Book Room or Desk */}
          <Link
            href="/portal/reservations"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Book Room or Desk
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reserve spaces filtered by Teams, Zoom, or ergonomic standing desk.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600">
              <span>Book space</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 2: Campus Maps & Spaces */}
          <Link
            href="/portal/spaces"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-cyan-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-600 transition-colors">
                Campus Maps & Spaces
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Explore 6-tier spatial hierarchy, architectural blueprints & assets.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-cyan-600">
              <span>Explore maps</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 3: Report Issue */}
          <Link
            href="/portal/create-incident"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-rose-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                Report an Issue
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log a breakdown or outage with IT Service Desk for triage.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-rose-600">
              <span>Submit ticket</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 4: Service Catalog */}
          <Link
            href="/portal/catalog"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Request Something
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Order developer gear, cloud roles, desks & AV setups.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 5: My Tickets */}
          <Link
            href="/portal/my-tickets"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-blue-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Track Requests
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check status, technician notes, and add replies to tickets.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-blue-600">
              <span>View status</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 6: Knowledge Base */}
          <Link
            href="/portal/knowledge"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-purple-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step guides for VPN, email, Okta, and office Wi-Fi.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-purple-600">
              <span>Read articles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED SECTION: CONNECTED WORKPLACE & FACILITY SERVICES               */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl border border-indigo-800/40 p-6 sm:p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/50 pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                <Building2 className="w-3.5 h-3.5" />
                <span>Workplace Hub &amp; Facility Services</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Reserve Rooms, Desks & Workplace Services
              </h2>
              <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                Instant self-service room reservation with Teams / Zoom Room systems, ergonomic standing desk check-in, and facility logistics workflows.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-indigo-900/50 border border-indigo-700/50 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">{availableSpacesCount}</span>
                <span className="text-indigo-300">Rooms & Desks Ready</span>
              </div>
              <Link
                href="/portal/reservations"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Open Reservations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Fast Reservation Shortcuts by Capability */}
            <div className="bg-slate-900/80 border border-indigo-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Instant Space Booking</h3>
                  <p className="text-xs text-indigo-300/80">Filtered directly by room equipment & capabilities</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  Live Matrix
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/portal/reservations?capabilities=standing_desk"
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-indigo-950 hover:border-indigo-500/50 transition-all group block"
                >
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Sliders className="w-4 h-4" />
                    <span className="font-bold text-xs group-hover:text-emerald-300 transition-colors">
                      Ergonomic Hot Desks
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Motorized standing desks with dual 4K USB-C monitors & power.
                  </p>
                </Link>

                <Link
                  href="/portal/reservations?capabilities=teams"
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-indigo-950 hover:border-indigo-500/50 transition-all group block"
                >
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Video className="w-4 h-4" />
                    <span className="font-bold text-xs group-hover:text-blue-300 transition-colors">
                      Teams Collaboration
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Microsoft Teams Rooms with interactive digital whiteboards.
                  </p>
                </Link>

                <Link
                  href="/portal/reservations?capabilities=zoom"
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-indigo-950 hover:border-indigo-500/50 transition-all group block"
                >
                  <div className="flex items-center gap-2 text-sky-400 mb-1">
                    <Video className="w-4 h-4" />
                    <span className="font-bold text-xs group-hover:text-sky-300 transition-colors">
                      Zoom Video Suites
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Studio suites with acoustic isolation & multi-camera telepresence.
                  </p>
                </Link>

                <Link
                  href="/portal/reservations?view=floorplan"
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-indigo-950 hover:border-indigo-500/50 transition-all group block"
                >
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="font-bold text-xs group-hover:text-amber-300 transition-colors">
                      Floorplan View
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click-to-book directly from architectural SVG floor blueprints.
                  </p>
                </Link>
              </div>
            </div>

            {/* Column 2: Workplace & Facility Catalog Requests */}
            <div className="bg-slate-900/80 border border-indigo-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Workplace Logistics & Services</h3>
                  <p className="text-xs text-indigo-300/80">Submit requests to Facilities, AV & Physical Security</p>
                </div>
                <Link
                  href="/portal/catalog"
                  className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1"
                >
                  <span>Catalog</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {(workplaceCatalogItems.length > 0 ? workplaceCatalogItems : [
                  {
                    id: "standing-desk",
                    name: "Ergonomic Standing Desk & Dual Monitor Allocation",
                    shortDescription: "Motorized sit-stand workstation setup with dual 4K monitors.",
                    deliveryDays: 3,
                  },
                  {
                    id: "av-setup",
                    name: "Conference Room & Event AV Setup Request",
                    shortDescription: "High-definition telepresence and multi-camera live streaming.",
                    deliveryDays: 1,
                  },
                  {
                    id: "office-move",
                    name: "Office Move & Workspace Reconfiguration",
                    shortDescription: "Relocate team pods, IT equipment, and assigned seats.",
                    deliveryDays: 5,
                  },
                  {
                    id: "badge-access",
                    name: "Physical Security Badge & Keycard Access",
                    shortDescription: "Request NFC smart badge or access clearance to labs & MDF.",
                    deliveryDays: 1,
                  },
                ]).map((item: any) => (
                  <Link
                    key={item.id}
                    href={item.id.includes("-") ? "/portal/catalog" : `/portal/catalog/${item.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-indigo-950 hover:border-indigo-500/40 hover:bg-indigo-950/30 transition-all group"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {item.shortDescription}
                      </div>
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.deliveryDays}d SLA</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Catalog Items & Popular Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Catalog Highlights */}
          <div className="bg-white p-6 rounded-xl border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Popular Service Catalog Offerings</h2>
                <p className="text-xs text-slate-500">Quick-order developer hardware, cloud roles, and workplace equipment</p>
              </div>
              <Link
                href="/portal/catalog"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                All Items <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {catalogHighlights.map((item) => (
                <Link
                  key={item.id}
                  href={`/portal/catalog/${item.id}`}
                  className="flex items-start justify-between p-3.5 rounded-lg border hover:border-emerald-400 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.shortDescription}</p>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {item.price === 0 ? "Free / Entitled" : `$${item.price.toLocaleString()}`}
                    </span>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {item.deliveryDays}d delivery
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Knowledge Guides */}
          <div className="bg-white p-6 rounded-xl border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Featured Self-Help Solutions</h2>
                <p className="text-xs text-slate-500">Top-rated technical articles and how-to guides</p>
              </div>
              <Link
                href="/portal/knowledge"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Browse Knowledge Base <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {popularArticles.map((art) => (
                <Link
                  key={art.id}
                  href="/portal/knowledge"
                  className="block p-3.5 rounded-lg border hover:border-emerald-400 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono text-emerald-700 font-bold">{art.number}</span>
                    <span>{art.views} views • {art.helpfulVotes} helpful</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {art.content.substring(0, 120)}...
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
