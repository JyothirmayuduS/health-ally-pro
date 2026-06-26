import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartPulse,
  Phone,
  Pill,
  Shield,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { DependentRecordSheet } from "@/components/patient/profile/DependentRecordSheet";
import {
  DependentPersonaAvatar,
  dependentAccent,
} from "@/components/patient/profile/DependentPersonaAvatar";
import { ProfileCard, ProfileSectionTitle } from "@/components/patient/profile/profile-ui";
import { useDependents } from "@/hooks/useDependents";
import { markMedicationTaken } from "@/lib/dependents-store";
import type { Dependent } from "@/lib/patient-profile-data";
import { relationTag } from "@/lib/patient-profile-data";
import { cn } from "@/lib/utils";

type RecordDetail = {
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
};

function appointmentStatusLabel(status: "upcoming" | "completed") {
  return status === "upcoming" ? "Upcoming" : "Completed";
}

function ClickableRow({
  title,
  subtitle,
  badge,
  onClick,
  to,
  params,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onClick?: () => void;
  to?: "/reports/$reportId";
  params?: { reportId: string };
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold leading-snug text-ink sm:text-base">{title}</p>
          {badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                badge === "Upcoming"
                  ? "bg-[#E8F3EE] text-[#2D6B4F]"
                  : "bg-[#F3F1EC] text-ink-muted",
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted sm:text-sm">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
    </>
  );

  const rowClass =
    "flex w-full items-center gap-3 border-t border-[#EDEAE6] px-4 py-3.5 text-left transition-colors first:border-t-0 active:bg-[#F9F7F2]/80 hover:bg-[#F9F7F2]/60 sm:px-5 sm:py-4";

  if (to && params) {
    return (
      <Link to={to} params={params} className={rowClass}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {inner}
      </button>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}

function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: "/book" | "/medications" | "/reports";
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-3 py-4 text-center transition-colors hover:border-[#E0DBD4] hover:bg-[#F9F7F2]/50"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3F1EC]">
        <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
      </span>
      <span className="text-xs font-semibold text-ink">{label}</span>
    </Link>
  );
}

export function DependentDetailPage({ dependentId }: { dependentId: string }) {
  const dependents = useDependents();
  const dependent = dependents.find((d) => d.id === dependentId);
  const [record, setRecord] = useState<RecordDetail | null>(null);

  if (!dependent) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Dependent not found.</p>
        <Link to="/profile/dependents/" className="mt-4 inline-block text-clay">
          Back to family profiles
        </Link>
      </div>
    );
  }

  return (
    <DependentDetailContent
      dependent={dependent}
      record={record}
      setRecord={setRecord}
    />
  );
}

