import { Link } from "@tanstack/react-router";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { isScheduleDirty } from "@/lib/doctor-profile-store";

export function DoctorClinicOnboardingBanner() {
  const store = useProfileStore();
  const needsSetup = !store.schedule.savedAt || isScheduleDirty();

  if (!needsSetup) return null;

  return (
    <div className="rounded-2xl border border-[#F5E6B8] bg-[#FDF8EB] px-4 py-4 sm:px-5">
      <p className="font-semibold text-[#5C4A1E]">Finish setting up your clinic day</p>
      <p className="mt-1 text-sm text-[#8A8F8C]">
        Publish booking slots and confirm your room so patients can book and your schedule fills in.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/doctor/settings/slots"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-[#1B3B2E] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Set up booking slots
        </Link>
        <Link
          to="/doctor/schedule"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[#E8E4DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3B2E]"
        >
          View schedule
        </Link>
      </div>
    </div>
  );
}
