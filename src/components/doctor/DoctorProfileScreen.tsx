import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Headphones,
  HelpCircle,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Shield,
  Star,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { apkDoctor, apkTasks } from "@/lib/doctor-apk-data";
import { computeClinicOverview, panelCounts } from "@/lib/doctor-clinic-overview";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import {
  isScheduleDirty,
  profileAttentionItems,
  referralsAwaitingCount,
  unreadNotificationCount,
} from "@/lib/doctor-profile-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { signOut } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

function ProfileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[22px] bg-white p-4 shadow-[0_4px_20px_rgba(27,59,46,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">{children}</p>
  );
}

function ProfileMenuRow({
  to,
  href,
  icon: Icon,
  iconBg = "#F5F2ED",
  title,
  subtitle,
  badge,
  onClick,
}: {
  to?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBg?: string;
  title: string;
  subtitle: string;
  badge?: number | null;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#1B3B2E]">{title}</p>
        <p className="truncate text-xs text-[#8A8F8C]">{subtitle}</p>
      </div>
      {badge != null && badge > 0 && (
        <span className="min-w-[22px] rounded-full bg-[#C45C4A] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-[#CBD5E1]" />
    </>
  );

  const rowClass =
    "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAF9F7] first:rounded-t-[22px] last:rounded-b-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B8735D]/30";

  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={rowClass} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={rowClass} onClick={onClick}>
      {content}
    </button>
  );
}

function StatChip({
  value,
  label,
  icon: Icon,
  iconBg,
  valueColor = "#1B3B2E",
  to,
  search,
}: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconBg: string;
  valueColor?: string;
  to?: string;
  search?: Record<string, unknown>;
}) {
  const inner = (
    <>
      <span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: iconBg }}>
        <Icon className="h-3.5 w-3.5 text-[#1B3B2E]" strokeWidth={1.75} />
      </span>
      <div className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-sm font-bold tabular-nums" style={{ color: valueColor }}>
          {value}
        </span>
        <span className="text-xs text-[#8A8F8C]">{label}</span>
      </div>
    </>
  );

  const className =
    "flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_2px_12px_rgba(27,59,46,0.06)] transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/40";

  if (to) {
    return (
      <Link to={to} search={search} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function SupportBlock({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <SectionLabel>SUPPORT</SectionLabel>
      <ProfileCard className="mt-2 p-0">
        <div className="flex items-center gap-3 border-b border-[#F5F2ED] px-4 py-3.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8EFE6]">
            <Headphones className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
          </span>
          <p className="font-semibold text-[#1B3B2E]">Need help with Medora?</p>
        </div>
        <ProfileMenuRow
          href="tel:+911800123456"
          icon={Phone}
          iconBg="#F5F2ED"
          title="Call support"
          subtitle="Mon–Sat 8am–8pm IST"
        />
        <ProfileMenuRow
          href="mailto:support@medora.health"
          icon={Mail}
          iconBg="#F5F2ED"
          title="Email support"
          subtitle="support@medora.health"
        />
        <ProfileMenuRow
          icon={MessageCircle}
          iconBg="#F5F2ED"
          title="Live chat"
          subtitle="Typical reply under 5 min"
          onClick={() => toast("Live chat", { description: "Connecting you to Medora support…" })}
        />
        <ProfileMenuRow
          icon={HelpCircle}
          iconBg="#F5F2ED"
          title="Help center"
          subtitle="Guides & FAQs"
          onClick={() => toast("Help center", { description: "Opening Medora knowledge base…" })}
        />
      </ProfileCard>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#FECACA] bg-white py-3.5 text-sm font-semibold text-[#DC2626] transition-colors hover:border-[#F87171]/60 hover:bg-[#FEF2F2]"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Sign out
      </button>
    </>
  );
}

export function DoctorProfileScreen() {
  const store = useProfileStore();
  const { entries, bookingRequests, accepting, room, toggleAccepting } = useLiveQueue();
  const overview = computeClinicOverview({ accepting, room, entries, bookingRequests });
  const counts = panelCounts();
  const attention = profileAttentionItems();

  const visitsToday = overview.inLine + overview.completedToday;
  const activeSlots = store.schedule.slots.filter((s) => s.enabled).length;
  const scheduleSubtitle = `${activeSlots} active slots · ${store.schedule.room}`;
  const pendingReferrals = referralsAwaitingCount();
  const unreadNotifs = unreadNotificationCount();
  const scheduleDirty = isScheduleDirty();

  const availabilityLabel = store.away.active
    ? store.availabilityMode === "emergency"
      ? "Emergency — coverage active"
      : "Away — coverage active"
    : accepting
      ? "Patients can book and join your queue"
      : "Queue paused — not accepting bookings";

  const handleSignOut = () => {
    signOut().then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-2 lg:max-w-5xl lg:space-y-6 lg:pb-4">
      <header>
        <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
          Profile
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[#8A8F8C]">{store.personal.specialty}</p>
      </header>

      {store.away.active && (
        <div className="rounded-xl border border-[#F5E6B8] bg-[#FDF8EB] px-4 py-3 text-sm text-[#5C4A1E]">
          You are currently away.{" "}
          <Link to="/doctor/settings/emergency" className="font-semibold text-[#B8735D] underline">
            Manage coverage
          </Link>
        </div>
      )}

      {attention.length > 0 && (
        <section>
          <SectionLabel>NEEDS ATTENTION</SectionLabel>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:flex-wrap lg:overflow-visible">
            {attention.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "flex min-w-[200px] shrink-0 items-center gap-3 rounded-[18px] border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md lg:min-w-0 lg:flex-1",
                  item.tone === "urgent" && "border-[#FECACA]",
                  item.tone === "warn" && "border-[#F5E6B8]",
                  item.tone === "info" && "border-[#E8E4DF]",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white",
                    item.tone === "urgent" && "bg-[#C45C4A]",
                    item.tone === "warn" && "bg-[#E9A820]",
                    item.tone === "info" && "bg-[#8A8F8C]",
                  )}
                >
                  {item.count}
                </span>
                <span className="text-sm font-semibold text-[#1B3B2E]">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:flex-wrap lg:overflow-visible">
        <StatChip
          value={String(visitsToday)}
          label="Today"
          icon={Calendar}
          iconBg="#E8EFE6"
          to="/doctor/queue"
        />
        <StatChip
          value={String(counts.panel)}
          label="Panel"
          icon={Users}
          iconBg="#F0DDD6"
          valueColor="#B8735D"
          to="/doctor/patients"
          search={{ view: "panel", category: "all" }}
        />
        <StatChip
          value={String(apkTasks.length)}
          label="Tasks"
          icon={ClipboardList}
          iconBg="#F5E6B8"
          valueColor="#B8735D"
          to="/doctor/patients/tasks"
        />
        <StatChip
          value={String(apkDoctor.rating)}
          label="Rating"
          icon={Star}
          iconBg="#E8EFE6"
          to="/doctor/settings/personal"
        />
      </div>

      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-4 lg:order-2">
          <div>
            <SectionLabel>WORKSPACE</SectionLabel>
            <ProfileCard className="mt-2 p-0">
              <ProfileMenuRow
                to="/doctor/settings/audit"
                icon={ClipboardList}
                iconBg="#F5F2ED"
                title="Audit trail"
                subtitle="Clinical actions on this device"
              />
              <ProfileMenuRow
                to="/doctor/settings/referrals"
                icon={Send}
                iconBg="#F0DDD6"
                title="Referrals"
                subtitle={`${pendingReferrals} awaiting action`}
                badge={pendingReferrals}
              />
              <ProfileMenuRow
                to="/doctor/settings/notifications"
                icon={Bell}
                iconBg="#E8EFE6"
                title="Notifications"
                subtitle={unreadNotifs > 0 ? `${unreadNotifs} unread` : "Alerts & activity"}
                badge={unreadNotifs}
              />
              <ProfileMenuRow
                to="/doctor/schedule"
                icon={Calendar}
                iconBg="#F0DDD6"
                title="Schedule"
                subtitle="Calendar & patient visits"
              />
              <ProfileMenuRow
                to="/doctor/settings/slots"
                icon={Clock}
                iconBg="#EDEAE6"
                title="Booking slots"
                subtitle={scheduleDirty ? "Unsaved changes" : scheduleSubtitle}
                badge={scheduleDirty ? 1 : null}
              />
              <ProfileMenuRow
                to="/doctor/settings/emergency"
                icon={AlertTriangle}
                iconBg="#F5E6B8"
                title="Emergency / away"
                subtitle="Reassign patients & notify"
                badge={store.away.active ? 1 : null}
              />
            </ProfileCard>
          </div>

          <div>
            <SectionLabel>ACCOUNT</SectionLabel>
            <ProfileCard className="mt-2 p-0">
              <ProfileMenuRow
                to="/doctor/settings/personal"
                icon={User}
                iconBg="#F5F2ED"
                title="Personal information"
                subtitle={store.personal.email}
              />
              <ProfileMenuRow
                to="/doctor/settings/security"
                icon={Shield}
                iconBg="#E8EFE6"
                title="Security"
                subtitle="Password & two-factor"
              />
            </ProfileCard>
          </div>

          <div className="lg:hidden">
            <SupportBlock onSignOut={handleSignOut} />
          </div>
        </div>

        <div className="space-y-4 lg:order-1">
          <ProfileCard>
            <Link to="/doctor/settings/personal" className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#1B3B2E] text-xl font-semibold text-white">
                {apkDoctor.initials}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-lg font-bold text-[#1B3B2E]">{store.personal.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#8A8F8C]">
                  <Stethoscope className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  {store.personal.specialty}
                </p>
                <p className="mt-2 truncate text-xs text-[#8A8F8C]">{store.personal.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#CBD5E1]" />
            </Link>
          </ProfileCard>

          <ProfileCard className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-[#1B3B2E]">Clinic availability</p>
              <p className="mt-0.5 text-xs text-[#8A8F8C]">{availabilityLabel}</p>
            </div>
            <Switch
              checked={accepting && !store.away.active}
              disabled={store.away.active}
              onCheckedChange={() => {
                if (!store.away.active) toggleAccepting();
              }}
              className="data-[state=checked]:bg-[#7A9B7E]"
              aria-label="Toggle clinic availability"
            />
          </ProfileCard>

          {store.away.active && (
            <ProfileCard className="border border-[#F5E6B8] bg-[#FDF8EB]">
              <p className="text-sm font-semibold text-[#5C4A1E]">Away mode is controlling availability</p>
              <p className="mt-1 text-xs text-[#8A8F8C]">
                End away mode from Emergency / away to resume bookings.
              </p>
              <Link
                to="/doctor/settings/emergency"
                className="mt-3 inline-block text-sm font-semibold text-[#B8735D] hover:underline"
              >
                Open Emergency / away →
              </Link>
            </ProfileCard>
          )}

          <div className="hidden lg:block">
            <SupportBlock onSignOut={handleSignOut} />
          </div>
        </div>
      </div>
    </div>
  );
}
