// Handles Emergent Auth redirect callback (URL hash contains session_id=…)
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeSession } from "@/lab/api";
import { useAuth, landingFor } from "@/lab/auth";
import { FlaskConical, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      navigate("/login", { replace: true });
      return;
    }
    const sid = decodeURIComponent(m[1]);
    (async () => {
      try {
        const { user } = await exchangeSession(sid);
        setUser(user);
        // Clear the fragment from the URL
        window.history.replaceState({}, "", window.location.pathname);
        navigate(landingFor(user), { replace: true, state: { user } });
      } catch (e) {
        setError("Sign-in failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-[var(--sage-700)] flex items-center justify-center mx-auto mb-4 shadow-md">
          <FlaskConical className="h-7 w-7 text-white" />
        </div>
        <div className="font-display text-lg font-semibold text-[var(--ink)]">
          {error || "Signing you in…"}
        </div>
        {!error && (
          <div className="mt-3 text-sm text-stone-500 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying with Emergent Auth
          </div>
        )}
      </div>
    </div>
  );
}
