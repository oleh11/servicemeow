"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AVATAR_PRESETS } from "./avatar-presets";

export interface UserPersona {
  id: string;
  name: string;
  userName?: string;
  email: string;
  role: "admin" | "itil" | "cab_approver" | "employee" | string;
  title?: string;
  department?: string;
  avatar?: string;
  groups?: { id: string; name: string; roles?: string }[];
  effectiveRoles?: string[];
}

export const DEFAULT_PERSONAS: UserPersona[] = [
  {
    id: "admin-user",
    name: "Felix Vance (Admin Cat)",
    email: "admin@servicemeow.io",
    role: "admin",
    title: "Platform Superadmin & Head Cat",
    department: "IT Infrastructure",
    avatar: AVATAR_PRESETS[0].url,
    effectiveRoles: ["admin", "itil", "cab_approver", "employee", "public"],
  },
  {
    id: "itil-user",
    name: "Sarah 'Whiskers' Jenkins",
    email: "sarah.jenkins@servicemeow.io",
    role: "itil",
    title: "Senior ITIL Incident Commander",
    department: "Global Service Desk",
    avatar: AVATAR_PRESETS[7].url,
    effectiveRoles: ["itil", "employee", "public"],
  },
  {
    id: "cab-user",
    name: "Marcus 'Sharp Claws' Vance",
    email: "marcus.vance@servicemeow.io",
    role: "cab_approver",
    title: "CAB Governance Chair & Change Director",
    department: "IT Governance",
    avatar: AVATAR_PRESETS[6].url,
    effectiveRoles: ["cab_approver", "employee", "public"],
  },
  {
    id: "employee-user",
    name: "Alex 'Paws' Chen",
    email: "alex.chen@servicemeow.io",
    role: "employee",
    title: "Staff Software Architect",
    department: "Core Engineering",
    avatar: AVATAR_PRESETS[8].url,
    effectiveRoles: ["employee", "public"],
  },
];

interface UserContextType {
  actualUser: UserPersona;
  impersonatedUser: UserPersona | null;
  currentUser: UserPersona;
  isImpersonating: boolean;
  impersonateUser: (user: UserPersona) => Promise<boolean>;
  endImpersonation: () => Promise<boolean>;
  setCurrentUser: (persona: UserPersona) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  login: (user: UserPersona) => Promise<void>;
  logout: () => Promise<void>;
  allPersonas: UserPersona[];
  refreshPersonas: () => Promise<void>;
  updateCurrentUserAvatar: (newAvatarUrl: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [allPersonas, setAllPersonas] = useState<UserPersona[]>(DEFAULT_PERSONAS);
  const [actualUser, setActualUser] = useState<UserPersona>(DEFAULT_PERSONAS[0]);
  const [impersonatedUser, setImpersonatedUser] = useState<UserPersona | null>(null);

  // Synchronize server-side session
  const syncServerSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated && data.user) {
        if (data.isImpersonating && data.actualUser) {
          setActualUser({
            id: data.actualUser.id,
            name: data.actualUser.name,
            email: data.actualUser.email,
            userName: data.actualUser.userName,
            role: data.actualUser.role,
            avatar: data.actualUser.avatar,
            effectiveRoles: ["admin", "itil", "cab_approver", "employee", "public"],
          });
          setImpersonatedUser({
            ...data.user,
            effectiveRoles: data.roles || [data.user.role],
          });
        } else {
          setActualUser({
            ...data.user,
            effectiveRoles: data.roles || [data.user.role],
          });
          setImpersonatedUser(null);
        }
      }
      // No session: stay logged out. Protected pages are redirected to /login by middleware.
    } catch (err) {
      console.error("Failed to sync server session:", err);
    }
  }, []);

  const refreshPersonas = async () => {
    try {
      const res = await fetch("/api/now/users");
      const data = await res.json();
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        const mapped: UserPersona[] = data.result.map((u: any) => {
          const roleSet = new Set<string>();
          if (u.role) roleSet.add(u.role);
          if (u.roles) {
            u.roles.split(",").forEach((r: string) => {
              const clean = r.trim();
              if (clean) roleSet.add(clean);
            });
          }
          if (u.groups && Array.isArray(u.groups)) {
            u.groups.forEach((g: any) => {
              if (g.roles) {
                g.roles.split(",").forEach((r: string) => {
                  const clean = r.trim();
                  if (clean) roleSet.add(clean);
                });
              }
            });
          }

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            userName: u.userName,
            role: (u.role as any) || "employee",
            title: u.title || "Team Member",
            department: u.department || "General IT",
            avatar:
              u.avatar ||
              "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=128&h=128&fit=crop&crop=faces",
            groups: u.groups || [],
            effectiveRoles: Array.from(roleSet),
          };
        });
        setAllPersonas(mapped);
      }
    } catch (err) {
      console.error("Error refreshing personas:", err);
    }
  };

  useEffect(() => {
    syncServerSession();
    refreshPersonas();
  }, [syncServerSession]);

  const updateCurrentUserAvatar = async (newAvatarUrl: string): Promise<boolean> => {
    try {
      const targetUserId = actualUser.id;
      if (!targetUserId) return false;

      const res = await fetch(`/api/now/users/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatarUrl }),
      });

      if (res.ok) {
        await refreshPersonas();
        await syncServerSession();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to update avatar:", e);
      return false;
    }
  };

  // Server-side impersonation
  const impersonateUser = async (target: UserPersona): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setImpersonatedUser({
          ...target,
          ...data.user,
          effectiveRoles: data.effectiveRoles || target.effectiveRoles,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to initiate server-side impersonation:", err);
      return false;
    }
  };

  // Server-side unimpersonation
  const endImpersonation = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "DELETE",
      });

      if (res.ok) {
        setImpersonatedUser(null);
        await syncServerSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to end impersonation:", err);
      return false;
    }
  };

  const login = async (user: UserPersona) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setActualUser({
          ...user,
          ...data.user,
          effectiveRoles: data.effectiveRoles,
        });
        setImpersonatedUser(null);
      }
    } catch (err) {
      console.error("Failed to login persona:", err);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const fallback = DEFAULT_PERSONAS[3]; // Alex Chen (Employee)
      setActualUser(fallback);
      setImpersonatedUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const setCurrentUser = async (persona: UserPersona) => {
    await login(persona);
  };

  const switchRole = async (role: string) => {
    const found = allPersonas.find((p) => p.role === role);
    if (found) {
      await login(found);
    }
  };

  const effectiveUser = impersonatedUser || actualUser;

  return (
    <UserContext.Provider
      value={{
        actualUser,
        impersonatedUser,
        currentUser: effectiveUser,
        isImpersonating: Boolean(impersonatedUser),
        impersonateUser,
        endImpersonation,
        setCurrentUser,
        switchRole,
        login,
        logout,
        allPersonas,
        refreshPersonas,
        updateCurrentUserAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
