import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getAuthSession, signIn } from "@/lib/supabase/auth";
import { allowDemoAuth } from "@/lib/production";
import { redirectPathForRoles } from "@/lib/supabase/rbac";
import { DEMO_STAFF_TABLE } from "@/lib/supabase/demo-credentials";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
    error: (search.error as string) || undefined,
  }),
  component: LoginPage,
});

function demoPassword(email: string): string {
  return DEMO_STAFF_TABLE[email]?.password ?? "";
}

const DEMO_ACCOUNTS = [
  {
    role: "Lab technician",
    workspace: "Bench — collection, processing, my records",
    email: "lab@oakhaven.demo",
    password: demoPassword("lab@oakhaven.demo"),
    accent: "border-l-teal",
  },
  {
    role: "Lab supervisor",
    workspace: "Control desk — validation, analytics, team",
    email: "lab.supervisor@oakhaven.demo",
    password: demoPassword("lab.supervisor@oakhaven.demo"),
    accent: "border-l-sage",
  },
  {
    role: "Pharmacist",
    workspace: "Dispense, inventory, medicine search & shelf map",
    email: "pharmacy@oakhaven.demo",
    password: demoPassword("pharmacy@oakhaven.demo"),
    accent: "border-l-mustard",
  },
  {
    role: "Receptionist",
    workspace: "Register, check-in, queue, billing counter",
    email: "reception@oakhaven.demo",
    password: demoPassword("reception@oakhaven.demo"),
    accent: "border-l-sky",
  },
  {
    role: "Billing staff",
    workspace: "Invoices, payments, encounter linkage",
    email: "billing@oakhaven.demo",
    password: demoPassword("billing@oakhaven.demo"),
    accent: "border-l-indigo",
  },
  {
    role: "Nurse",
    workspace: "Patient census, vitals recording",
    email: "nursing@oakhaven.demo",
    password: demoPassword("nursing@oakhaven.demo"),
    accent: "border-l-rose",
  },
  {
    role: "Doctor (Medicine)",
    workspace: "General medicine specialty desk + EMR",
    email: "doctor@oakhaven.demo",
    password: demoPassword("doctor@oakhaven.demo"),
    accent: "border-l-sage",
  },
  {
    role: "Doctor (Eye)",
    workspace: "Ophthalmology visual acuity, IOP, procedures",
    email: "ophthalmology@oakhaven.demo",
    password: demoPassword("ophthalmology@oakhaven.demo"),
    accent: "border-l-sky",
  },
  {
    role: "Doctor (Heart)",
    workspace: "Cardiology ECG, echo, risk scores",
    email: "cardiology@oakhaven.demo",
    password: demoPassword("cardiology@oakhaven.demo"),
    accent: "border-l-rose",
  },
  {
    role: "Doctor (Children)",
    workspace: "Pediatrics growth, immunization, PEWS",
    email: "pediatrics@oakhaven.demo",
    password: demoPassword("pediatrics@oakhaven.demo"),
    accent: "border-l-teal",
  },
  {
    role: "Doctor (Bones)",
    workspace: "Orthopedics fracture, ROM, implant OT",
    email: "orthopedics@oakhaven.demo",
    password: demoPassword("orthopedics@oakhaven.demo"),
    accent: "border-l-mustard",
  },
  {
    role: "Patient",
    workspace: "Book visits, live queue, reports, profile",
    email: "patient@oakhaven.demo",
    password: demoPassword("patient@oakhaven.demo"),
    accent: "border-l-clay",
  },
  {
    role: "Hospital admin",
    workspace: "Add doctors + specialty → specialty desks",
    email: "admin@oakhaven.demo",
    password: demoPassword("admin@oakhaven.demo"),
    accent: "border-l-ink",
  },
] as const;

function LoginPage() {
  const { redirect, error: searchError } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchError === "unauthorized" ? "You do not have access to that portal." : "",
  );
  const [loading, setLoading] = useState(false);

  async function completeSignIn(targetEmail: string, targetPassword: string) {
    setLoading(true);
    setError("");
    try {
      await signIn(targetEmail, targetPassword);
      const session = await getAuthSession();
      if (!session) {
        setError("Sign in failed — no session");
        return;
      }
      const path = redirect ?? redirectPathForRoles(session.roles);
      // Full navigation so portal shells reliably pick up demo sessionStorage
      window.location.assign(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await completeSignIn(email, password);
  }

  async function signInDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    await completeSignIn(account.email, account.password);
  }

  return (
    <div className="reception-desk flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <div className="surface w-full max-w-md p-8">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
          Medora
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-ink-900">
          Sign in
        </h1>
        <p className="mt-2 text-[13px] text-ink-600">Staff portal login — all desks.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-ink-200 bg-white px-4 text-[13px] focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              placeholder="you@hospital.demo"
            />
          </label>
          <label className="block text-sm">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-ink-200 bg-white px-4 text-[13px] focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </label>
          {error && <p className="text-[13px] text-clay">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary h-10 w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {allowDemoAuth() ? (
        <div className="mt-8 border-t border-ink-200 pt-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
            Demo accounts
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => signInDemo(account)}
                className={`surface row-hover w-full border-l-4 px-4 py-3 text-left transition-colors disabled:opacity-60 ${account.accent}`}
              >
                <div className="text-[13px] font-medium text-ink-900">{account.role}</div>
                <div className="mt-0.5 text-[12px] text-ink-600">{account.workspace}</div>
                <div className="mt-1 font-mono text-[11px] text-ink-600">
                  {account.email} · {account.password}
                </div>
              </button>
            ))}
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}
