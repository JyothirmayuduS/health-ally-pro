import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { listEncounters } from "@/lib/shared/encounters";
import { loadPatientReminders } from "@/lib/hospital-masters";
import { listDoctorSentRx } from "@/lib/doctor-prescription-store";
import { loadReceptionAdmissions } from "@/lib/reception-desk/store";
import { getSharedPatient } from "@/lib/shared/patients";
import { DeskPanel, DeskTable, DeskThead, DeskTh, DeskTd, DeskTr } from "@/components/desk-shell/ui";

export const Route = createFileRoute("/admin/registers")({
  component: StatutoryRegistersPage,
});

const REGISTER_TABS = [
  { id: "opd", label: "OPD register" },
  { id: "indoor", label: "Indoor patients" },
  { id: "vaccine", label: "Vaccine due" },
  { id: "rx", label: "Prescriptions" },
  { id: "next", label: "Next visit / reminders" },
] as const;

function StatutoryRegistersPage() {
  const admissions = loadReceptionAdmissions();
  const encounters = listEncounters();
  const reminders = loadPatientReminders();
  const rx = listDoctorSentRx();
  const [tab, setTab] = useState<(typeof REGISTER_TABS)[number]["id"]>("opd");

  const opdRows = useMemo(
    () =>
      encounters
        .filter((e) => e.status === "open" || e.date >= new Date().toISOString().slice(0, 10))
        .slice(0, 50),
    [encounters],
  );

  return (
    <div className="space-y-4" data-testid="admin-registers">
      <p className="text-[13px] text-ink-600">
        Statutory & operational registers (AXON Reports menu). Data from live desk stores — export via browser print.
      </p>
      <div className="flex flex-wrap gap-2">
        {REGISTER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium ${tab === t.id ? "bg-plum text-white" : "bg-ink-100 text-ink-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "opd" && (
        <DeskPanel title="OPD register">
          <DeskTable>
            <DeskThead>
            <DeskTh>Date</DeskTh>
                <DeskTh>Patient</DeskTh>
                <DeskTh>MRN</DeskTh>
                <DeskTh>Complaint</DeskTh>
                <DeskTh>Status</DeskTh>
              </DeskThead>
            <tbody>
              {opdRows.map((e) => (
                <DeskTr key={e.id}>
                  <DeskTd>{e.date}</DeskTd>
                  <DeskTd>{e.patientName}</DeskTd>
                  <DeskTd className="font-mono">{e.mrn}</DeskTd>
                  <DeskTd>{e.chiefComplaint ?? "—"}</DeskTd>
                  <DeskTd>{e.status}</DeskTd>
                </DeskTr>
              ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      )}

      {tab === "indoor" && (
        <DeskPanel title="Indoor patients register">
          <DeskTable>
            <DeskThead>
            <DeskTh>Patient</DeskTh>
                <DeskTh>Bed</DeskTh>
                <DeskTh>Ward</DeskTh>
                <DeskTh>Status</DeskTh>
              </DeskThead>
            <tbody>
              {admissions
                .filter((a) => a.status !== "discharged")
                .map((a) => (
                  <DeskTr key={a.id}>
                    <DeskTd>{getSharedPatient(a.patientId)?.name ?? a.patientId}</DeskTd>
                    <DeskTd>{a.bedId}</DeskTd>
                    <DeskTd>{a.tariffPlan}</DeskTd>
                    <DeskTd>{a.status}</DeskTd>
                  </DeskTr>
                ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      )}

      {tab === "vaccine" && (
        <DeskPanel title="Vaccine reminders register">
          <DeskTable>
            <DeskThead>
            <DeskTh>Patient</DeskTh>
                <DeskTh>MRN</DeskTh>
                <DeskTh>Due</DeskTh>
                <DeskTh>Note</DeskTh>
              </DeskThead>
            <tbody>
              {reminders
                .filter((r) => r.type === "vaccine" && !r.done)
                .map((r) => (
                  <DeskTr key={r.id}>
                    <DeskTd>{r.patientName}</DeskTd>
                    <DeskTd className="font-mono">{r.mrn}</DeskTd>
                    <DeskTd>{r.dueDate}</DeskTd>
                    <DeskTd>{r.note}</DeskTd>
                  </DeskTr>
                ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      )}

      {tab === "rx" && (
        <DeskPanel title="Prescriptions register">
          <DeskTable>
            <DeskThead>
            <DeskTh>Rx #</DeskTh>
                <DeskTh>Patient</DeskTh>
                <DeskTh>Sent</DeskTh>
                <DeskTh>Status</DeskTh>
              </DeskThead>
            <tbody>
              {rx.slice(0, 40).map((r) => (
                <DeskTr key={r.id}>
                  <DeskTd className="font-mono">{r.rx_number}</DeskTd>
                  <DeskTd>{r.patientName}</DeskTd>
                  <DeskTd>{new Date(r.sent_at).toLocaleDateString()}</DeskTd>
                  <DeskTd>{r.status}</DeskTd>
                </DeskTr>
              ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      )}

      {tab === "next" && (
        <DeskPanel title="Next visit & reminders">
          <DeskTable>
            <DeskThead>
            <DeskTh>Patient</DeskTh>
                <DeskTh>Type</DeskTh>
                <DeskTh>Due</DeskTh>
                <DeskTh>Phone</DeskTh>
              </DeskThead>
            <tbody>
              {reminders
                .filter((r) => !r.done)
                .map((r) => (
                  <DeskTr key={r.id}>
                    <DeskTd>{r.patientName}</DeskTd>
                    <DeskTd>{r.type}</DeskTd>
                    <DeskTd>{r.dueDate}</DeskTd>
                    <DeskTd>{r.phone}</DeskTd>
                  </DeskTr>
                ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      )}
    </div>
  );
}
