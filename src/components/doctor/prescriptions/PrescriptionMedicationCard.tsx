import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Copy, Info, Trash2 } from "lucide-react";
import { ChipGroup } from "./PrescriptionChipGroup";
import {
  DURATION_OPTIONS,
  FREQUENCIES,
  ROUTES,
  TIMING_OPTIONS,
  calcQuantity,
  syncLineQuantities,
  type PrescriptionLineDraft,
  type RxFrequency,
} from "@/lib/doctor-prescription-workflow";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  line: PrescriptionLineDraft;
  onChange: (line: PrescriptionLineDraft) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onShowMonograph: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

function IconBtn({
  onClick,
  label,
  disabled,
  children,
  className,
}: {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg transition-colors",
        disabled
          ? "cursor-not-allowed text-[#D0D0D0]"
          : "text-[#6B726E] hover:bg-[#F5F3F0] active:bg-[#EDEAE6]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrescriptionMedicationCard({
  index,
  line,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onShowMonograph,
  canMoveUp = false,
  canMoveDown = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const drug = DRUGS.find((d) => d.id === line.drug_id);
  if (!drug) return null;

  const qtyHint = `${line.frequency} × ${line.durationDays} days → ${calcQuantity(line.frequency, line.durationDays)} units`;

  const patch = (partial: Partial<PrescriptionLineDraft>) => {
    onChange(syncLineQuantities({ ...line, ...partial }));
  };

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.days === line.durationDays)?.label ?? `${line.durationDays} days`;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm transition-shadow",
        collapsed ? "border-[#E0DDD8]" : "",
      )}
    >
      <header className="flex items-start gap-3 border-b border-[#F0EDE9] px-3 py-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ADADAD]">
            Line {index + 1}
          </p>
          <h3 className="mt-0.5 break-words font-serif text-[17px] font-semibold leading-snug text-[#1B3B2E] sm:text-lg">
            {drug.generic_name}{" "}
            <span className="font-sans text-[15px] font-medium text-[#6B726E]">{drug.strength}</span>
          </h3>

          {collapsed ? (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs leading-relaxed text-[#5C635F]">{line.sig}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#F5F9F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1B3B2E]">
                  {drug.form}
                </span>
                <span className="rounded-full bg-[#F5F9F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1B3B2E]">
                  {line.route}
                </span>
                <span className="rounded-full bg-[#F5F9F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1B3B2E]">
                  {line.frequency}
                </span>
                <span className="rounded-full bg-[#F5F9F7] px-2.5 py-0.5 text-[10px] font-medium text-[#1B3B2E]">
                  {durationLabel}
                </span>
                <span className="rounded-full bg-[#F0DDD6]/60 px-2.5 py-0.5 text-[10px] font-medium text-[#8B5340]">
                  Qty {line.qty_prescribed}
                </span>
                {line.refills_allowed > 0 && (
                  <span className="rounded-full bg-[#F0DDD6]/60 px-2.5 py-0.5 text-[10px] font-medium text-[#8B5340]">
                    {line.refills_allowed} refill{line.refills_allowed > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-[#8A8F8C]">
              Form: <span className="font-medium text-[#1B3B2E]">{drug.form}</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconBtn onClick={onShowMonograph} label="Drug information" className="text-[#B8735D] hover:bg-[#FDF8F5]">
            <Info className="h-4 w-4" />
          </IconBtn>

          <div className="flex flex-col rounded-lg border border-[#EDEAE6] bg-[#FAF9F7]">
            <IconBtn onClick={onMoveUp} label="Move up" disabled={!canMoveUp} className="h-7 w-8 rounded-b-none">
              <ChevronUp className="h-3.5 w-3.5" />
            </IconBtn>
            <div className="mx-1 border-t border-[#EDEAE6]" />
            <IconBtn onClick={onMoveDown} label="Move down" disabled={!canMoveDown} className="h-7 w-8 rounded-t-none">
              <ChevronDown className="h-3.5 w-3.5" />
            </IconBtn>
          </div>

          <IconBtn
            onClick={() => setCollapsed((c) => !c)}
            label={collapsed ? "Expand medication" : "Collapse medication"}
            className="text-[#1B3B2E]"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
          </IconBtn>

          <div className="mx-0.5 hidden h-6 w-px bg-[#EDEAE6] sm:block" />

          <IconBtn onClick={onDuplicate} label="Duplicate">
            <Copy className="h-4 w-4" />
          </IconBtn>
          <IconBtn onClick={onRemove} label="Remove" className="text-[#C45C4A] hover:bg-[#FDF5F4]">
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>

      {!collapsed && (
        <div className="space-y-4 px-3 py-4 sm:px-4">
          <ChipGroup label="Route" options={ROUTES} value={line.route} onChange={(v) => patch({ route: v as string })} />
          <ChipGroup
            label="Frequency"
            options={FREQUENCIES.map((f) => ({ id: f.id, label: f.label }))}
            value={line.frequency}
            onChange={(v) => patch({ frequency: v as RxFrequency })}
          />
          <ChipGroup
            label="Timing"
            options={TIMING_OPTIONS}
            value={line.timing}
            onChange={(v) => patch({ timing: v as string[] })}
            multiple
          />
          <ChipGroup
            label="Duration"
            options={DURATION_OPTIONS.map((d) => ({ id: String(d.days), label: d.label }))}
            value={String(line.durationDays)}
            onChange={(v) => patch({ durationDays: Number(v) })}
          />

          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4">
            <label className="flex flex-col">
              <span className="text-xs font-medium text-[#5C635F]">Quantity to dispense</span>
              <input
                type="number"
                min={1}
                value={line.qty_prescribed}
                onChange={(e) => patch({ qty_prescribed: Number(e.target.value) })}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#E8E4DF] px-3 py-2 text-base tabular-nums sm:text-sm"
              />
            </label>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#5C635F]">Refills</span>
              <div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8E4DF] px-2">
                <button
                  type="button"
                  onClick={() => patch({ refills_allowed: Math.max(0, line.refills_allowed - 1) })}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FAF9F7] text-lg font-medium text-[#5C635F] hover:bg-[#F0EDE9]"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-semibold tabular-nums text-[#1B3B2E]">
                  {line.refills_allowed === 0 ? "No refills" : `${line.refills_allowed} refill(s)`}
                </span>
                <button
                  type="button"
                  onClick={() => patch({ refills_allowed: Math.min(12, line.refills_allowed + 1) })}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FAF9F7] text-lg font-medium text-[#5C635F] hover:bg-[#F0EDE9]"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#8A8F8C] min-[400px]:col-span-2">{qtyHint}</p>
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-2.5">
            <span className="text-xs text-[#5C635F]">
              <span className="font-semibold text-[#1B3B2E]">Allow generic substitution</span>
              <span className="mt-0.5 block text-[10px] text-[#8A8F8C]">Pharmacy may dispense a generic equivalent</span>
            </span>
            <input
              type="checkbox"
              checked={line.allowGeneric}
              onChange={(e) => patch({ allowGeneric: e.target.checked })}
              className="h-5 w-5 shrink-0 rounded border-[#EDEAE6] accent-[#1B3B2E]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#5C635F]">Drug notes</span>
            <input
              value={line.drugNotes}
              onChange={(e) => patch({ drugNotes: e.target.value })}
              placeholder="Take with water, avoid grapefruit…"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#E8E4DF] px-3 py-2 text-base sm:text-sm"
            />
          </label>

          <p className="rounded-xl bg-[#F5F9F7] px-3 py-2.5 text-xs leading-relaxed text-[#5C635F]">
            <span className="font-semibold text-[#1B3B2E]">Sig preview:</span> {line.sig}
          </p>
        </div>
      )}
    </article>
  );
}
