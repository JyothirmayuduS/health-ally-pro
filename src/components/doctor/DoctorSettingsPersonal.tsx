import { useState } from "react";
import { toast } from "sonner";
import { DoctorProfileSubpage, ProfileSectionCard } from "@/components/doctor/profile/DoctorProfileSubpage";
import { savePersonalInfo } from "@/lib/doctor-profile-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";

export function DoctorSettingsPersonal() {
  const store = useProfileStore();
  const [name, setName] = useState(store.personal.name);
  const [email, setEmail] = useState(store.personal.email);
  const [specialty, setSpecialty] = useState(store.personal.specialty);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    savePersonalInfo({ name: name.trim(), email: email.trim(), specialty: specialty.trim() });
    toast.success("Profile updated", { description: "Changes sync to clinic directory" });
  };

  return (
    <DoctorProfileSubpage
      title="Personal information"
      subtitle="Name and contact shown to patients and staff"
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Personal information" },
      ]}
    >
      <ProfileSectionCard title="Profile details" hint="Changes sync to clinic directory">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-[#8A8F8C]">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] bg-white px-3.5 text-sm text-[#1B3B2E] outline-none focus:border-[#B8735D]/50 focus-visible:ring-2 focus-visible:ring-[#B8735D]/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#8A8F8C]">Specialty</span>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] bg-white px-3.5 text-sm text-[#1B3B2E] outline-none focus:border-[#B8735D]/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#8A8F8C]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] bg-white px-3.5 text-sm text-[#1B3B2E] outline-none focus:border-[#B8735D]/50"
            />
          </label>
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-[#1B3B2E] py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40"
          >
            Save changes
          </button>
        </div>
      </ProfileSectionCard>
    </DoctorProfileSubpage>
  );
}
