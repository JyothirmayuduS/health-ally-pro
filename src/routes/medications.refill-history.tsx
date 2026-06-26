import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PatientMedShell } from "@/components/patient/medications/PatientMedShell";

export const Route = createFileRoute("/medications/refill-history")({
  component: RefillHistoryPage,
});

const PENDING = [
  { id: "1", name: "Levothyroxine", at: "Submitted Jun 25, 2026 · 2:37 AM" },
  { id: "2", name: "Levothyroxine", at: "Submitted May 28, 2026 · 9:56 PM" },
  { id: "3", name: "Levothyroxine", at: "Submitted May 28, 2026 · 9:55 PM" },
];

function RefillHistoryPage() {
  return (
    <PatientMedShell>
      <header className="flex items-start gap-2 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-0">
        <Link to="/medications" className="grid h-11 w-11 place-items-center rounded-full">
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </Link>
        <div>
          <h1 className="font-serif text-[28px] text-ink">Refill history</h1>
          <p className="text-sm text-ink-muted">Requests submitted from this device</p>
        </div>
      </header>

      <div className="mt-6 px-5 lg:max-w-xl lg:px-0">
        <h2 className="font-serif text-xl text-ink">Pending</h2>
        <div className="mt-3 flex flex-col gap-3">
          {PENDING.map((r) => (
            <div
              key={r.id}
              className="rounded-[20px] border border-[#EDEAE6] bg-white p-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[17px] font-semibold">{r.name}</p>
                <span className="rounded-lg bg-[#FFF4DC] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#B8860B]">
                  PENDING
                </span>
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{r.at}</p>
              <button
                type="button"
                className="mt-3.5 rounded-[10px] border border-[#D35E50] px-3.5 py-2 text-[13px] font-semibold text-[#D35E50]"
              >
                Cancel request
              </button>
            </div>
          ))}
        </div>
      </div>
    </PatientMedShell>
  );
}
