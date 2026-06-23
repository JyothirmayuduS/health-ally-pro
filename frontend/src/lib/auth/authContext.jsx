// Demo auth — pharmacist-only (doctor portal removed in v2).

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const AUTH_KEY = "oakhaven.auth.v2";

const DEMO_ACCOUNTS = {
  "pharmacy@oakhaven.demo": {
    password: "Demo1234!",
    profile: {
      id: "stf_phm_01",
      name: "Riley Chen",
      role: "pharmacist",
      email: "pharmacy@oakhaven.demo",
      portal: "pharmacy",
      title: "Lead Pharmacist",
    },
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (_) { /* ignore */ }
    setHydrated(true);
  }, []);

  const persist = (u) => {
    setUser(u);
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_KEY);
  };

  const signIn = useCallback(async ({ email, password }) => {
    const key = (email || "").trim().toLowerCase();
    const account = DEMO_ACCOUNTS[key];
    if (!account || account.password !== password) {
      return { ok: false, error: "Invalid email or password." };
    }
    persist(account.profile);
    return { ok: true, profile: account.profile };
  }, []);

  const signOut = useCallback(() => persist(null), []);

  const requirePortalAccess = useCallback((portal) => {
    if (!user) return { ok: false, reason: "unauthenticated" };
    if (user.portal !== portal) return { ok: false, reason: "wrong_portal" };
    return { ok: true };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, hydrated, signIn, signOut, requirePortalAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const DEMO_CREDENTIALS = Object.entries(DEMO_ACCOUNTS).map(([email, v]) => ({
  email, password: v.password, ...v.profile,
}));
