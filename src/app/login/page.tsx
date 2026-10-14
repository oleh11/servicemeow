"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, DEFAULT_PERSONAS } from "@/lib/user-context";
import {
  Cat,
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      await login(data.user);
      const redirectUrl = data.user.role === "employee" ? "/portal" : "/workspace";
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to authentication server.");
      setLoading(false);
    }
  };

  const handlePersonaLogin = async (persona: any) => {
    setErrorMsg("");
    // Quick persona login only works when the server has ALLOW_DEV_PERSONA_LOGIN=true (non-production).
    setEmailInput(persona.email);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      await login(data.user);
      const redirectUrl = data.user.role === "employee" ? "/portal" : "/workspace";
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch persona.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 mb-2">
            <Cat className="w-7 h-7 text-slate-950" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            Service<span className="text-emerald-400">Meow</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              Purr-ITSM
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Enterprise Cloud Service Management & ITIL Workflow Engine
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Email & Password Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@servicemeow.io or admin"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Password (bcrypt protected)
              </label>
            </div>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Sign In with Secure Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Persona Switcher */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Or 1-Click Persona Login (Server DB Session):</span>
            <span className="text-[10px] text-emerald-400 font-mono">Secure DB RBAC</span>
          </div>

          <div className="space-y-2">
            {DEFAULT_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePersonaLogin(p)}
                disabled={loading}
                className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between transition-all group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div className="text-left">
                    <span className="font-semibold text-xs text-slate-200 block group-hover:text-emerald-300 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{p.title}</span>
                  </div>
                </div>

                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                    p.role === "admin"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : p.role === "itil"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : p.role === "cab_approver"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {p.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
