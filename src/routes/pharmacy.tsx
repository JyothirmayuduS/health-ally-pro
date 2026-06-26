import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/pharmacy-desk/store";
import AppLayout from "@/components/pharmacy-desk/AppLayout";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/pharmacy")({
  beforeLoad: () => requirePortalAccess("pharmacy"),
  component: PharmacyRoot,
});

function PharmacyRoot() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
