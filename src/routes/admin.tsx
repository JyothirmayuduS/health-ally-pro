import { createFileRoute } from "@tanstack/react-router";
import { DeskLayout } from "@/components/desk-shell/DeskLayout";
import { ADMIN_DESK } from "@/lib/desk-shell/portals";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => requirePortalAccess("admin"),
  component: () => <DeskLayout config={ADMIN_DESK} />,
});
