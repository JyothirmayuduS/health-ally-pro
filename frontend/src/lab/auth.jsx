// Auth context — Emergent Google OAuth
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchMe, logout as apiLogout } from "@/lab/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const u = await fetchMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: if returning from OAuth callback (hash contains session_id),
    // skip /auth/me — AuthCallback will exchange first and update us.
    if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, refresh: checkAuth, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const DEFAULT_ROUTE_FOR = {
  lab_supervisor: "/lab",
  lab_technician: "/lab",
  doctor: "/doctor",
  receptionist: "/reception",
};

export function landingFor(user) {
  if (!user) return "/login";
  return DEFAULT_ROUTE_FOR[user.role] || "/lab";
}
