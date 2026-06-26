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
  if (usesPatientShell(pathname)) {
    return <AppShell />;
  }
  return <Outlet />;
}
