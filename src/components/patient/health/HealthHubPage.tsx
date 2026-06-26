import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Dumbbell,
  FileText,
  History,
  Lock,
  Pill,
  ScrollText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";
import { PatientProgressStrip } from "@/components/patient/PatientProgressStrip";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { reports as mockReports } from "@/lib/mock-data";
import {
  listPatientPrescriptions,
  PATIENT_RX_EVENT,
} from "@/lib/patient-prescription-store";
import { countSharedReports } from "@/lib/reports-utils";
import { fetchReportsForPatient } from "@/lib/supabase/queries";
import type { Report } from "@/lib/mock-data";

function HubLinkCard({
  to,
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  to: "/medications" | "/prescriptions" | "/reports" | "/reports/history" | "/exercise";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-[20px] border border-[#EDEAE6] bg-white p-4 transition-colors active:bg-[#F9F7F2] sm:rounded-[24px] sm:p-5"
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accent ?? "bg-[#F9F7F2]"}`}
      >
        <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
    </Link>
  );
}

export function HealthHubPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [rxCount, setRxCount] = useState(listPatientPrescriptions().length);
  const { meds } = usePatientMedications();

  useEffect(() => {
    fetchReportsForPatient().then((r) => {
      if (r.length) setReports(r);
    });
    const refresh = () => setRxCount(listPatientPrescriptions().length);
    window.addEventListener(PATIENT_RX_EVENT, refresh);
    return () => window.removeEventListener(PATIENT_RX_EVENT, refresh);
  }, []);

  const taken = meds.filter((m) => m.taken).length;
  const shared = countSharedReports(reports);

  return (
    <PatientHubLayout widthClass="max-w-3xl lg:max-w-5xl">
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          Clinical records
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-tight text-ink sm:text-[38px]">
          Health
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Medications, movement recovery, prescriptions, and your secure report archive.
        </p>
      </header>

      <PatientProgressStrip className="mb-5 sm:mb-6" />

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3 text-[13px] text-ink-muted sm:mb-6">
        <Lock className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
        <span>Encrypted at rest · Share on your terms · Revoke anytime</span>
      </div>

      <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        {[
          { label: "Meds today", value: `${taken}/${meds.length}` },
          { label: "Reports", value: String(reports.length).padStart(2, "0") },
          { label: "Shared", value: String(shared).padStart(2, "0") },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[18px] border border-[#EDEAE6] bg-white px-2 py-3.5 text-center"
          >
            <p className="font-serif text-xl tabular-nums text-ink sm:text-2xl">{value}</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-ink-muted sm:text-[10px]">
              {label}
            </p>
          </div>
        ))}
      </section>

      <ul className="flex flex-col gap-3">
        <li>
          <HubLinkCard
            to="/exercise"
            icon={Dumbbell}
            title="Move & recovery"
            subtitle="Med-synced video routines for mobility, cardio, and breathing"
            accent="bg-clay/15"
          />
        </li>
        <li>
          <HubLinkCard
            to="/medications"
            icon={Pill}
            title="Medications"
            subtitle={`${taken} of ${meds.length} taken today · adherence tracking`}
            accent="bg-clay/15"
          />
        </li>
        <li>
          <HubLinkCard
            to="/prescriptions"
            icon={ScrollText}
            title="Prescriptions"
            subtitle={`${rxCount} past prescription${rxCount === 1 ? "" : "s"} from your doctors`}
            accent="bg-[#F3F1EC]"
          />
        </li>
        <li>
          <HubLinkCard
            to="/reports"
            icon={FileText}
            title="Clinical archive"
            subtitle={`${reports.length} reports · ${shared} shared with specialists`}
            accent="bg-[#E8F3EE]"
          />
        </li>
        <li>
          <HubLinkCard
            to="/reports/history"
            icon={History}
            title="Archive history"
            subtitle="Uploads, shares, and access changes"
            accent="bg-[#F9F7F2]"
          />
        </li>
      </ul>
    </PatientHubLayout>
  );
}
