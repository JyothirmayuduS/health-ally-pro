import { Link, createRootRoute, HeadContent, Outlet, Scripts, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

import appCss from "../styles.css?url";

function usesPatientShell(pathname: string) {
  if (pathname === "/login" || pathname === "/register") return false;
  if (/^\/(admin|reception|doctor|lab|pharmacy|billing|nursing)(\/|$)/.test(pathname)) {
    return false;
  }
  return (
    pathname === "/" ||
    pathname.startsWith("/care") ||
    pathname.startsWith("/health") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/medications") ||
    pathname.startsWith("/diet") ||
    pathname.startsWith("/exercise") ||
    pathname.startsWith("/profile")
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-foreground">404</h1>
        <h2 className="mt-4 font-serif text-2xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Medora — Curated medical care, on your schedule" },
      {
        name: "description",
        content:
          "Book trusted doctors, track your queue in real time, and securely share medical reports with the specialists who need them.",
      },
      { property: "og:title", content: "Medora — Curated medical care" },
      {
        property: "og:description",
        content:
          "Book doctors, track queues, and share reports — calmly and securely.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

import { useState, useEffect } from "react";

function RootShell({ children }: { children: React.ReactNode }) {
  const [showWatermark, setShowWatermark] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("medora_owner_key") === "jyothirmayudu_owner_2026") {
        setShowWatermark(false);
      }
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {showWatermark && (
          <>
            {/* Diagonal Grid Watermark */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 99999,
                opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='450' height='300' viewBox='0 0 450 300'%3E%3Ctext x='20' y='150' fill='%23000' font-family='sans-serif' font-size='13' font-weight='bold' transform='rotate(-20 150 150)'%3EMEDORA ERP - PROPRIETARY JYOTHIRMAYUDU S. - DO NOT DISTRIBUTE%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            />
            {/* Floating License Tag */}
            <div
              style={{
                position: "fixed",
                bottom: "12px",
                right: "12px",
                pointerEvents: "auto",
                zIndex: 99999,
                background: "#1e293b",
                color: "#f8fafc",
                border: "1px solid #334155",
                padding: "6px 12px",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                userSelect: "none",
              }}
            >
              🔒 JYOTHIRMAYUDU S. - PROPRIETARY COPY
            </div>
          </>
        )}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { pathname } = useLocation();
  if (usesPatientShell(pathname)) {
    return <AppShell />;
  }
  return <Outlet />;
}
