import { cn } from "@/lib/utils";

type ChipGroupProps<T extends string> = {
  label: string;
  options: readonly T[] | { id: T; label: string }[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  compact?: boolean;
};

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  compact = false,
}: ChipGroupProps<T>) {
  const normalized = options.map((o) => (typeof o === "string" ? { id: o, label: o } : o));

  const isSelected = (id: T) =>
    multiple ? (value as T[]).includes(id) : value === id;

  const toggle = (id: T) => {
    if (multiple) {
      const arr = value as T[];
      onChange(isSelected(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    } else {
      onChange(id);
    }
  };

  return (
    <div className="min-w-0">
      {label ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#ADADAD]">{label}</p>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap gap-1.5",
          compact && "max-h-24 overflow-y-auto pr-1",
        )}
      >
        {normalized.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              "min-h-[36px] shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isSelected(opt.id)
                ? multiple
                  ? "border-[#B8735D]/50 bg-[#F0DDD6] text-[#8B5340]"
                  : "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                : "border-[#EDEAE6] bg-[#FAF9F7] text-[#5C635F] hover:border-[#D8D4CF]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
