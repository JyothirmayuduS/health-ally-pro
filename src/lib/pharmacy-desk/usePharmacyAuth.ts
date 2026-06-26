import { useEffect, useState } from "react";
import { getAuthSession, type AuthSession } from "@/lib/supabase/auth";

export function usePharmacyAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  return {
    session,
    loading,
    name: session?.fullName ?? "Pharmacist",
    email: session?.email ?? "",
  };
}
