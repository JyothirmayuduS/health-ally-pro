import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import PharmacySidebar from "./Sidebar";
import { PharmacyProvider } from "@/lib/pharmacy-desk/store";
import { useAuth } from "@/lib/auth/authContext";

export default function PharmacyLayout() {
  const { user, hydrated, requirePortalAccess } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading desk…
      </div>
    );
  }

  const access = requirePortalAccess("pharmacy");
  if (!access.ok) {
    return <Navigate to="/login" replace state={{ from: location.pathname, portal: "pharmacy" }} />;
  }

  return (
    <PharmacyProvider>
      <div data-testid="pharmacy-portal-root" className="min-h-screen flex bg-background text-foreground relative">
        <PharmacySidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </PharmacyProvider>
  );
}