function DependentDetailContent({
  dependent,
  record,
  setRecord,
}: {
  dependent: Dependent;
  record: RecordDetail | null;
  setRecord: (r: RecordDetail | null) => void;
}) {
  const { stroke } = dependentAccent(dependent);

  function toggleMed(medId: string, taken: boolean) {
    markMedicationTaken(dependent.id, medId, taken);
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-12">
      <header className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
        <Link
          to="/profile/dependents/"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-ink sm:h-6 sm:w-6" strokeWidth={2.25} />
        </Link>
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <h1 className="truncate font-serif text-2xl text-ink sm:text-[28px]">
            {dependent.name}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {relationTag(dependent)} · {dependent.bloodGroup}
          </p>
        </div>
        <span className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" aria-hidden />
      </header>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-8">
          <ProfileCard className="mb-5 p-4 sm:mb-6 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
              <DependentPersonaAvatar dep={dependent} size="lg" showAdherence />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-sm leading-relaxed text-ink">{dependent.carePlan}</p>
                <p className="mt-2 text-sm text-ink-muted">
                  {dependent.primaryDoctor} · {dependent.primarySpecialty}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Adherence", value: `${dependent.adherence}%`, color: stroke },
                    {
                      label: "Meds today",
                      value: dependent.medsTotalToday
                        ? `${dependent.medsTakenToday}/${dependent.medsTotalToday}`
                        : "—",
                    },
                    {
                      label: "Last visit",
                      value: dependent.lastVisit.split(",")[0] ?? dependent.lastVisit,
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-[#F9F7F2] px-2 py-2.5 sm:px-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                        {label}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-semibold text-ink"
                        style={color ? { color } : undefined}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ProfileCard>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
            <QuickAction icon={CalendarClock} label="Book visit" to="/book" />
            <QuickAction icon={Pill} label="Medications" to="/medications" />
            <QuickAction icon={FileText} label="Reports" to="/reports" />
          </div>

          {dependent.medicationsTodayList.length > 0 ? (
            <section className="mb-5 sm:mb-6">
              <ProfileSectionTitle>Today&apos;s medications</ProfileSectionTitle>
              <ProfileCard>
                {dependent.medicationsTodayList.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 border-t border-[#EDEAE6] px-4 py-3.5 first:border-t-0 sm:px-5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMed(m.id, !m.taken)}
                      aria-label={m.taken ? `Mark ${m.name} as not taken` : `Mark ${m.name} as taken`}
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        m.taken
                          ? "border-[#2D6B4F] bg-[#2D6B4F] text-white"
                          : "border-[#D8D4CE] bg-white text-transparent hover:border-[#A67C66]",
                      )}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.name}</p>
                      <p className="text-xs text-ink-muted">{m.detail}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-bold uppercase tracking-wide",
                        m.taken ? "text-[#2D6B4F]" : "text-[#A67C66]",
                      )}
                    >
                      {m.taken ? "Taken" : "Due"}
                    </span>
                  </div>
                ))}
              </ProfileCard>
            </section>
          ) : null}

          <section className="mb-5 sm:mb-6">
            <ProfileSectionTitle>Appointments</ProfileSectionTitle>
            <ProfileCard>
              {dependent.appointments.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-muted sm:px-5">
                  No appointments scheduled. Book a visit from the quick actions above.
                </p>
              ) : (
                dependent.appointments.map((a) => (
                  <ClickableRow
                    key={a.id}
                    title={a.title}
                    subtitle={`${a.date} · ${a.time}`}
                    badge={appointmentStatusLabel(a.status)}
                    onClick={() =>
                      setRecord({
                        title: a.title,
                        subtitle: `${a.date} · ${a.time}`,
                        rows: [
                          { label: "Status", value: appointmentStatusLabel(a.status) },
                          { label: "Date", value: a.date },
                          { label: "Time", value: a.time },
                          { label: "Location", value: "Medora Clinic · Outpatient" },
                          {
                            label: "Reason",
                            value:
                              a.status === "upcoming"
                                ? "Scheduled follow-up visit"
                                : "Routine check-up completed",
                          },
                          { label: "Proxy access", value: "Full summary · Guardian account" },
                        ],
                      })
                    }
                  />
                ))
              )}
            </ProfileCard>
          </section>

          <section className="mb-5 sm:mb-6">
            <ProfileSectionTitle>Active medications</ProfileSectionTitle>
            <ProfileCard>
              {dependent.medications.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-muted sm:px-5">
                  No medications on file yet.
                </p>
              ) : (
                dependent.medications.map((m) => (
                  <ClickableRow
                    key={m.id}
                    title={m.name}
                    subtitle={m.detail}
                    onClick={() =>
                      setRecord({
                        title: m.name,
                        subtitle: m.detail,
                        rows: [
                          { label: "Dosage", value: m.detail.split(" · ")[0] ?? m.detail },
                          { label: "Schedule", value: m.detail.split(" · ")[1] ?? "Daily" },
                          { label: "Prescribed by", value: dependent.primaryDoctor },
                          { label: "Specialty", value: dependent.primarySpecialty },
                          {
                            label: "Instructions",
                            value: "Take as directed. Contact care team if symptoms worsen.",
                          },
                        ],
                      })
                    }
                  />
                ))
              )}
            </ProfileCard>
          </section>

          <section className="mb-5 sm:mb-6">
            <ProfileSectionTitle>Reports</ProfileSectionTitle>
            <ProfileCard>
              {dependent.reports.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-muted sm:px-5">No reports uploaded.</p>
              ) : (
                dependent.reports.map((r) => (
                  <ClickableRow
                    key={r.id}
                    title={r.title}
                    subtitle={`${r.type} · ${r.date}`}
                    to="/reports/$reportId"
                    params={{ reportId: r.id }}
                  />
                ))
              )}
            </ProfileCard>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <section className="mb-5 sm:mb-6">
            <ProfileSectionTitle>Care overview</ProfileSectionTitle>
            <ProfileCard>
              {[
                { icon: Activity, label: "Care plan", value: dependent.carePlan },
                {
                  icon: Stethoscope,
                  label: "Primary doctor",
                  value: `${dependent.primaryDoctor} · ${dependent.primarySpecialty}`,
                },
                { icon: CalendarClock, label: "Next visit", value: dependent.nextConsultation },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex gap-3 border-t border-[#EDEAE6] px-4 py-4 first:border-t-0 sm:px-5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
                    <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
                  </div>
                </div>
              ))}
            </ProfileCard>
          </section>

          {dependent.conditions.length > 0 ? (
            <section className="mb-5 sm:mb-6">
              <ProfileSectionTitle>Conditions</ProfileSectionTitle>
              <ProfileCard>
                {dependent.conditions.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-3 border-t border-[#EDEAE6] px-4 py-3.5 first:border-t-0 sm:px-5"
                  >
                    <HeartPulse className="h-4 w-4 shrink-0 text-[#5B8DB8]" strokeWidth={1.75} />
                    <span className="text-sm text-ink">{c}</span>
                  </div>
                ))}
              </ProfileCard>
            </section>
          ) : null}

          {dependent.allergies.length > 0 ? (
            <section className="mb-5 sm:mb-6">
              <ProfileSectionTitle>Allergies</ProfileSectionTitle>
              <ProfileCard>
                {dependent.allergies.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-3 border-t border-[#EDEAE6] px-4 py-3.5 first:border-t-0 sm:px-5"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#C44B3F]" strokeWidth={1.75} />
                    <span className="text-sm text-ink">{a}</span>
                  </div>
                ))}
              </ProfileCard>
            </section>
          ) : null}

          {dependent.vitals.length > 0 ? (
            <section className="mb-5 sm:mb-6">
              <ProfileSectionTitle>Recent vitals</ProfileSectionTitle>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {dependent.vitals.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() =>
                      setRecord({
                        title: v.label,
                        subtitle: v.at,
                        rows: [
                          { label: "Reading", value: v.value },
                          { label: "Recorded", value: v.at },
                          { label: "Source", value: "Home monitoring device" },
                          { label: "Shared with", value: dependent.primaryDoctor },
                        ],
                      })
                    }
                    className="rounded-[18px] border border-[#EDEAE6] bg-[#F3F1EC] px-3 py-3.5 text-left transition-colors hover:border-clay/25 sm:rounded-[20px] sm:px-4 sm:py-4"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                      {v.label}
                    </p>
                    <p className="mt-1 font-serif text-xl text-ink sm:text-2xl">{v.value}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">{v.at}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mb-5 sm:mb-6">
            <ProfileSectionTitle>Contact & coverage</ProfileSectionTitle>
            <ProfileCard>
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <Phone className="h-4 w-4 text-[#2D6B4F]" strokeWidth={1.75} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                    Emergency
                  </p>
                  <p className="mt-0.5 text-sm text-ink">{dependent.emergencyContact}</p>
                </div>
              </div>
              <div className="border-t border-[#EDEAE6] px-4 py-4 sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                  Insurance
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink">{dependent.insurance}</p>
              </div>
              {dependent.careNotes ? (
                <div className="border-t border-[#EDEAE6] px-4 py-4 sm:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                    Care notes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {dependent.careNotes}
                  </p>
                </div>
              ) : null}
            </ProfileCard>
          </section>

          <div className="flex gap-2.5 rounded-2xl bg-[#E8F3EE] px-4 py-3.5 text-sm text-[#2D6B4F]">
            <Shield className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <p>
              Proxy access lets you manage appointments and medication logs. Full clinical notes
              require provider release.
            </p>
          </div>
        </aside>
      </div>

      <DependentRecordSheet
        open={record !== null}
        title={record?.title ?? ""}
        subtitle={record?.subtitle}
        rows={record?.rows ?? []}
        onClose={() => setRecord(null)}
      />
    </div>
  );
}
