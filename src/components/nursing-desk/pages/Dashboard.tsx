import { Link } from "@tanstack/react-router";
import { Activity, Heart, Thermometer, Users, Stethoscope } from "lucide-react";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { listVitals } from "@/lib/nursing-desk/vitals";
import { DeskKpi, DeskPanel, DeskQuickAction, DeskTable, DeskThead, DeskTh, DeskEmpty } from "@/components/desk-shell/ui";

export default function NursingDashboard() {
  const vitals = listVitals();
  const today = new Date().toISOString().slice(0, 10);
  const todayVitals = vitals.filter((v) => v.at.startsWith(today));

  return (
    <div className="space-y-6" data-testid="nursing-dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        <DeskKpi testId="kpi-patients" label="Patients on file" value={SHARED_PATIENTS.length} />
        <DeskKpi
          testId="kpi-today-vitals"
          label="Vitals today"
          value={todayVitals.length}
          accent="text-clay"
        />
        <DeskKpi testId="kpi-total-vitals" label="Total readings" value={vitals.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3">
          <DeskQuickAction
            to="/nursing/vitals"
            icon={Activity}
            label="Record vitals"
            testId="qa-vitals"
            accentClass="bg-clay-soft text-clay group-hover:bg-clay group-hover:text-white"
          />
          <DeskQuickAction
            to="/nursing/patients"
            icon={Users}
            label="Patient census"
            testId="qa-patients"
            accentClass="bg-plum-soft text-plum group-hover:bg-plum group-hover:text-white"
          />
        </div>

        <DeskPanel title="Shift snapshot" className="lg:col-span-2">
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-stone-50 p-4">
              <Heart className="h-5 w-5 text-clay" />
              <div>
                <div className="text-[11px] text-ink-500">Avg pulse today</div>
                <div className="font-heading text-xl font-semibold">
                  {todayVitals.length
                    ? Math.round(todayVitals.reduce((s, v) => s + v.pulse, 0) / todayVitals.length)
                    : "—"}{" "}
                  {todayVitals.length > 0 && <span className="text-sm font-normal text-ink-400">bpm</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-stone-50 p-4">
              <Thermometer className="h-5 w-5 text-teal" />
              <div>
                <div className="text-[11px] text-ink-500">Avg temp today</div>
                <div className="font-heading text-xl font-semibold">
                  {todayVitals.length
                    ? (
                        todayVitals.reduce((s, v) => s + v.temp, 0) / todayVitals.length
                      ).toFixed(1)
                    : "—"}
                  {todayVitals.length > 0 && <span className="text-sm font-normal text-ink-400"> °C</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-stone-50 p-4">
              <Stethoscope className="h-5 w-5 text-sage" />
              <div>
                <div className="text-[11px] text-ink-500">Allergies flagged</div>
                <div className="font-heading text-xl font-semibold">
                  {SHARED_PATIENTS.filter((p) => p.allergies !== "—").length}
                </div>
              </div>
            </div>
          </div>
        </DeskPanel>
      </div>

      <DeskPanel title="Recent vitals">
        <DeskTable>
          <DeskThead>
            <DeskTh>Time</DeskTh>
            <DeskTh>Patient</DeskTh>
            <DeskTh>BP</DeskTh>
            <DeskTh>Pulse</DeskTh>
            <DeskTh>SpO₂</DeskTh>
          </DeskThead>
          <tbody>
            {vitals.slice(0, 10).map((v) => {
              const p = SHARED_PATIENTS.find((x) => x.id === v.patientId);
              return (
                <tr key={v.id} className="border-b border-stone-100 hover:bg-bone/40">
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-500">
                    {new Date(v.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-medium">{p?.name ?? v.patientId}</td>
                  <td className="px-4 py-3 font-mono">
                    {v.bpSys}/{v.bpDia}
                  </td>
                  <td className="px-4 py-3">{v.pulse} bpm</td>
                  <td className="px-4 py-3">{v.spo2}%</td>
                </tr>
              );
            })}
            {vitals.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <DeskEmpty>
                    No vitals yet —{" "}
                    <Link to="/nursing/vitals" className="font-medium text-clay hover:underline">
                      record first reading
                    </Link>
                  </DeskEmpty>
                </td>
              </tr>
            )}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
