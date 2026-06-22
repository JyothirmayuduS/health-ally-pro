// Login page — branded, calm, on-trend with Medora sage system
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, landingFor } from "@/lab/auth";
import { FlaskConical, ShieldCheck, Stethoscope, TestTube2, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate(landingFor(user), { replace: true });
  }, [loading, user, navigate]);

  const startLogin = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex bg-[var(--paper)] grain-bg">
      {/* Left panel — brand story */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[var(--sage-900)] text-white">
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(circle at 20% 30%, #95b3a3 0px, transparent 50%), radial-gradient(circle at 80% 70%, #c38246 0px, transparent 50%)",
        }} />
        <div className="relative z-10 p-12 flex flex-col w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold tracking-tight text-lg">Medora Health Sciences</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/60">Integrated diagnostic care</div>
            </div>
          </div>

          <div className="mt-auto max-w-md">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-4">
              Laboratory operating system
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight leading-[1.1]">
              From sample to signed-out report.<br />
              <span className="text-[var(--sage-300)]">Everything in one place.</span>
            </h1>
            <p className="mt-5 text-white/70 leading-relaxed">
              Orders inbox · Phlebotomy · Bench processing · Supervisor validation · Patient-ready reports — all under one CLIA-aware workflow.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {[
                { icon: Stethoscope, label: "Doctors" },
                { icon: TestTube2, label: "Phlebotomy" },
                { icon: Microscope, label: "Technicians" },
                { icon: ShieldCheck, label: "Supervisors" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-lg px-3 py-2.5">
                  <Icon className="h-4 w-4 text-[var(--sage-300)]" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mt-12">
            CLIA #74D2204918 · Auckland · v1.2
          </div>
        </div>
      </div>

      {/* Right panel — sign-in */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm" data-testid="login-card">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-10 w-10 rounded-lg bg-[var(--sage-700)] flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-semibold text-lg">Medora Lab</div>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-3">
            Staff sign-in
          </div>
          <h2 className="font-display text-3xl font-semibold text-[var(--ink)] tracking-tight">
            Welcome back.
          </h2>
          <p className="mt-2 text-stone-600">
            Continue with your Medora staff Google account.
          </p>

          <Button
            data-testid="google-signin-btn"
            onClick={startLogin}
            className="mt-8 w-full h-12 bg-white hover:bg-stone-50 text-[var(--ink)] border border-stone-200 shadow-sm gap-3 text-[15px]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.59 6.59 0 0 1 5.48 12c0-.74.13-1.45.36-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-[var(--sage-50)] border border-[var(--sage-100)] text-[12px] text-[var(--sage-900)]">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              The first staff member to sign in becomes the <b>Lab Supervisor</b>. Everyone else lands as a Lab Technician — supervisors can promote roles from <span className="font-mono">Settings → Team</span>.
            </div>
          </div>

          <div className="mt-12 text-[11px] font-mono uppercase tracking-[0.16em] text-stone-400">
            Protected by Emergent Auth
          </div>
        </div>
      </div>
    </div>
  );
}
