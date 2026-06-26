#!/usr/bin/env node
/**
 * Generates staff portal route files for TanStack Router.
 * Run: node scripts/generate-portal-routes.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesDir = join(__dirname, "../src/routes");

const portals = {
  admin: ["hospital", "branches", "departments", "staff", "doctors", "services", "lab-catalog", "settings", "analytics"],
  reception: ["register", "patients", "appointments", "check-in", "queue", "token-display"],
  doctor: ["schedule", "queue", "patients", "encounters", "orders", "prescriptions", "results"],
  lab: ["orders", "collection", "processing", "validation"],
  pharmacy: ["prescriptions", "dispense", "refills", "inventory"],
  billing: ["encounters", "invoices", "payments"],
  nursing: ["patients", "vitals"],
};

function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

for (const [portal, pages] of Object.entries(portals)) {
  const layoutPath = join(routesDir, `${portal}.tsx`);
  const layoutContent = `import { createFileRoute } from "@tanstack/react-router";
import { StaffPortalShell } from "@/components/portals/StaffPortalShell";
import { requirePortalAccess } from "@/lib/supabase/rbac";

export const Route = createFileRoute("/${portal}")({
  beforeLoad: () => requirePortalAccess("${portal}"),
  component: () => <StaffPortalShell portal="${portal}" />,
});
`;
  writeFileSync(layoutPath, layoutContent);

  const indexPath = join(routesDir, `${portal}.index.tsx`);
  const indexContent = `import { createFileRoute } from "@tanstack/react-router";
import { PortalPlaceholder } from "@/components/portals/PortalPlaceholder";

export const Route = createFileRoute("/${portal}/")({
  component: () => <PortalPlaceholder title="${titleCase(portal)} Dashboard" description="Overview and quick actions for the ${portal} portal." />,
});
`;
  writeFileSync(indexPath, indexContent);

  for (const page of pages) {
    const fileName = `${portal}.${page}.tsx`;
    const routePath = `/${portal}/${page}`;
    const content = `import { createFileRoute } from "@tanstack/react-router";
import { PortalPlaceholder } from "@/components/portals/PortalPlaceholder";

export const Route = createFileRoute("${routePath}")({
  component: () => <PortalPlaceholder title="${titleCase(page)}" description="${titleCase(portal)} · ${titleCase(page)} module." />,
});
`;
    writeFileSync(join(routesDir, fileName), content);
  }
}

console.log("Portal routes generated.");
