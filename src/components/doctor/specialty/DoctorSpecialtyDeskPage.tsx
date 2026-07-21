import { SpecialtyWorkstation } from "@/components/doctor/specialty/SpecialtyWorkstation";
import { useDoctorSpecialty } from "@/lib/specialties";

export default function DoctorSpecialtyDeskPage() {
  const { specialty, doctor, loading } = useDoctorSpecialty();

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-[#8A8F8C]">
        Loading specialty workstation…
      </div>
    );
  }

  return <SpecialtyWorkstation specialty={specialty} doctor={doctor} />;
}
