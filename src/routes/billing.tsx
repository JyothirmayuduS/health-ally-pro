import { createFileRoute } from "@tanstack/react-router";
import { DeskLayout } from "@/components/desk-shell/DeskLayout";
import { BillingStoreProvider } from "@/lib/billing-desk/store";
import { BILLING_DESK } from "@/lib/desk-shell/portals";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/billing")({
  beforeLoad: () => requirePortalAccess("billing"),
  component: BillingRoot,
});

function BillingRoot() {
  return (
    <BillingStoreProvider>
      <DeskLayout config={BILLING_DESK} />
    </BillingStoreProvider>
  );
}
