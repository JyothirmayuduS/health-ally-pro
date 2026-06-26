import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pill, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildAdherenceTriageForPanelPatient,
  type AdherenceRiskTier,
} from "@/lib/shared/adherence-triage";
import {
  CLINICAL_EVENT_LOG_EVENT,
  subscribeClinicalEvents,
} from "@/lib/shared/clinical-event-log";
import { PATIENT_MEDS_EVENT } from "@/lib/patient-meds-store";
import { EXERCISE_SESSION_EVENT } from "@/lib/exercise-session-store";

function tierRank(tier: AdherenceRiskTier): number {
  if (tier === "critical") return 0;
  if (tier === "warning") return 1;
  return 2;
}

function tierStyles(tier: AdherenceRiskTier) {
  if (tier === "critical") {
    return {
      row: "border-[#F5C4BC] bg-[#FCE8E6]",
      icon: "bg-[#C45C4A]/15 text-[#C45C4A]",
      spark: "#C45C4A",
    };
  }
  if (tier === "warning") {
    return {
      row: "border-[#F0DDD6] bg-[#FFF8F5]",
      icon: "bg-[#B8735D]/15 text-[#B8735D]",
      spark: "#B8735D",
    };
  }
  return {
    row: "border-[#E8EFE6] bg-[#F7FAF6]",
    icon: "bg-[#2C7873]/15 text-[#2C7873]",
    spark: "#2C7873",
  };
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  return (
    <svg viewBox="0 0 84 24" className="h-6 w-[84px]" aria-hidden>
      {values.map((v, i) => {
        const h = Math.max(2, (v / 100) * 20);
        return (
          <rect
            key={i}
            x={i * 12}
            y={24 - h}
            width={8}
            height={h}
            rx={2}
            fill={color}
            opacity={0.35 + (i / values.length) * 0.65}
          />
        );
      })}
    </svg>
  );
}

type Props = {
  patientId: string;
  compact?: boolean;
};

/** 5-second visual triage — reads aggregated clinical-event-log + live med state. */
export function DoctorAdherenceInbox({ patientId, compact }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    const unsubClinical = subscribeClinicalEvents(refresh);
    window.addEventListener(PATIENT_MEDS_EVENT, refresh);
    window.addEventListener(EXERCISE_SESSION_EVENT, refresh);
    window.addEventListener(CLINICAL_EVENT_LOG_EVENT, refresh);
    return () => {
      unsubClinical();
      window.removeEventListener(PATIENT_MEDS_EVENT, refresh);
      window.removeEventListener(EXERCISE_SESSION_EVENT, refresh);
      window.removeEventListener(CLINICAL_EVENT_LOG_EVENT, refresh);
    };
  }, []);

  const triage = useMemo(
    () => buildAdherenceTriageForPanelPatient(patientId),
    [patientId, tick],
  );

  const styles = tierStyles(triage.tier);

  return (
    <section className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1B3B2E]">Adherence inbox</h2>
        <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-[#8A8F8C] sm:inline">
          5s triage · clinical-event-log
        </span>
      </div>
      <ul className="space-y-2">
        <li
          className={cn(
            "flex flex-col gap-3 rounded-[18px] border px-3.5 py-3 sm:flex-row sm:items-start",
            styles.row,
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
              styles.icon,
            )}
          >
            {triage.tier === "stable" ? (
              <Dumbbell className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Pill className="h-4 w-4" strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#1B3B2E]">
              {triage.tier === "critical" ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#C45C4A]" />
              ) : null}
              {triage.label}
            </p>
            <p className="mt-0.5 text-xs text-[#5C635F]">{triage.detail}</p>
            {triage.events48h.length > 0 ? (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8A8F8C]">
                {triage.events48h.length} event{triage.events48h.length === 1 ? "" : "s"} in 48h
              </p>
            ) : null}
          </div>
          </div>
          <div className="flex justify-end sm:block">
            <Sparkline values={triage.sparkline} color={styles.spark} />
          </div>
        </li>
      </ul>
    </section>
  );
}

export { buildAdherenceTriageForPanelPatient, listPanelAdherenceAlerts } from "@/lib/shared/adherence-triage";
