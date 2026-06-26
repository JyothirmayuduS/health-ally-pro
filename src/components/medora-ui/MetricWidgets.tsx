import { Plus, Heart } from "lucide-react";

function WidgetShell({
  label,
  icon,
  children,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[168px] flex-col rounded-[28px] bg-white p-5 shadow-[0_8px_28px_rgba(28,42,46,0.06)] transition-shadow hover:shadow-[0_12px_36px_rgba(28,42,46,0.08)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          {label}
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-full">{icon}</span>
      </div>
      <div className="my-3 flex flex-1 items-center">{children}</div>
      <div className="text-2xl font-bold tracking-tight text-[#1C2A2E]">{value}</div>
    </article>
  );
}

export function HeartRateWidget() {
  const d = "M4,28 C12,22 18,26 24,18 C30,10 36,14 42,8 C48,2 54,6 60,4 C66,2 72,8 76,6";
  return (
    <WidgetShell
      label="Heart Rate"
      icon={
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F0FE]">
          <Heart className="h-4 w-4 text-[#4F7BF7]" fill="#4F7BF7" strokeWidth={0} />
        </span>
      }
      value="102 BPM"
    >
      <svg viewBox="0 0 80 32" className="h-14 w-full" preserveAspectRatio="none">
        <path
          d={d}
          fill="none"
          stroke="#5B8DEF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </WidgetShell>
  );
}

export function BloodCellWidget() {
  const bars = [38, 62, 44, 78, 52, 70, 48, 82, 56, 66];
  return (
    <WidgetShell
      label="Blood Cell"
      icon={
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E6F4F1]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#5BA89A">
            <circle cx="10" cy="10" r="3" />
            <circle cx="5" cy="7" r="2" opacity="0.65" />
            <circle cx="15" cy="7" r="2" opacity="0.65" />
            <circle cx="6" cy="13" r="2" opacity="0.65" />
            <circle cx="14" cy="13" r="2" opacity="0.65" />
          </svg>
        </span>
      }
      value="7,127 uL"
    >
      <div className="flex h-14 w-full items-end justify-between gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-[#7EB8AE]"
            style={{ height: `${h}%`, opacity: 0.35 + (i % 3) * 0.15 }}
          />
        ))}
      </div>
    </WidgetShell>
  );
}

export function WaterWidget() {
  return (
    <WidgetShell
      label="Water"
      icon={
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF4D6]">
          <span className="block h-4 w-4 rounded-full bg-[#F5C842] ring-2 ring-[#FFF4D6]" />
        </span>
      }
      value={
        <>
          89%{" "}
          <span className="text-base font-medium text-[#94A3B8]">1.78/2 Litres</span>
        </>
      }
    >
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#E8ECED]">
        <div
          className="h-full rounded-full bg-[#D4F064]"
          style={{ width: "89%" }}
        />
      </div>
    </WidgetShell>
  );
}

export function AddWidgetCard() {
  return (
    <button
      type="button"
      className="group flex min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-[#C5D8E3] bg-[#E8F2F8]/90 transition-all hover:border-[#94A3B8] hover:bg-[#E8F2F8]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1C2A2E] text-white shadow-[0_4px_12px_rgba(28,42,46,0.2)] transition-transform group-hover:scale-105">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-sm font-semibold text-[#64748B]">Add Widget</span>
    </button>
  );
}
