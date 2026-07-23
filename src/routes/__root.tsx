import {
  Link,
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DeskHydrator } from "@/components/DeskHydrator";

import appCss from "../styles.css?url";

function usesPatientShell(pathname: string) {
  if (pathname === "/login" || pathname === "/register") return false;
  if (
    pathname === "/" ||
    pathname.startsWith("/for-hospitals") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/register-hospital") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/sla") ||
    pathname.startsWith("/implement") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/trust")
  ) {
    return false;
  }
  if (/^\/(admin|reception|doctor|lab|pharmacy|billing|nursing)(\/|$)/.test(pathname)) {
    return false;
  }
  return (
    pathname === "/app" ||
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

function isMarketingPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/for-hospitals") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/register-hospital") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/sla") ||
    pathname.startsWith("/implement") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/trust")
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-4">
      <div className="max-w-md text-center text-[#1B3B2E]">
        <h1 className="font-serif text-7xl">404</h1>
        <h2 className="mt-4 font-serif text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-[#5C6B63]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#1B3B2E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#244C3B]"
          >
            Hospital home
          </Link>
          <Link
            to="/for-hospitals"
            className="inline-flex items-center justify-center rounded-full border border-[#1B3B2E]/20 px-5 py-2.5 text-sm font-medium hover:bg-white"
          >
            Product
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
      { title: "Medora — Hospital OS for multi-specialty campuses" },
      {
        name: "description",
        content:
          "License specialty-true doctor desks, 3D anatomy, lab, pharmacy, billing, and patient engagement for your hospital.",
      },
      { property: "og:title", content: "Medora — Hospital OS" },
      {
        property: "og:description",
        content:
          "Specialty-true clinical workspaces ready to license for multi-specialty hospitals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
import { isEvaluationBuild, getLicenseStatus } from "@/lib/license";
import { assertClientProductionSafe } from "@/lib/production";

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { pathname } = useLocation();
  const [showWatermark, setShowWatermark] = useState(false);

  useEffect(() => {
    assertClientProductionSafe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Licensed prod builds: no watermark. Evaluation only on product shells.
    if (isMarketingPath(pathname) || !isEvaluationBuild()) {
      setShowWatermark(false);
      return;
    }
    setShowWatermark(true);
  }, [pathname]);

  const content = usesPatientShell(pathname) ? <AppShell /> : <Outlet />;
  const license = getLicenseStatus();

  return (
    <>
      <DeskHydrator />
      {content}
      {showWatermark && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              pointerEvents: "none",
              zIndex: 99999,
              opacity: 0.035,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='300' viewBox='0 0 480 300'%3E%3Ctext x='20' y='150' fill='%23000' font-family='sans-serif' font-size='13' font-weight='bold' transform='rotate(-20 150 150)'%3EMEDORA EVALUATION — NOT FOR LIVE PATIENT CARE%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
            aria-hidden
          />
          <div
            style={{
              position: "fixed",
              bottom: "12px",
              right: "12px",
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
            EVALUATION · {license.plan.toUpperCase()} · NOT FOR LIVE PHI
          </div>
        </>
      )}
    </>
  );
}
