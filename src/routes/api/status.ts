import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { persistenceAvailable } from "@/server/hospital-persistence";
import { getServerLicense } from "@/server/license";
import { checkProductionBoot, productionBootHttpResponse } from "@/server/production-boot";
import { getAuditWriteFailuresHealth, getPhiAuditSchedulerHealth } from "@/server/phi-audit";
import { getRecentRequestStats, newRequestId, withRequestLog } from "@/server/request-log";

/**
 * Public operational status — no PHI.
 */
export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const blocked = productionBootHttpResponse();
        if (blocked) return withRequestLog(request, started, blocked);

        const boot = checkProductionBoot();
        const license = getServerLicense();
        const persistence = persistenceAvailable();
        const stripe = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_"));
        const turnstile = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
        const demoAuthOff =
          process.env.VITE_ALLOW_DEMO_AUTH !== "true" && process.env.ALLOW_DEMO_PERSIST !== "true";
        const dlq = await getAuditWriteFailuresHealth();
        const auditScheduler = getPhiAuditSchedulerHealth();
        const forceFailRaw = process.env.PHI_AUDIT_FORCE_FAIL;
        const forceFailEnabled = forceFailRaw === "1" || forceFailRaw === "true";
        const diagnosticRaw = process.env.PHI_AUDIT_DIAGNOSTIC_MODE;
        const diagnosticEnabled = diagnosticRaw === "1" || diagnosticRaw === "true";
        const reqStats = getRecentRequestStats();

        const build = {
          git_commit: process.env.MEDORA_GIT_COMMIT || process.env.GIT_COMMIT || "unknown",
          build_version: process.env.MEDORA_BUILD_VERSION || process.env.BUILD_VERSION || "unknown",
          built_at: process.env.MEDORA_BUILT_AT || process.env.BUILT_AT || null,
          environment: process.env.MEDORA_BUILD_ENVIRONMENT || process.env.NODE_ENV || "unknown",
          dirty_working_tree: process.env.MEDORA_BUILD_DIRTY === "true",
        };

        const checks = [
          { id: "app", label: "Application", ok: true },
          { id: "persistence", label: "Database persistence", ok: persistence },
          { id: "license", label: "License configured", ok: license.licensed },
          {
            id: "demo_auth_off",
            label: "Demo auth disabled",
            ok: boot.ok && demoAuthOff,
          },
          {
            id: "audit_dlq",
            label: "Audit write DLQ",
            ok: dlq.ok,
            open_failures: dlq.open_failures,
            acknowledged_failures: dlq.acknowledged_failures,
            alert: dlq.alert,
          },
          {
            id: "force_fail_off",
            label: "PHI audit force-fail disabled",
            ok: !forceFailEnabled,
          },
          {
            id: "audit_scheduler",
            label: "PHI audit waitUntil scheduler",
            ok: auditScheduler.ok,
            wait_until_type: auditScheduler.wait_until_type,
            no_op_fallback: auditScheduler.no_op_fallback,
          },
          {
            id: "audit_diagnostic_off",
            label: "PHI audit diagnostic mode disabled in production",
            ok: !(auditScheduler.production_runtime && diagnosticEnabled),
          },
          { id: "billing", label: "Stripe billing", ok: stripe, optional: true },
          { id: "bot_guard", label: "Turnstile", ok: turnstile, optional: true },
        ];

        const requiredOk = checks
          .filter((c) => !("optional" in c && c.optional))
          .every((c) => c.ok);
        const body = {
          ok: requiredOk,
          status: requiredOk ? "operational" : "degraded",
          checkedAt: new Date().toISOString(),
          plan: license.plan,
          build,
          checks,
          audit_dlq: dlq,
          audit_scheduler: auditScheduler,
          request_stats_5m: reqStats,
          latency_budgets: {
            appointments_worker_p95_warn_ms: 400,
            appointments_worker_p95_critical_ms: 800,
            appointments_worker_p99_critical_ms: 1500,
            appointments_concurrent8_p95_warn_ms: 1200,
            appointments_concurrent8_p95_critical_ms: 2000,
            reasoning:
              "Post-index warm sequential p50~119ms p95~212ms; cold-auth p95~410ms; concurrent-8 p95~425ms. See docs/OPERATIONS_LATENCY_BUDGET.md.",
          },
        };
        const res = jsonResponse(body);
        return withRequestLog(request, started, res, { request_id: newRequestId(request) });
      },
    },
  },
});
