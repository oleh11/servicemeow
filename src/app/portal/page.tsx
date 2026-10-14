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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployeePortal() {
  const [catalogHighlights, popularArticles, recentTickets] = await Promise.all([
    db.catalogItem.findMany({ where: { active: true }, take: 3 }),
    db.knowledgeArticle.findMany({ where: { isPublished: true }, orderBy: { views: "desc" }, take: 3 }),
    db.task.findMany({
      where: { sysClassName: { in: ["incident", "sc_req_item"] } },
      orderBy: { createdAt: "desc" },
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
            Report technical incidents, order engineering hardware, request cloud entitlements, or explore self-help troubleshooting guides.
          </p>

          {/* Large Search Input */}
          <div className="max-w-2xl mx-auto pt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search services, request hardware, find answers (e.g., VPN, MacBook, AWS)..."
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
        {/* Fast Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-10">
          {/* Action 1: Report Issue */}
          <Link
            href="/portal/create-incident"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Report an Issue
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log a breakdown or outage with IT Service Desk for immediate triage.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>Submit ticket</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 2: Service Catalog */}
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
                Order developer workstations, cloud sandbox roles, software licenses.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 3: My Tickets */}
          <Link
            href="/portal/my-tickets"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Track My Requests
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check status, read technician updates, and add replies to your active tickets.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>View status</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action 4: Knowledge Base */}
          <Link
            href="/portal/knowledge"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md hover:shadow-lg hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Self-service step-by-step guides for VPN, email, Okta, and developer access.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>Read articles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Featured Catalog Items & Popular Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Catalog Highlights */}
          <div className="bg-white p-6 rounded-xl border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Popular Service Catalog Offerings</h2>
                <p className="text-xs text-slate-500">Quick-order developer hardware and IAM entitlements</p>
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
