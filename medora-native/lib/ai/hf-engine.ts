/**
 * @deprecated Use medora-api.ts — all inference routes through the secure Medora server.
 * Direct Hugging Face calls are disabled to prevent client-side API key exposure.
 */

export interface HFResponse {
  answer: string;
  source: string;
}

export const queryHuggingFace = async (
  _prompt: string,
  onStep: (step: string) => void,
): Promise<HFResponse> => {
  onStep("Direct HF client disabled — use Medora secure API");
  throw new Error("Use medoraApiChat via brain.ts — client-side HF is disabled for HIPAA compliance");
};
