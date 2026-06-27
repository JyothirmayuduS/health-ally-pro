import { createFileRoute } from "@tanstack/react-router";
import TokenBoard from "@/components/reception-desk/pages/TokenBoard";

export const Route = createFileRoute("/reception/token-board")({
  component: TokenBoard,
});
