import Link from "next/link";
import { ArrowLeft, Home, LayoutDashboard, Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto text-2xl font-black font-mono shadow-inner">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Record or Route Not Found</h1>
          <p className="text-sm text-slate-400">
            The page or system record you requested does not exist or has been relocated within the ServiceMeow platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <Link
            href="/portal"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-emerald-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
          >
            <Home className="w-4 h-4 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            Portal
          </Link>
          <Link
            href="/workspace"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-sky-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
          >
            <LayoutDashboard className="w-4 h-4 mb-1.5 text-sky-400 group-hover:scale-110 transition-transform" />
            Workspace
          </Link>
          <Link
            href="/studio"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-purple-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
          >
            <Terminal className="w-4 h-4 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform" />
            Studio
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to ServiceMeow Home
          </Link>
        </div>
      </div>
    </div>
  );
}
