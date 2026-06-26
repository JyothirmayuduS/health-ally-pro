import { useMemo } from "react";
import { LAB_DEMO_CREDENTIALS } from "@/lib/supabase/auth";
import type { AuthSession } from "@/lib/supabase/auth";
import type { LabOrder } from "./mockData";
import { useLabStore } from "./store";
import { useLabAuth } from "./useLabAuth";

/** Demo technician login — all bench records tie to this email. */
export const DEMO_TECH_EMAIL = "lab@oakhaven.demo";

/** Names that map to the demo technician account (Supabase vs demo session). */
const TECH_NAME_ALIASES: Record<string, string[]> = {
  [DEMO_TECH_EMAIL]: ["J. Mensah", "Sam Patel", "Marcus Lin"],
};

export type TechnicianContext = {
  name: string;
  email: string;
};

export function technicianContextFromSession(session: AuthSession | null): TechnicianContext {
  if (!session) return { name: "", email: "" };
  const email = session.email?.trim().toLowerCase() ?? "";
  const cred = LAB_DEMO_CREDENTIALS[email];
  return {
    email,
    name: cred?.fullName ?? session.fullName ?? "",
  };
}

function matchesTechnicianName(order: LabOrder, name: string) {
  if (!name) return false;
  const parts = name.trim().split(/\s+/);
  const lastName = parts[parts.length - 1]?.replace(/\./g, "") ?? "";
  const compact = name.replace(/\s+/g, " ");

  return (
    order.assigned_to?.includes(compact) === true ||
    order.collector?.includes(compact) === true ||
    (lastName.length > 1 &&
      (order.collector?.includes(lastName) === true ||
        order.assigned_to?.includes(lastName) === true)) ||
    order.history.some(
      (h) => h.actor.includes(compact) || (lastName.length > 1 && h.actor.includes(lastName)),
    )
  );
}

/** Match orders handled by the logged-in bench technician. */
export function technicianOwnsOrder(
  order: LabOrder,
  ctx: TechnicianContext | string,
) {
  const context: TechnicianContext =
    typeof ctx === "string" ? { name: ctx, email: "" } : ctx;

  if (context.email === DEMO_TECH_EMAIL && order.bench_tech_email === DEMO_TECH_EMAIL) {
    return true;
  }
  if (context.email && order.bench_tech_email === context.email) return true;

  const names = new Set<string>();
  if (context.name) names.add(context.name);
  TECH_NAME_ALIASES[context.email]?.forEach((n) => names.add(n));

  for (const name of names) {
    if (matchesTechnicianName(order, name)) return true;
  }
  return false;
}

/** Stamp demo technician email on seed / bench orders. */
export function inferBenchTechEmail(order: LabOrder): string | null {
  if (
    order.assigned_to?.includes("J. Mensah") ||
    order.collector?.includes("Mensah") ||
    order.history.some((h) => h.actor.includes("Mensah"))
  ) {
    return DEMO_TECH_EMAIL;
  }
  return null;
}

export function useTechnicianContext() {
  const { session } = useLabAuth();
  return useMemo(() => technicianContextFromSession(session), [session]);
}

export function useTechnicianOrders() {
  const { orders } = useLabStore();
  const ctx = useTechnicianContext();
  return useMemo(
    () => orders.filter((o) => technicianOwnsOrder(o, ctx)),
    [orders, ctx],
  );
}
