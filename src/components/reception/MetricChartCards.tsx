import { Plus, Heart, Droplets, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Blue line chart — matches reference Heart Rate widget */
export function QueueFlowCard({ bpm = 102 }: { bpm?: number }) {
  const points =
    "4,28 12,22 20,26 28,14 36,18 44,10 52,16 60,8 68,12 76,6";
  return (
    <CardShell className="min-h-[130px]">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E8F0FE]">
          <Heart className="h-4 w-4 text-[#5B8DEF]" fill="#5B8DEF" strokeWidth={0} />
        </div>
        <p className="text-[11px] font-medium text-[#94A3B8]">Check-ins / hr</p>
      </div>
      <svg viewBox="0 0 80 32" className="mt-2 h-10 w-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#5B8DEF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-xl font-bold text-[#1e293b]">
        {bpm} <span className="text-sm font-medium text-[#94A3B8]">today</span>
      </p>
    </CardShell>
  );
}

/** Teal bar chart — matches reference Blood Cell widget */
export function WaitingPatientsCard({ count = 7127 }: { count?: number }) {
  const bars = [40, 65, 35, 80, 50, 70, 45, 90, 55];
  return (
    <CardShell className="min-h-[130px]">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E6F4F1]">
          <Activity className="h-4 w-4 text-[#5BA89A]" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-medium text-[#94A3B8]">In queue</p>
      </div>
      <div className="mt-3 flex h-10 items-end justify-between gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-[#8BB8B0]"
            style={{ height: `${h}%`, opacity: 0.35 + (i % 3) * 0.2 }}
          />
        ))}
      </div>
      <p className="mt-2 text-xl font-bold text-[#1e293b]">
        {count} <span className="text-sm font-medium text-[#94A3B8]">waiting</span>
      </p>
    </CardShell>
  );
}

/** Lime progress — matches reference Water widget */
export function CapacityCard({ percent = 89, current = 6, total = 8 }: { percent?: number; current?: number; total?: number }) {
  return (
    <CardShell className="min-h-[130px]">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#EEF6D4]">
          <Droplets className="h-4 w-4 text-[#6B8E23]" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-medium text-[#94A3B8]">Slots filled</p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E0E7EB]">
        <div
          className="h-full rounded-full bg-[#D4F06D] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-bold text-[#1e293b]">
        {percent}%{" "}
        <span className="font-medium text-[#94A3B8]">
          {current}/{total} doctors busy
        </span>
      </p>
    </CardShell>
  );
}

/** Dashed add widget — matches reference */
export function AddWidgetCard() {
  return (
    <button
      type="button"
      className="flex min-h-[130px] w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#C5D4DC] bg-[#EEF2F4]/60 transition-colors hover:border-[#D4F06D] hover:bg-[#EEF6D4]/30"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1e293b] text-white">
        <Plus className="h-5 w-5" strokeWidth={2} />
      </span>
    </button>
  );
}
