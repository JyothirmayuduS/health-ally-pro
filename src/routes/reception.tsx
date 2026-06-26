import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/reception-desk/store";
import AppLayout from "@/components/reception-desk/AppLayout";

export const Route = createFileRoute("/reception")({
  component: ReceptionRoot,
});

function ReceptionRoot() {
  const { pathname } = useLocation();
  const fullscreen = pathname === "/reception/token-display";

  return (
    <StoreProvider>
      {fullscreen ? <Outlet /> : <AppLayout />}
    </StoreProvider>
  );
}
