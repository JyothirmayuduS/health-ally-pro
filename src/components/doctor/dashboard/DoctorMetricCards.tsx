import { Plus, Heart } from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[24px] bg-white p-5 shadow-[0_4px_24px_rgba(28,42,46,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function HeartRateWidget() {
  const points = "2,34 14,28 22,30 30,18 38,22 46,12 54,20 62,10 70,16 78,8";
  return (
    <Card className="flex min-h-[156px] flex-col">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#8A8F8C]">Heart Rate</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E8F0FE]">
          <Heart className="h-4 w-4 text-[#4F7BF7]" fill="#4F7BF7" strokeWidth={0} />
        </span>
      </div>
      <svg viewBox="0 0 80 36" className="mt-2 h-[52px] w-full flex-1" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#5B8DEF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-[1.65rem] font-bold leading-none text-[#1B3B2E]">102 BPM</p>
    </Card>
  );
}

export function BloodCellWidget() {
  const bars = [45, 72, 38, 88, 52, 76, 42, 95, 58, 68];
  return (
    <Card className="flex min-h-[156px] flex-col">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#8A8F8C]">Blood Cell</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F0DDD6]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#B8735D">
            <circle cx="10" cy="10" r="3" />
            <circle cx="5" cy="7" r="2" opacity="0.7" />
            <circle cx="15" cy="7" r="2" opacity="0.7" />
            <circle cx="6" cy="13" r="2" opacity="0.7" />
            <circle cx="14" cy="13" r="2" opacity="0.7" />
          </svg>
        </span>
      </div>
      <div className="mt-3 flex h-[52px] flex-1 items-end justify-between gap-[3px] px-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-[3px] bg-[#7EB8AE]"
            style={{ height: `${h}%`, opacity: 0.4 + (i % 4) * 0.12 }}
          />
        ))}
      </div>
      <p className="mt-2 text-[1.65rem] font-bold leading-none text-[#1B3B2E]">7,127 uL</p>
    </Card>
  );
}

export function WaterWidget() {
  return (
    <Card className="flex min-h-[156px] flex-col">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#8A8F8C]">Water</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF4D6]">
          <span className="h-4 w-4 rounded-full bg-[#F5C842]" />
        </span>
      </div>
      <div className="mt-5 h-3 flex-1 overflow-hidden rounded-full bg-[#E8ECED]">
        <div className="h-full w-[89%] rounded-full bg-[#B8735D]" />
      </div>
      <p className="mt-4 text-[#1B3B2E]">
        <span className="text-[1.65rem] font-bold">89%</span>{" "}
        <span className="text-sm font-medium text-[#8A8F8C]">1.78/2 Litres</span>
      </p>
    </Card>
  );
}

export function AddWidgetCard() {
  return (
    <button
      type="button"
      className="flex min-h-[156px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#B8CDD8] bg-[#E8F2F8] transition-colors hover:border-[#8A8F8C]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1B3B2E] text-white shadow-sm">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="mt-3 text-sm font-medium text-[#8A8F8C]">Add Widget</span>
    </button>
  );
}
