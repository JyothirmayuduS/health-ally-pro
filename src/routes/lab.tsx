import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/lab-desk/store";
import AppLayout from "@/components/lab-desk/AppLayout";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/lab")({
  beforeLoad: () => requirePortalAccess("lab"),
  component: LabRoot,
});

function LabRoot() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
