import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DoctorClinicStatusBar } from "@/components/doctor/DoctorClinicStatusBar";
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import { DoctorRxTemplatesPanel } from "@/components/doctor/prescriptions/DoctorRxTemplatesPanel";
import { DoctorSentRxDetail } from "@/components/doctor/prescriptions/DoctorSentRxDetail";
import { DoctorSentRxList } from "@/components/doctor/prescriptions/DoctorSentRxList";
import { getDoctorSentRx } from "@/lib/doctor-prescription-store";
import { cn } from "@/lib/utils";

export type PrescriptionView = "write" | "sent" | "templates";

type Props = {
  view?: PrescriptionView;
  initialPatientId?: string;
  rxId?: string;
  amendFrom?: string;
};

const TABS: { id: PrescriptionView; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "sent", label: "Sent Rx" },
  { id: "templates", label: "Templates" },
];

export function DoctorPrescriptionWorkspace({
  view = "write",
  initialPatientId,
  rxId,
  amendFrom,
}: Props) {
  const navigate = useNavigate();
  const [draftSnapshot, setDraftSnapshot] = useState<{
    diagnosis: string;
    diagnosisIcd?: string;
    lines: { drug_id: string; frequency: import("@/lib/doctor-prescription-workflow").RxFrequency; durationDays: number }[];
  } | null>(null);

  const goTab = useCallback(
    (tab: PrescriptionView) => {
      void navigate({
        to: "/doctor/prescriptions",
        search: {
          view: tab,
          patientId: initialPatientId,
          rxId: tab === "sent" ? rxId : undefined,
          amendFrom: tab === "write" ? amendFrom : undefined,
        },
      });
    },
    [amendFrom, initialPatientId, navigate, rxId],
  );

  useEffect(() => {
    if (amendFrom) {
      const source = getDoctorSentRx(amendFrom);
      if (source) {
        toast.message(`Amending ${amendFrom}`, {
          description: "Edit the draft and send a new prescription when ready.",
        });
      }
    }
  }, [amendFrom]);

  const handleApplyTemplate = useCallback(
    (template: {
      label: string;
      diagnosis: string;
      diagnosisIcd?: string;
      lines: { drug_id: string; frequency: import("@/lib/doctor-prescription-workflow").RxFrequency; durationDays: number }[];
    }) => {
      void navigate({
        to: "/doctor/prescriptions",
        search: {
          view: "write",
          patientId: initialPatientId,
          templateApply: template.label,
        },
      });
      window.dispatchEvent(
        new CustomEvent("medora-apply-rx-template", {
          detail: template,
        }),
      );
      toast.success(`Applied ${template.label}`);
    },
    [initialPatientId, navigate],
  );

  return (
    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-[#E5E1DC] bg-white pt-[env(safe-area-inset-top,0px)]">
        <nav
          className="flex px-4 sm:px-6 lg:px-8 xl:px-10"
          aria-label="Prescription views"
        >
          {TABS.map((tab) => {
            const active =
              view === tab.id && (tab.id !== "sent" || !rxId || tab.id === "sent");
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goTab(tab.id)}
                className={cn(
                  "-mb-px min-h-[48px] border-b-2 px-4 text-sm font-medium transition-colors sm:px-5",
                  active
                    ? "border-[#1B3B2E] text-[#1B3B2E]"
                    : "border-transparent text-[#8A8F8C] hover:text-[#1B3B2E]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
        <DoctorClinicStatusBar variant="toolbar" />
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-12">
        {view === "write" ? (
          <DoctorPrescriptions
            initialPatientId={initialPatientId}
            amendFromRxNumber={amendFrom}
            onDraftChange={setDraftSnapshot}
            onSent={(rxNumber) =>
              void navigate({
                to: "/doctor/prescriptions",
                search: { view: "sent", rxId: rxNumber },
              })
            }
          />
        ) : null}

        {view === "sent" && rxId ? <DoctorSentRxDetail rxId={rxId} /> : null}
        {view === "sent" && !rxId ? <DoctorSentRxList patientFilter={initialPatientId} /> : null}

        {view === "templates" ? (
          <>
            <DoctorRxTemplatesPanel onApplyTemplate={handleApplyTemplate} currentDraft={draftSnapshot ?? undefined} />
            {!draftSnapshot ? (
              <p className="mt-4 text-center text-xs text-[#8A8F8C]">
                Open the{" "}
                <Link
                  to="/doctor/prescriptions"
                  search={{ view: "write", patientId: initialPatientId }}
                  className="font-semibold text-[#2C7873] underline-offset-2 hover:underline"
                >
                  Write
                </Link>{" "}
                tab first to snapshot your current draft for saving.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
