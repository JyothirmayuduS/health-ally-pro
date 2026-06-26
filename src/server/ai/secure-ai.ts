import type { AiCompletionRequest, AiCompletionResult } from "@/lib/ai/types";
import { auditAiRequest } from "./audit";
import {
  canSendToCloudProvider,
  complianceSystemAddendum,
  getAiComplianceConfig,
  isProviderBaaCompliant,
} from "./compliance";
import { sanitizePhiForCloud } from "./phi-filter";
import { completeWithRouter, formatModelSource } from "./router";

export type SecureAiResult = AiCompletionResult & {
  phiRedacted: boolean;
  phiItemsRedacted: number;
  cloudAllowed: boolean;
  baaCompliant: boolean;
};

export async function completeWithCompliance(
  req: AiCompletionRequest & { auditSource?: string; taskLabel?: string },
): Promise<SecureAiResult | null> {
  const cfg = getAiComplianceConfig();
  const start = Date.now();
  const taskLabel = req.taskLabel ?? req.task;

  let system = req.system;
  let user = req.user;
  let phiRedacted = false;
  let phiItemsRedacted = 0;

  if (cfg.phiRedactionEnabled && !cfg.allowCloudPhi) {
    const sys = sanitizePhiForCloud(system);
    const usr = sanitizePhiForCloud(user);
    system = sys.text;
    user = usr.text;
    phiItemsRedacted = sys.redactedCount + usr.redactedCount;
    phiRedacted = phiItemsRedacted > 0;
    system = `${system}\n\n${complianceSystemAddendum()}`;
  }

  const result = await completeWithRouter({
    ...req,
    system,
    user,
  });

  const latencyMs = Date.now() - start;

  if (!result) {
    await auditAiRequest({
      task: taskLabel,
      phiRedacted,
      phiItemsRedacted,
      cloudAllowed: false,
      baaCompliant: false,
      promptForHash: user,
      latencyMs,
      success: false,
      errorMessage: "No compliant cloud provider available",
      source: req.auditSource,
    });
    return null;
  }

  const baaCompliant = isProviderBaaCompliant(result.provider);
  const cloudAllowed = canSendToCloudProvider(result.provider);

  await auditAiRequest({
    task: taskLabel,
    provider: result.provider,
    model: result.model,
    phiRedacted,
    phiItemsRedacted,
    cloudAllowed,
    baaCompliant,
    promptForHash: user,
    latencyMs,
    success: true,
    source: req.auditSource,
  });

  return {
    ...result,
    phiRedacted,
    phiItemsRedacted,
    cloudAllowed,
    baaCompliant,
  };
}

export { formatModelSource };
