import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Grid3X3,
  LayoutDashboard,
  ListOrdered,
  MessageSquare,
  Pill,
  Send,
  Settings,
  Shield,
  Share2,
  TestTube,
  User,
  Users,
} from "lucide-react";

export type DoctorNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Primary clinician navigation — single source of truth */
export const DOCTOR_PRIMARY_NAV: DoctorNavItem[] = [
  { to: "/doctor", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/doctor/patients", label: "Patients", icon: Users },
  { to: "/doctor/queue", label: "Queue", icon: ListOrdered },
  { to: "/doctor/reports", label: "Inbox", icon: ClipboardList },
  { to: "/doctor/settings", label: "Profile", icon: Settings },
];

/** Secondary clinical tools — sidebar (desktop) + FAB (mobile) only */
export const DOCTOR_CLINICAL_TOOLS = [
  { to: "/doctor/prescriptions", label: "Prescribe", icon: Pill },
  { to: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/doctor/settings/referrals", label: "Referrals", icon: Send },
  { to: "/doctor/settings/slots", label: "Booking slots", icon: Grid3X3 },
] as const;

export type DoctorModuleLink = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const DOCTOR_CLINICAL_MODULES: DoctorModuleLink[] = [
  { to: "/doctor/queue", label: "Live queue", description: "Today's queue board", icon: ListOrdered },
  { to: "/doctor/prescriptions", label: "Prescriptions", description: "E-prescribe to pharmacy", icon: Pill },
  { to: "/doctor/orders", label: "Lab orders", description: "Send orders to lab desk", icon: TestTube },
  { to: "/doctor/results", label: "Lab results", description: "Review released results", icon: FlaskConical },
  { to: "/doctor/reports", label: "Inbox", description: "Results, messages, referrals & tasks", icon: ClipboardList },
  { to: "/doctor/settings/emergency", label: "Coverage", description: "Colleague handoffs", icon: Shield },
  { to: "/doctor/settings/referrals", label: "Referrals", description: "Outbound referrals", icon: Share2 },
  { to: "/doctor/messaging", label: "Messaging", description: "Secure patient chat", icon: MessageSquare },
];

export const DOCTOR_SETTINGS_LINKS: DoctorModuleLink[] = [
  { to: "/doctor/settings", label: "Profile", description: "Profile, slots & availability", icon: User },
];
