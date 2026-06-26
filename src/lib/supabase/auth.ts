import { supabase } from "./client";
import type { UserRole } from "./types";

export type AuthSession = {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  primaryRole: UserRole | null;
  hospitalId: string | null;
};

const DEMO_AUTH_KEY = "medora_demo_auth";

/** Staff demo logins — used when Supabase user is missing or credentials not synced yet. */
export const DEMO_CREDENTIALS: Record<
  string,
  { password: string; fullName: string; roles: UserRole[]; userId: string }
> = {
  "lab@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "J. Mensah",
    roles: ["lab_technician"],
    userId: "demo-lab-technician",
  },
  "lab.supervisor@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Rajan",
    roles: ["lab_supervisor"],
    userId: "demo-lab-supervisor",
  },
  "pharmacy@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Riley Chen",
    roles: ["pharmacist"],
    userId: "demo-pharmacist",
  },
  "reception@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Maya Kapoor",
    roles: ["receptionist"],
    userId: "demo-receptionist",
  },
  "billing@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Anita Rao",
    roles: ["billing_staff"],
    userId: "demo-billing",
  },
  "nursing@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Sunita Pillai",
    roles: ["nurse"],
    userId: "demo-nurse",
  },
  "admin@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Admin User",
    roles: ["hospital_admin"],
    userId: "demo-admin",
  },
  "doctor@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Tyra Dhillon",
    roles: ["doctor"],
    userId: "demo-doctor",
  },
  "patient@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Anjali Krishnan",
    roles: ["patient"],
    userId: "demo-patient",
  },
};

/** @deprecated Use DEMO_CREDENTIALS */
export const LAB_DEMO_CREDENTIALS = DEMO_CREDENTIALS;

function readDemoSession(): AuthSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEMO_AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(session: AuthSession) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session));
  }
}

function clearDemoSession() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(DEMO_AUTH_KEY);
  }
}

function tryDemoSignIn(email: string, password: string): AuthSession | null {
  const cred = DEMO_CREDENTIALS[email.trim().toLowerCase()];
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    clearDemoSession();
    return data;
  }
  const demo = tryDemoSignIn(email, password);
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
  const demo = readDemoSession();
  if (demo) return demo;

  const session = await getSession();
  if (!session?.user) return null;

  const { data: memberships } = await supabase
    .from("hospital_memberships")
    .select("role, hospital_id")
    .eq("profile_id", session.user.id)
    .eq("is_active", true);

  const roles = (memberships ?? []).map((m) => m.role as UserRole);
  const appRole = session.user.app_metadata?.role as UserRole | undefined;
  const allRoles = appRole && !roles.includes(appRole) ? [...roles, appRole] : roles;
  const primaryRole = pickPrimaryRole(allRoles);
  const hospitalId =
    (memberships?.[0]?.hospital_id as string | undefined) ??
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
