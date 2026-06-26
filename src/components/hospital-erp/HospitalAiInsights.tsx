import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { medoraHospitalInsights, medoraSyncVectorIndex } from "@/lib/ai/medora-ai";
import { DeskPanel } from "@/components/desk-shell/ui";

export function HospitalAiInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await medoraSyncVectorIndex();
        const result = await medoraHospitalInsights();
        if (!cancelled) {
          setInsights(result.answer);
          setSource(result.modelSource);
        }
      } catch {
        if (!cancelled) setInsights(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DeskPanel title="Medora AI briefing">
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal" />
          Synthesizing hospital priorities…
        </div>
      ) : insights ? (
        <div className="px-4 pb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{insights}</div>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-400">
            <Sparkles className="h-3 w-3" />
            {source}
          </p>
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-ink-400">AI briefing unavailable offline.</p>
      )}
    </DeskPanel>
  );
}
