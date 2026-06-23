import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth/authContext";
import { Pill, ArrowRight, KeyRound } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn({ email, password });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    const to = res.profile.portal === "doctor" ? "/doctor" : "/pharmacy";
    const from = location.state?.from && location.state.from !== "/login" ? location.state.from : to;
    navigate(from, { replace: true });
  };

  const quickFill = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:w-[44%] bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-[hsl(var(--paper-50))]/15 flex items-center justify-center">
              <Pill className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <div>
              <div className="font-display text-[22px] leading-tight">Oakhaven</div>
              <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">Clinic Operating System</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-[44px] leading-[1.05]">
            The counter, calmly run.
          </h1>
          <p className="mt-4 text-[15px] opacity-85">
            Receive prescriptions from doctors, dispense safely from stock,
            and keep refills moving — all in one paper‑calm workspace.
          </p>
          <ul className="mt-6 space-y-2 text-[13px] opacity-90">
            <li>· Triage STAT scripts in seconds</li>
            <li>· Batch-aware dispensing with FIFO expiry</li>
            <li>· Refill approvals create fresh Rx instantly</li>
          </ul>
        </div>
        <div className="relative z-10 text-[11px] opacity-70">© Oakhaven · pharmacy desk</div>

        {/* Decorative grain/blobs */}
        <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-[hsl(var(--paper-50))]/5 blur-3xl" />
        <div className="absolute -top-24 -left-20 h-[280px] w-[280px] rounded-full bg-[hsl(var(--paper-50))]/8 blur-3xl" />
      </aside>

      {/* Right form */}
      <main className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--sage-500))] flex items-center justify-center">
              <Pill className="h-5 w-5 text-[hsl(var(--paper-50))]" />
            </div>
            <div className="font-display text-[18px]">Oakhaven</div>
          </div>

          <h2 className="font-display text-[32px] leading-tight">Sign in</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Use your staff account to enter the pharmacy desk.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@oakhaven.demo"
                autoComplete="email"
                data-testid="login-email"
                className="pharm-input mt-1"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                data-testid="login-password"
                className="pharm-input mt-1"
                required
              />
            </div>

            {error && (
              <div data-testid="login-error" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="login-submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--sage-700))] transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 pharm-card p-4 bg-[hsl(var(--paper-100))]/40">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <KeyRound className="h-3 w-3" /> Demo accounts
            </div>
            <ul className="mt-2 space-y-1.5">
              {DEMO_CREDENTIALS.map((cred) => (
                <li key={cred.email} className="flex items-center gap-2 text-[12px]">
                  <button
                    onClick={() => quickFill(cred)}
                    data-testid={`demo-fill-${cred.portal}`}
                    className="text-left flex-1 rounded-md border border-border/70 bg-card px-3 py-1.5 hover:bg-[hsl(var(--paper-200))]/60 transition-colors"
                  >
                    <div className="font-mono text-[11.5px] text-[hsl(var(--ink))]">{cred.email}</div>
                    <div className="text-[10px] text-muted-foreground">{cred.name} · {cred.title}</div>
                  </button>
                  <span className="font-mono text-[10px] text-muted-foreground">{cred.password}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
