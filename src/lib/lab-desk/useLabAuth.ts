import { useEffect, useState } from "react";
import { getAuthSession, type AuthSession } from "@/lib/supabase/auth";
import type { UserRole } from "@/lib/supabase/types";

export function useLabAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const role: UserRole | null =
    session?.roles.find((r) => r === "lab_supervisor" || r === "lab_technician") ??
    session?.primaryRole ??
    null;

  const isSupervisor = session?.roles.includes("lab_supervisor") ?? false;
  const isTechnician = session?.roles.includes("lab_technician") ?? false;

  return {
    session,
    loading,
    role,
    isSupervisor,
    isTechnician,
    name: session?.fullName ?? "Lab staff",
    email: session?.email ?? "",
  };
}
