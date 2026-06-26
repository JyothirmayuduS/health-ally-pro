import type { ReactNode } from "react";
import { AlertTriangle, Pill } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getDrugMonograph } from "@/lib/doctor-prescription-workflow";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";

type Props = {
  drugId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#B8735D]">{title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5C635F]">{children}</p>
    </section>
  );
}

export function DrugMonographSheet({ drugId, open, onOpenChange }: Props) {
  const drug = drugId ? DRUGS.find((d) => d.id === drugId) : undefined;
  const mono = drugId ? getDrugMonograph(drugId) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-[24px] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#EDEAE6]" />
        {drug && mono && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-xl font-semibold text-[#1B3B2E]">
                {drug.generic_name}
              </SheetTitle>
              <p className="text-sm font-medium text-[#B8735D]">{mono.drugClass}</p>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F9F7] px-3 py-1 text-xs font-medium text-[#1B3B2E]">
                <Pill className="h-3 w-3 text-[#8A8F8C]" />
                {drug.strength} · {drug.form}
              </span>
              <span className="rounded-full bg-[#F5F9F7] px-3 py-1 text-xs font-medium text-[#1B3B2E]">
                Route: {drug.route}
              </span>
              {drug.rx_required && (
                <span className="rounded-full bg-[#F0DDD6]/70 px-3 py-1 text-xs font-medium text-[#8B5340]">
                  Rx required
                </span>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <Section title="Why it is used">{mono.whyUsed}</Section>
              <Section title="Who should receive it">{mono.whoShouldReceive}</Section>
              <Section title="How to take">{mono.howToTake}</Section>

              {mono.warnings && (
                <section className="rounded-xl border border-[#F0DDD6] bg-[#FDF8F5] px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B8735D]" />
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#B8735D]">
                        Warnings
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#5C635F]">{mono.warnings}</p>
                    </div>
                  </div>
                </section>
              )}

              {mono.commonSideEffects && (
                <Section title="Common side effects">{mono.commonSideEffects}</Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
