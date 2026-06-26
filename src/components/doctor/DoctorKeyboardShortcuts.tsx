import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

/** Keyboard shortcuts for queue and inbox workflows (web). */
export function useDoctorKeyboardShortcuts() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;

      if (e.key === "g") {
        const next = (ev: KeyboardEvent) => {
          window.removeEventListener("keydown", next, true);
          if (ev.key === "q") navigate({ to: "/doctor/queue" });
          if (ev.key === "i") navigate({ to: "/doctor/reports" });
          if (ev.key === "h") navigate({ to: "/doctor" });
          if (ev.key === "s") navigate({ to: "/doctor/schedule" });
        };
        window.addEventListener("keydown", next, true);
        return;
      }

      if (pathname.startsWith("/doctor/queue") && e.key === "n") {
        window.dispatchEvent(new CustomEvent("medora-doctor-queue-call-next"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, navigate]);
}

export function DoctorKeyboardShortcuts() {
  useDoctorKeyboardShortcuts();
  return null;
}
