import { supabase } from "./client";
import type { UserRole } from "./types";
import { allowDemoAuth } from "@/lib/production";
import { DEMO_STAFF_TABLE } from "./demo-credentials";

export type AuthSession = {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  primaryRole: UserRole | null;
  hospitalId: string | null;
};

const DEMO_AUTH_KEY = "medora_demo_auth";

/**
 * Demo passwords are killed unless allowDemoAuth() (dev / explicit VITE_ALLOW_DEMO_AUTH).
 * Production boot also refuses to serve if demo auth is enabled.
 */
export function getDemoCredentials(): typeof DEMO_STAFF_TABLE {
  if (!allowDemoAuth()) return {} as typeof DEMO_STAFF_TABLE;
  return DEMO_STAFF_TABLE;
}

/** @deprecated Prefer getDemoCredentials() — static snapshot for UI lists in demo mode */
export const DEMO_CREDENTIALS: Record<
  string,
  { password: string; fullName: string; roles: UserRole[]; userId: string }
> = getDemoCredentials();

/** @deprecated Use DEMO_CREDENTIALS */
export const LAB_DEMO_CREDENTIALS = DEMO_CREDENTIALS;

function writeDemoSession(session: AuthSession) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session));
  }
  if (typeof document !== "undefined") {
    const maxAge = 60 * 60 * 12;
    document.cookie = `${DEMO_AUTH_KEY}=${encodeURIComponent(JSON.stringify(session))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }
}

function clearDemoSession() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(DEMO_AUTH_KEY);
  }
  if (typeof document !== "undefined") {
    document.cookie = `${DEMO_AUTH_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

function readDemoSessionFromCookie(): AuthSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${DEMO_AUTH_KEY}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as AuthSession;
  } catch {
    return null;
  }
}

function readDemoSession(): AuthSession | null {
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(DEMO_AUTH_KEY);
      if (raw) return JSON.parse(raw) as AuthSession;
    } catch {
      /* fall through */
    }
  }
  return readDemoSessionFromCookie();
}

function tryDemoSignIn(email: string, password: string): AuthSession | null {
  if (!allowDemoAuth()) return null;
  const cred = getDemoCredentials()[email.trim().toLowerCase()];
  if (!cred || cred.password !== password) return null;
  const session: AuthSession = {
    userId: cred.userId,
    email: email.trim().toLowerCase(),
    fullName: cred.fullName,
    roles: cred.roles,
    primaryRole: cred.roles[0] ?? null,
    hospitalId: "a0000001-0001-4001-8001-000000000001",
  };
  writeDemoSession(session);
  return session;
}

export async function signIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  // Prefer local demo for *.demo accounts so staff E2E / sales demos never hang on remote Auth.
  if (allowDemoAuth() && normalized.endsWith(".demo")) {
    const demo = tryDemoSignIn(normalized, password);
    if (demo) return { user: null, session: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (!error) {
    clearDemoSession();
    return data;
  }
  const demo = tryDemoSignIn(normalized, password);
  if (demo) return { user: null, session: null };
  throw error;
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  clearDemoSession();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const demo = allowDemoAuth() ? readDemoSession() : null;
  if (demo) return demo;

  const session = await getSession();
  if (!session?.user) return null;

  const { fetchPhiResource } = await import("@/lib/supabase/phi-api");
  const membershipRes = await fetchPhiResource<
    Array<{ role: UserRole; hospital_id: string }>
  >("hospital_memberships");
  const memberships = membershipRes.ok ? (membershipRes.data ?? []) : [];

  const roles = memberships.map((m) => m.role as UserRole);
  const appRole = session.user.app_metadata?.role as UserRole | undefined;
  const allRoles = appRole && !roles.includes(appRole) ? [...roles, appRole] : roles;
  const primaryRole = pickPrimaryRole(allRoles);
  const hospitalId =
    (memberships[0]?.hospital_id as string | undefined) ??
    (session.user.app_metadata?.hospital_id as string | undefined) ??
    null;

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    fullName:
      (session.user.user_metadata?.full_name as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "User",
    roles: allRoles,
    primaryRole,
    hospitalId,
  };
}

function pickPrimaryRole(roles: UserRole[]): UserRole | null {
  const priority: UserRole[] = [
    "super_admin",
    "hospital_admin",
    "doctor",
    "receptionist",
    "lab_supervisor",
    "lab_technician",
    "pharmacist",
    "billing_staff",
    "nurse",
    "patient",
    "caregiver",
  ];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? null;
}
