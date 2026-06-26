import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { DoctorProfileSubpage, ProfileSectionCard } from "@/components/doctor/profile/DoctorProfileSubpage";

export function DoctorSettingsSecurity() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState(true);

  return (
    <DoctorProfileSubpage
      title="Security"
      subtitle="Password, two-factor, and device sessions"
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Security" },
      ]}
    >
      <ProfileSectionCard title="Password" hint="Last changed 42 days ago">
        <button
          type="button"
          onClick={() => toast.message("Password change", { description: "Check your email for a reset link." })}
          className="w-full rounded-xl border border-[#E8E4DF] bg-white py-3 text-sm font-semibold text-[#1B3B2E]"
        >
          Change password
        </button>
      </ProfileSectionCard>

      <ProfileSectionCard title="Two-factor authentication">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1B3B2E]">Authenticator app</p>
            <p className="text-xs text-[#8A8F8C]">Required for sign-off and prescriptions</p>
          </div>
          <Switch
            checked={twoFactor}
            onCheckedChange={(v) => {
              setTwoFactor(v);
              toast.message(v ? "2FA enabled" : "2FA disabled");
            }}
            className="data-[state=checked]:bg-[#7A9B7E]"
          />
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard title="Active sessions">
        <div className="space-y-3">
          <div className="rounded-xl border border-[#EDEAE6] bg-[#FAFAF8] px-4 py-3">
            <p className="text-sm font-semibold text-[#1B3B2E]">This device · Chrome</p>
            <p className="text-xs text-[#8A8F8C]">Room 3A · Active now</p>
          </div>
          <button
            type="button"
            onClick={() => toast.message("Other sessions signed out")}
            className="w-full rounded-xl border border-[#FECACA] py-2.5 text-sm font-semibold text-[#C45C4A]"
          >
            Sign out other sessions
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#1B3B2E]">New login alerts</p>
              <p className="text-xs text-[#8A8F8C]">Email when a new device signs in</p>
            </div>
            <Switch
              checked={sessionAlerts}
              onCheckedChange={setSessionAlerts}
              className="data-[state=checked]:bg-[#7A9B7E]"
            />
          </div>
        </div>
      </ProfileSectionCard>
    </DoctorProfileSubpage>
  );
}
