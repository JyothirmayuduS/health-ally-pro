import { useState } from "react";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { medoraClinicalChat } from "@/lib/ai/medora-ai";
import { cn } from "@/lib/utils";

type Props = {
  context?: "prescribing" | "general" | "billing" | "lab";
  placeholder?: string;
  className?: string;
  compact?: boolean;
};

export function MedoraAiChatBar({
  context = "general",
  placeholder = "Ask Medora AI — e.g. pending lab orders, revenue today…",
  className,
  compact = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const result = await medoraClinicalChat({ data: { query: q, context } });
      setAnswer(result.answer);
      setSource(result.modelSource);
    } catch {
      setAnswer("Could not reach Medora AI. Check server API keys.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white", className)}>
      <div className={cn("flex gap-2", compact ? "p-2" : "p-3")}>
        <MessageSquare className="mt-2.5 h-4 w-4 shrink-0 text-teal" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-ink-400",
            compact ? "py-1.5" : "py-2",
          )}
        />
        <button
          type="button"
          disabled={loading || !query.trim()}
          onClick={() => void ask()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Ask
        </button>
      </div>
      {answer && (
        <div className="border-t border-ink-100 bg-bone/50 px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{answer}</p>
          <p className="mt-2 text-[10px] text-ink-400">{source} · AI-assisted — verify before clinical use</p>
        </div>
      )}
    </div>
  );
}
