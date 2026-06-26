import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookmarkPlus, Trash2 } from "lucide-react";
import {
  createLineFromDrug,
  RX_TEMPLATES,
  type RxFrequency,
} from "@/lib/doctor-prescription-workflow";
import {
  deleteDoctorTemplate,
  DOCTOR_RX_STORE_EVENT,
  listDoctorTemplates,
  saveDoctorTemplate,
  type DoctorRxTemplate,
} from "@/lib/doctor-prescription-store";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import { cn } from "@/lib/utils";

type Props = {
  onApplyTemplate: (template: {
    diagnosis: string;
    diagnosisIcd?: string;
    lines: { drug_id: string; frequency: RxFrequency; durationDays: number }[];
    label: string;
  }) => void;
  currentDraft?: {
    diagnosis: string;
    diagnosisIcd?: string;
    lines: { drug_id: string; frequency: RxFrequency; durationDays: number }[];
  };
};

function drugLabel(drugId: string): string {
  const drug = DRUGS.find((d) => d.id === drugId);
  return drug ? `${drug.generic_name} ${drug.strength}` : drugId;
}

export function DoctorRxTemplatesPanel({ onApplyTemplate, currentDraft }: Props) {
  const [custom, setCustom] = useState<DoctorRxTemplate[]>(() => listDoctorTemplates());
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    const refresh = () => setCustom(listDoctorTemplates());
    window.addEventListener(DOCTOR_RX_STORE_EVENT, refresh);
    return () => window.removeEventListener(DOCTOR_RX_STORE_EVENT, refresh);
  }, []);

  const saveCurrentAsTemplate = () => {
    if (!currentDraft?.lines.length) {
      toast.error("Add medications on the Write tab first");
      return;
    }
    const label = newLabel.trim() || currentDraft.diagnosis.trim() || "My template";
    saveDoctorTemplate({
      label,
      diagnosis: currentDraft.diagnosis || "Clinical template",
      diagnosisIcd: currentDraft.diagnosisIcd,
      lines: currentDraft.lines,
    });
    setNewLabel("");
    toast.success(`Saved “${label}”`);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl lg:max-w-4xl">
      <header className="mb-4">
        <h1 className="font-serif text-xl font-semibold text-[#1B3B2E] sm:text-2xl">Rx templates</h1>
        <p className="mt-1 text-sm text-[#8A8F8C]">Built-in packs plus your saved combinations (local only).</p>
      </header>

      {currentDraft ? (
        <section className="mb-5 rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#1B3B2E]">Save current draft as template</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Template name"
              className="min-h-[44px] flex-1 rounded-xl border border-[#EDEAE6] px-3 text-sm"
            />
            <button
              type="button"
              onClick={saveCurrentAsTemplate}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#1B3B2E] px-5 text-sm font-semibold text-white"
            >
              <BookmarkPlus className="h-4 w-4" />
              Save template
            </button>
          </div>
        </section>
      ) : null}

      <section className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">Built-in</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {RX_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                onApplyTemplate({
                  label: t.label,
                  diagnosis: t.diagnosis,
                  lines: t.lines.map((l) => ({ ...l })),
                })
              }
              className="rounded-2xl border border-[#EDEAE6] bg-white p-4 text-left shadow-sm hover:border-[#2C7873]/30"
            >
              <p className="font-semibold text-[#1B3B2E]">{t.label}</p>
              <p className="mt-1 text-xs text-[#8A8F8C]">{t.diagnosis}</p>
              <p className="mt-2 text-xs text-[#5C635F]">
                {t.lines.map((l) => drugLabel(l.drug_id)).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8F8C]">Your templates</p>
        {custom.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#EDEAE6] bg-white px-4 py-8 text-center text-sm text-[#8A8F8C]">
            No custom templates yet. Save from the Write tab or after sending a prescription.
          </p>
        ) : (
          <ul className="space-y-2">
            {custom.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    onApplyTemplate({
                      label: t.label,
                      diagnosis: t.diagnosis,
                      diagnosisIcd: t.diagnosisIcd,
                      lines: t.lines,
                    })
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="font-semibold text-[#1B3B2E]">{t.label}</p>
                  <p className="mt-1 text-xs text-[#8A8F8C]">{t.diagnosis}</p>
                  <p className="mt-2 text-xs text-[#5C635F]">
                    {t.lines.map((l) => drugLabel(l.drug_id)).join(" · ")}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteDoctorTemplate(t.id);
                    toast.success("Template removed");
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8A8F8C] hover:bg-[#FDF5F4] hover:text-[#8B3A32]"
                  aria-label={`Delete ${t.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function applyTemplateToDraftLines(
  lines: { drug_id: string; frequency: RxFrequency; durationDays: number }[],
) {
  return lines.map((l) => createLineFromDrug(l.drug_id, { frequency: l.frequency, durationDays: l.durationDays }));
}
