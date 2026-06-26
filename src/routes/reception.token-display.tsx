import { createFileRoute } from "@tanstack/react-router";
import TokenDisplay from "@/components/reception-desk/pages/TokenDisplay";

export const Route = createFileRoute("/reception/token-display")({
  component: TokenDisplay,
});
