import { useState } from "react";
import { ChevronDown, ShieldAlert, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PrescriptionAiAssistant } from "@/components/doctor/prescriptions/PrescriptionAiAssistant";
import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import type { AiMedicationSuggestion } from "@/lib/doctor-prescription-ai";
import { cn } from "@/lib/utils";

type Props = {
  patient: PanelPatient;
  draftDrugIds: string[];
  onApplySuggestion: (suggestion: AiMedicationSuggestion) => void;
  alertCount?: number;
};

/** Mobile CDSS drawer — clinical decision support parity with desktop */
export function PrescriptionMobileCdssDrawer({
  patient,
  draftDrugIds,
  onApplySuggestion,
  alertCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold",
          alertCount > 0
            ? "bg-[#FDF5F4] text-[#C45C4A]"
            : "bg-[#F5F2ED] text-[#1B3B2E]",
        )}
      >
        {alertCount > 0 ? (
          <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Sparkles className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
        )}
        Safety
        {alertCount > 0 && (
          <span className="rounded-full bg-[#C45C4A] px-1.5 text-[10px] font-bold text-white">{alertCount}</span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px] border-[#EDEAE6]">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 font-serif text-[#1B3B2E]">
              <Sparkles className="h-5 w-5 text-[#B8735D]" strokeWidth={1.75} />
              Clinical decision support
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-[env(safe-area-inset-bottom)]">
            <PrescriptionAiAssistant
              patient={patient}
              draftDrugIds={draftDrugIds}
              onApplySuggestion={(s) => {
                onApplySuggestion(s);
              }}
              onApplyAll={(suggestions) => suggestions.forEach(onApplySuggestion)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DoctorClinicOverviewCollapsible({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[44px] items-center justify-between rounded-2xl border border-[#E8E4DF] bg-white px-4 py-3 text-left shadow-sm"
      >
        <span className="text-sm font-semibold text-[#1B3B2E]">Clinic overview</span>
        <ChevronDown
          className={cn("h-4 w-4 text-[#8A8F8C] transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
        />
      </button>
      {open && <div className="mt-4 space-y-6">{children}</div>}
    </section>
  );
}
