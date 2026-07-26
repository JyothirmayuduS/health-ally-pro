import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/lab-desk/store";
import AppLayout from "@/components/lab-desk/AppLayout";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/lab")({
  // Client-only: demo sessions live in sessionStorage/cookie and are invisible to SSR.
  // Server beforeLoad was bouncing lab@oakhaven.demo → /login?redirect=/lab in a loop.
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    await requirePortalAccess("lab");
  },
  component: LabRoot,
});

function LabRoot() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
