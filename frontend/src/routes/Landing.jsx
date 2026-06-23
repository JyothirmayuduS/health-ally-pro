import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth/authContext";
import { Pill, Stethoscope, ArrowRight } from "lucide-react";

export default function LandingRedirect() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null;

  if (user?.portal === "pharmacy") return <Redirect to="/pharmacy" />;
  if (user?.portal === "doctor")   return <Redirect to="/doctor" />;

  return (
    <div data-testid="landing-page" className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="font-display text-[44px] leading-[1.05]">Oakhaven Clinic</div>
        <p className="mt-3 text-muted-foreground text-[14px]">
          Pick a portal to enter the demo. Pharmacy is the headline experience.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3">
          <Link
            to="/login"
            data-testid="cta-login"
            className="pharm-card p-5 flex items-center gap-3 text-left hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-[hsl(var(--sage-500))] flex items-center justify-center">
              <Pill className="h-5 w-5 text-[hsl(var(--paper-50))]" />
            </div>
            <div className="flex-1">
              <div className="font-display text-[16px]">Sign in</div>
              <div className="text-[12px] text-muted-foreground">Use the seeded demo accounts.</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="pharm-card p-4 text-left">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Stethoscope className="h-3 w-3" /> Demo accounts
            </div>
            <div className="font-mono text-[12px]">pharmacy@oakhaven.demo · Demo1234!</div>
            <div className="font-mono text-[12px]">doctor@oakhaven.demo · Demo1234!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Redirect({ to }) {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}
