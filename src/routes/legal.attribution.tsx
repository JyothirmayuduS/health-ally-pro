import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/legal/attribution")({
  head: () => ({ meta: [{ title: "Attributions — Medora" }] }),
  component: function LegalAttributionPage() {
    return (
      <LegalShell title="Open source & anatomy attribution">
        <p>
          Medora includes a 3D anatomical atlas (`body-atlas.glb`) derived from open anatomical
          mesh projects in the Z-Anatomy tradition. Confirm upstream license terms before
          redistribution. See repository file <code>ATTRIBUTION.md</code>.
        </p>
        <p>
          Application dependencies (React, TanStack, Three.js, Radix, Supabase, and others) are
          licensed under their respective open-source terms as listed in <code>package.json</code>.
        </p>
      </LegalShell>
    );
  },
});
