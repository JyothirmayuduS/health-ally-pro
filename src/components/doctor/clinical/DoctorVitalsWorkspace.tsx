import { useEffect, useState } from "react";
import { VitalsCaptureWorkspace } from "@/components/clinical/VitalsCaptureWorkspace";
import { DoctorClinicalPatientCard } from "@/components/doctor/clinical/DoctorClinicalPatientCard";
import { DoctorLockedPatientSelect } from "@/components/doctor/DoctorLockedPatientSelect";
import { listClinicalPatients, resolveDoctorPatient } from "@/lib/doctor-patient-context";

type Props = {
  searchPatientId?: string;
};

export function DoctorVitalsWorkspace({ searchPatientId }: Props) {
  const clinicalPatients = listClinicalPatients();
  const [patientId, setPatientId] = useState(searchPatientId ?? clinicalPatients[0]?.id ?? "");

  useEffect(() => {
    if (searchPatientId) setPatientId(searchPatientId);
  }, [searchPatientId]);

  const lockedPatient = searchPatientId ? resolveDoctorPatient(searchPatientId) : null;

  return (
    <VitalsCaptureWorkspace
      portal="doctor"
      patientId={patientId}
      recordedBy="Dr. Rajesh"
      chartPatientId={searchPatientId}
      patientCard={searchPatientId ? <DoctorClinicalPatientCard patientId={searchPatientId} /> : undefined}
      patientSelect={
        searchPatientId ? undefined : (
          <section className="rounded-[20px] border border-[#EDEAE6] bg-white p-4">
            <DoctorLockedPatientSelect
              value={patientId}
              options={clinicalPatients.map((p) => ({ id: p.id, name: p.name }))}
              lockedPatientId={searchPatientId}
              lockedLabel={lockedPatient?.name}
              onChange={setPatientId}
            />
          </section>
        )
      }
    />
  );
}
