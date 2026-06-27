import { createFileRoute } from "@tanstack/react-router";
import { DeskLayout } from "@/components/desk-shell/DeskLayout";
import { ADMIN_DESK } from "@/lib/desk-shell/portals";
import { requirePortalAccess } from "@/lib/supabase/rbac";
import { AdminStoreProvider } from "@/lib/admin-desk/store";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requirePortalAccess("admin"),
  component: () => (
    <AdminStoreProvider>
      <DeskLayout config={ADMIN_DESK} />
    </AdminStoreProvider>
  ),
});

