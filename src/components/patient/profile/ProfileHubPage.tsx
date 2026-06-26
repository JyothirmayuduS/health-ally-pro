import { Link } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  CalendarPlus,
  Droplet,
  FileText,
  Heart,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Scale,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Appointment, Report } from "@/lib/mock-data";
import { reports as mockReports } from "@/lib/mock-data";
import { IdentityProfileSheet } from "@/components/patient/profile/IdentityProfileSheet";
import { DependentPreviewCard } from "@/components/patient/profile/DependentCard";
import {
  ProfileCard,
  ProfileLinkRow,
  ProfileRow,
  ProfileSectionTitle,
  ProfileToggleRow,
} from "@/components/patient/profile/profile-ui";
import { useDependents } from "@/hooks/useDependents";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";
import {
  getProfilePreferences,
  PROFILE_PREFS_EVENT,
  setProfilePreference,
  type ProfilePrefId,
} from "@/lib/patient-preferences-store";
import {
  PATIENT_IDENTITY,
  PROFILE_ACCOUNT_LINKS,
  PROFILE_PREFERENCES,
} from "@/lib/patient-profile-data";
import {
  fetchAppointmentsForPatient,
  fetchPatientProfile,
  fetchReportsForPatient,
} from "@/lib/supabase/queries";

const ACCOUNT_ICONS = {
  messages: MessageCircle,
  notifications: Bell,
  book: CalendarPlus,
  privacy: Shield,
  support: Phone,
  terms: Scale,
} as const;

const PREF_ICONS = {
  reminders: Bell,
  insights: Heart,
  "2fa": Shield,
} as const;

export function ProfileHubPage() {
  const dependents = useDependents();
  const [identityOpen, setIdentityOpen] = useState(false);
  const [identity, setIdentity] = useState(PATIENT_IDENTITY);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [prefs, setPrefs] = useState(getProfilePreferences);

  useEffect(() => {
    fetchPatientProfile().then((p) => {
      setIdentity((prev) => ({
        ...prev,
        name: p.name,
        initials: p.initials,
        email: p.email,
        memberSince: p.memberSince ?? prev.memberSince,
        age: p.age ?? prev.age,
        bloodGroup: p.bloodGroup ?? prev.bloodGroup,
      }));
    });
    Promise.all([fetchAppointmentsForPatient(), fetchReportsForPatient()]).then(
      ([a, r]) => {
        setAppointments(a);
        setReports(r.length ? r : mockReports);
      },
    );
    const syncPrefs = () => setPrefs(getProfilePreferences());
    window.addEventListener(PROFILE_PREFS_EVENT, syncPrefs);
    return () => window.removeEventListener(PROFILE_PREFS_EVENT, syncPrefs);
  }, []);

  const visitsDone = appointments.filter((a) => a.status === "completed").length || 1;
  const appointmentCount = Math.max(appointments.length, 3);
  const reportCount = Math.max(reports.length, mockReports.length);

  return (
    <PatientHubLayout widthClass="max-w-3xl lg:max-w-5xl">
      <section className="mb-4 overflow-hidden rounded-[24px] bg-ink p-5 text-white sm:mb-6 sm:rounded-[28px] sm:p-6">
        <h1 className="font-serif text-[26px] leading-tight sm:text-[32px]">
          {identity.name}
        </h1>
        <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-white/85 sm:text-sm">
          <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{identity.email}</span>
        </p>
        <p className="mt-1 text-xs text-white/60 sm:text-sm">
          Member since {identity.memberSince}
        </p>
        <button
          type="button"
          onClick={() => setIdentityOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/25 sm:mt-5 sm:rounded-2xl sm:py-2.5 sm:text-sm"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
          Edit profile
        </button>
      </section>

      <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        {[
          { label: "Appointments", value: String(appointmentCount).padStart(2, "0"), icon: Calendar },
          { label: "Reports", value: String(reportCount).padStart(2, "0"), icon: FileText },
          { label: "Visits done", value: String(visitsDone).padStart(2, "0"), icon: Heart },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[18px] border border-[#EDEAE6] bg-white px-2 py-3.5 text-center sm:rounded-[20px] sm:px-3 sm:py-4"
          >
            <Icon className="mx-auto h-4 w-4 text-ink-muted" strokeWidth={1.75} />
            <p className="mt-1.5 font-serif text-xl tabular-nums text-ink sm:mt-2 sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-ink-muted sm:text-[10px]">
              {label}
            </p>
          </div>
        ))}
      </section>

      <ProfileSectionTitle
        action={
          <Link
            to="/profile/dependents/"
            className="text-[13px] font-semibold text-[#A67C66] sm:text-sm"
          >
            View all
          </Link>
        }
      >
        Dependents
      </ProfileSectionTitle>
      <ul className="mb-5 flex flex-col gap-2.5 sm:mb-6 sm:gap-3">
        {dependents.map((dep) => (
          <li key={dep.id}>
            <DependentPreviewCard dep={dep} />
          </li>
        ))}
      </ul>

      <ProfileSectionTitle>Health Profile</ProfileSectionTitle>
      <ProfileCard className="mb-5 sm:mb-6">
        <ProfileRow icon={User} label="Full name" value={identity.name} />
        <div className="border-t border-[#EDEAE6]">
          <ProfileRow icon={Mail} label="Email" value={identity.email} />
        </div>
        <div className="border-t border-[#EDEAE6]">
          <ProfileRow icon={Calendar} label="Age" value={`${identity.age} years`} />
        </div>
        <div className="border-t border-[#EDEAE6]">
          <ProfileRow icon={Droplet} label="Blood group" value={identity.bloodGroup} />
        </div>
      </ProfileCard>

      <ProfileSectionTitle>Preferences</ProfileSectionTitle>
      <ProfileCard className="mb-6">
        {PROFILE_PREFERENCES.map((pref) => {
          const Icon = PREF_ICONS[pref.id];
          return (
            <ProfileToggleRow
              key={pref.id}
              icon={Icon}
              title={pref.title}
              description={pref.description}
              checked={prefs[pref.id as ProfilePrefId] ?? pref.defaultOn}
              onCheckedChange={(v) => setProfilePreference(pref.id as ProfilePrefId, v)}
            />
          );
        })}
      </ProfileCard>

      <ProfileSectionTitle>Account</ProfileSectionTitle>
      <ProfileCard className="mb-5">
        {PROFILE_ACCOUNT_LINKS.map((link) => {
          const Icon = ACCOUNT_ICONS[link.id];
          return (
            <ProfileLinkRow
              key={link.id}
              icon={Icon}
              label={link.label}
              to={link.to}
            />
          );
        })}
      </ProfileCard>

      <Link
        to="/login"
        onClick={() =>
          toast.message("Signed out", { description: "You have been signed out securely." })
        }
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#EDEAE6] bg-white py-3.5 text-sm font-semibold text-[#C44B3F] transition-colors hover:bg-[#FDF0EE]"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Sign out
      </Link>

      <p className="text-center text-xs text-ink-muted">Medora v1.0.0</p>

      <IdentityProfileSheet open={identityOpen} onClose={() => setIdentityOpen(false)} />
    </PatientHubLayout>
  );
}
