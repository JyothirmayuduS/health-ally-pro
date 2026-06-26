import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAiComplianceConfig } from "./compliance";
import { hashPrompt } from "./phi-filter";

export type AuditAiRequest = {
  task: string;
  provider?: string;
  model?: string;
  phiRedacted: boolean;
  phiItemsRedacted: number;
  cloudAllowed: boolean;
  baaCompliant: boolean;
  promptForHash: string;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  source?: string;
  hospitalId?: string;
  userId?: string;
};

export async function auditAiRequest(entry: AuditAiRequest): Promise<void> {
  const cfg = getAiComplianceConfig();
  if (!cfg.auditEnabled) return;

  const admin = getSupabaseAdmin();
  const row = {
    task: entry.task,
    provider: entry.provider ?? null,
    model: entry.model ?? null,
    phi_redacted: entry.phiRedacted,
    phi_items_redacted: entry.phiItemsRedacted,
    cloud_allowed: entry.cloudAllowed,
    baa_compliant: entry.baaCompliant,
    prompt_hash: hashPrompt(entry.promptForHash),
    latency_ms: entry.latencyMs,
    success: entry.success,
    error_message: entry.errorMessage ?? null,
    source: entry.source ?? "web",
    hospital_id: entry.hospitalId ?? null,
    user_id: entry.userId ?? null,
  };

  if (admin) {
    try {
      await admin.from("ai_audit_log").insert(row);
      return;
    } catch {
      /* fall through to console */
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[Medora AI Audit]", JSON.stringify(row));
  }
}
