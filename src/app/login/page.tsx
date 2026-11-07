"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, DEFAULT_PERSONAS } from "@/lib/user-context";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-neutral-100 text-black flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-xl w-full border-2 border-black bg-white p-8 md:p-10 space-y-8">
        {/* Brand Header */}
        <div className="border-b-2 border-black pb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm uppercase tracking-widest font-extrabold text-black">
              SERVICEMEOW ■
            </span>
            <span className="font-mono text-xs uppercase px-2 py-0.5 bg-black text-white font-bold">
              SWISS GRID SYSTEM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight uppercase text-black">
            Sign In &amp; Access Roles
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            Click any role below for instant 1-click access, or log in with custom email credentials.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 border-2 border-red-600 bg-red-50 text-red-800 text-xs font-mono flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Fast Persona Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-neutral-600">
              1-Click Instant Persona Sign-In:
            </span>
            <span className="text-[10px] font-mono uppercase text-neutral-400">
              Zero Password Required
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {DEFAULT_PERSONAS.map((p, idx) => {
              const num = String(idx + 1).padStart(2, "0");
              return (
                <button
                  key={p.id}
                  onClick={() => handlePersonaLogin(p)}
                  disabled={loading}
                  className="w-full text-left p-3.5 border border-neutral-300 hover:border-black hover:bg-neutral-50 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-40"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-black">
                      {num}
                    </span>
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-none border border-neutral-300 object-cover"
                    />
                    <div>
                      <span className="font-bold text-xs uppercase tracking-tight text-black block">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-neutral-500">{p.title}</span>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 border border-black bg-neutral-100 group-hover:bg-black group-hover:text-white transition-colors">
                    {p.role} &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Credential Divider */}
        <div className="relative border-t border-neutral-300 pt-6 space-y-4">
          <span className="text-xs font-mono uppercase font-bold text-neutral-600 block">
            Or Sign In With Account Email:
          </span>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-mono uppercase font-bold text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="taylor.reed@servicemeow.io or admin"
                className="w-full text-sm px-3.5 py-2.5 border border-neutral-400 text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-mono uppercase font-bold text-neutral-700 mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-sm px-3.5 py-2.5 border border-neutral-400 text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
