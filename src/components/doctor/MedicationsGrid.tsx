import { ArrowUpRight } from "lucide-react";
import { supplements } from "@/lib/doctor-mock-data";
import { SupplementBottle } from "./dashboard/SupplementBottle";

export function MedicationsGrid() {
  return (
    <div className="flex h-full min-h-[480px] flex-col rounded-[28px] bg-white p-6 shadow-[0_4px_20px_rgba(28,42,46,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3B2E]">Your Vitamin Supplements</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8A8F8C]">
            Don&apos;t forget to take your daily vitamin supplement today!
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F7F5F2] text-[#8A8F8C]">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
        {supplements.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-[20px] bg-[#F5F2ED]/60 p-3.5"
          >
            <span className="text-[11px] font-semibold text-[#CBD5E1]">{item.index}</span>
            <div className="flex flex-1 items-center justify-center py-2">
              <SupplementBottle variant={item.variant ?? "jar"} />
            </div>
            <p className="text-center text-xs font-semibold text-[#1B3B2E]">{item.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2">
        <span className="h-1.5 w-6 rounded-full bg-[#1B3B2E]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
      </div>
    </div>
  );
}
