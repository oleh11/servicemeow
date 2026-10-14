import React from "react";
import Link from "next/link";
import {
  Cat,
  Layers,
  Compass,
  LayoutDashboard,
  Server,
  FileCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitPullRequest,
  AlertTriangle,
  Database,
  Lock,
  Sliders,
  Users,
  Workflow,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-900">
      {/* Hero Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-orange-500/20">
              <Cat className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Service<span className="text-amber-400">Meow</span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Purr-fect ITIL • v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/portal"
              className="px-3.5 py-1.5 text-slate-300 hover:text-white transition-colors"
            >
              Employee Portal
            </Link>
            <Link
              href="/studio"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio / Admin</span>
            </Link>
            <Link
              href="/workspace"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-colors"
            >
              Agent Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Purr-fect Enterprise Service Management with Admin Autonomy</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Enterprise ITIL Workflows with the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400">
              Meow Platform Engine
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A developer-first, metadata-driven ITSM & CMDB platform featuring Incident Management, CAB Change Authorization, dynamic UI Policies, Business Rules, Flow Designer, and complete Admin User Management.
          </p>

          {/* Quick-Launch Portal & Workspace Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-left">
            {/* Card 1: Self-Service Portal */}
            <Link
              href="/portal"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                  Employee Self-Service
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clean consumer-grade portal to log incidents, order catalog items, and view tickets.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-emerald-400">
                <span>Launch Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Agent Workspace */}
            <Link
              href="/workspace"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                  Agent Workspace
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-density technician workspace with condition builders, SLAs, and dual activity stream.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-emerald-400">
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: CMDB Topology */}
            <Link
              href="/workspace/cmdb"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                  CMDB Dependency Graph
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive multi-tier CI topology map with active incident impact indicators.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-emerald-400">
                <span>Explore Topology</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Studio & Admin Suite */}
            <Link
              href="/studio"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-slate-850 hover:shadow-xl hover:shadow-amber-500/10 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                  Studio & Admin Suite
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  User Management, Business Rules (<code className="font-mono text-amber-300">sys_script</code>), UI Policies, and Flow Designer.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-amber-400">
                <span>Configure Platform</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Technical Highlights Section */}
        <div className="border-t border-slate-800/80 pt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Table API Parity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native <code className="text-emerald-400 font-mono">/api/now/table/{`{tableName}`}</code> with before/after business rule hooks & flow execution.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">ITIL SLA & Priorities</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated Impact x Urgency calculation matrix, breach warning meters, and automated SLA pause on hold.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Workflow className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Admin Rules & Flows</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero-downtime Business Rules, dynamic UI Policies (visible/mandatory/read-only), and step-based Hub Flows.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Metadata Dictionary</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Polymorphic base Task inheritance, <code className="text-purple-400 font-mono">sys_db_object</code>, and <code className="text-purple-400 font-mono">sys_dictionary</code> dynamic fields.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>ServiceMeow • Purr-fect Enterprise Service Management • Built with TypeScript, Next.js 15, Tailwind CSS & Prisma ORM.</p>
      </footer>
    </div>
  );
}
