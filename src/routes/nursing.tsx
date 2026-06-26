import { createFileRoute } from "@tanstack/react-router";
import { DeskLayout } from "@/components/desk-shell/DeskLayout";
import { NURSING_DESK } from "@/lib/desk-shell/portals";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/nursing")({
  beforeLoad: () => requirePortalAccess("nursing"),
  component: () => <DeskLayout config={NURSING_DESK} />,
});
