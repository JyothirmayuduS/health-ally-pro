import { createFileRoute } from "@tanstack/react-router";
import { DeskLayout } from "@/components/desk-shell/DeskLayout";
import { resolveAdminDesk } from "@/lib/desk-shell/portals";
import { requirePortalAccess } from "@/lib/supabase/rbac";
import { AdminStoreProvider } from "@/lib/admin-desk/store";

export const Route = createFileRoute("/admin")({
  // Client-side gate so demo sessionStorage sessions work in E2E / local demos.
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    await requirePortalAccess("admin");
  },
  component: () => (
    <AdminStoreProvider>
      <DeskLayout config={resolveAdminDesk()} />
    </AdminStoreProvider>
  ),
});
