import { Shield } from "lucide-react";

type Props = {
  phiRedacted?: boolean;
  cloudEnabled?: boolean;
  vectorRag?: boolean;
  compact?: boolean;
};

export function MedoraAiComplianceBadge({
  phiRedacted = true,
  cloudEnabled,
  vectorRag,
  compact,
}: Props) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-[#1B3B2E]/15 bg-[#F5F9F7] text-[#5C635F] ${
        compact ? "px-3 py-2 text-[10px]" : "px-3 py-2.5 text-xs"
      }`}
    >
      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1B3B2E]" />
      <div className="min-w-0 leading-relaxed">
        <span className="font-semibold text-[#1B3B2E]">HIPAA-aligned AI</span>
        {" · "}
        PHI {phiRedacted ? "redacted before cloud" : "may be sent to cloud"}
        {cloudEnabled !== undefined && ` · ${cloudEnabled ? "cloud active" : "on-device"}`}
        {vectorRag && " · pgvector RAG"}
        {!compact && (
          <p className="mt-1 text-[10px] text-[#8A8F8C]">
            BAA required for production. Gemini via Google Cloud BAA recommended. Audit log enabled.
          </p>
        )}
      </div>
    </div>
  );
}
