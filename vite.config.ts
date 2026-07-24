import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // Required for wrangler / vite preview to resolve @tanstack/react-start/server-entry
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  // Prometheus scrapes via Docker DNS (Host: app:3000). Vite 7 rejects unknown hosts with 403.
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
});
