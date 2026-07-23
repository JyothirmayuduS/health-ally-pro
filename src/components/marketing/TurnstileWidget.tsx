import { useEffect, useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string | null) => void;
};

/** Renders Cloudflare Turnstile when VITE_TURNSTILE_SITE_KEY is set; otherwise no-op. */
export function TurnstileWidget({ onToken }: Props) {
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim();
  const mountId = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      onToken(null);
      return;
    }

    let widgetId: string | null = null;
    let cancelled = false;

    const mount = () => {
      const el = document.getElementById(`cf-turnstile-${mountId}`);
      if (!el || !window.turnstile || cancelled) return;
      widgetId = window.turnstile.render(el, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        theme: "light",
      });
      setReady(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );
    if (existing && window.turnstile) {
      mount();
    } else if (existing) {
      existing.addEventListener("load", mount);
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = mount;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* ignore */
        }
      }
    };
  }, [siteKey, mountId, onToken]);

  if (!siteKey) return null;

  return (
    <div className="pt-1">
      <div id={`cf-turnstile-${mountId}`} />
      {!ready ? (
        <p className="text-[11px] text-[#8A8F8C]">Loading verification…</p>
      ) : null}
    </div>
  );
}
