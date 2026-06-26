import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/pharmacy-desk/store";
import Formulary from "@/components/pharmacy-desk/pages/Formulary";

export const Route = createFileRoute("/admin/pharmacy-formulary")({
  component: AdminPharmacyFormulary,
});

function AdminPharmacyFormulary() {
  return (
    <StoreProvider>
      <Formulary mode="admin" />
    </StoreProvider>
  );
}
