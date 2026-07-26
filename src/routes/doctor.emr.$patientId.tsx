import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { EmrWorkspace } from "@/components/emr/EmrWorkspace";
import { getPanelPatient } from "@/lib/doctor-patients-apk-data";

export const Route = createFileRoute("/doctor/emr/$patientId")({
  component: DoctorEmrPage,
});

function DoctorEmrPage() {
  const { patientId } = Route.useParams();
  const patient = getPanelPatient(patientId);

  return (
    <div data-testid="doctor-emr-page" className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/doctor/patients/$patientId"
          params={{ patientId }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-bone"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-sage">
            Doctor · Chart
          </p>
          <h1 className="font-heading text-[20px] font-semibold text-ink-900">
            {patient?.name ?? "Patient"} EMR
          </h1>
        </div>
      </div>
      <EmrWorkspace
        patientId={patientId}
        patientName={patient?.name}
        canWrite
      />
    </div>
  );
}
