import { DIET_LANGUAGE_LABELS, type DietLanguage } from "@/lib/diet-ai-types";
import { cn } from "@/lib/utils";

type Props = {
  value: DietLanguage;
  onChange: (lang: DietLanguage) => void;
  className?: string;
  compact?: boolean;
};

export function DietLanguagePicker({ value, onChange, className, compact }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(Object.keys(DIET_LANGUAGE_LABELS) as DietLanguage[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            "rounded-full border font-medium transition-colors",
            compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-[13px]",
            value === lang
              ? "border-ink bg-ink text-white"
              : "border-[#EDEAE6] bg-white text-ink-muted hover:border-clay/40",
          )}
        >
          {DIET_LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
