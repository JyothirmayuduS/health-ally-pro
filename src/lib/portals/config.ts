import type { PortalKey } from "@/lib/supabase/rbac";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Layers,
  Users,
  Stethoscope,
  Briefcase,
  FlaskConical,
  Settings,
  BarChart3,
  UserPlus,
  CalendarDays,
  ClipboardCheck,
  Clock4,
  Monitor,
  Calendar,
  ListOrdered,
  FileText,
  Pill,
  TestTube,
  Droplets,
  Cog,
  CheckCircle,
  Package,
  RefreshCw,
  Receipt,
  CreditCard,
  HeartPulse,
  Activity,
} from "lucide-react";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const PORTAL_NAV: Record<PortalKey, PortalNavItem[]> = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/hospital", label: "Hospital", icon: Building2 },
    { to: "/admin/branches", label: "Branches", icon: GitBranch },
    { to: "/admin/departments", label: "Departments", icon: Layers },
    { to: "/admin/staff", label: "Staff", icon: Users },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/services", label: "Services", icon: Briefcase },
    { to: "/admin/lab-catalog", label: "Lab catalog", icon: FlaskConical },
    { to: "/admin/pharmacy-formulary", label: "Pharmacy formulary", icon: Pill },
    { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  reception: [
    { to: "/reception", label: "Dashboard", icon: LayoutDashboard },
    { to: "/reception/register", label: "Register", icon: UserPlus },
    { to: "/reception/patients", label: "Patients", icon: Users },
    { to: "/reception/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/reception/check-in", label: "Check-in", icon: ClipboardCheck },
    { to: "/reception/queue", label: "Queue", icon: Clock4 },
    { to: "/reception/token-display", label: "Token display", icon: Monitor },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/schedule", label: "Schedule", icon: Calendar },
    { to: "/doctor/queue", label: "Queue", icon: ListOrdered },
    { to: "/doctor/patients", label: "Patients", icon: Users },
    { to: "/doctor/encounters", label: "Encounters", icon: FileText },
    { to: "/doctor/orders", label: "Orders", icon: TestTube },
    { to: "/doctor/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/doctor/results", label: "Results", icon: FlaskConical },
  ],
  lab: [
    { to: "/lab", label: "Dashboard", icon: LayoutDashboard },
    { to: "/lab/orders", label: "Orders", icon: ListOrdered },
    { to: "/lab/collection", label: "Collection", icon: Droplets },
    { to: "/lab/processing", label: "Processing", icon: Cog },
    { to: "/lab/validation", label: "Validation", icon: CheckCircle },
  ],
  pharmacy: [
    { to: "/pharmacy", label: "Dashboard", icon: LayoutDashboard },
    { to: "/pharmacy/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/pharmacy/dispense", label: "Dispense", icon: Package },
    { to: "/pharmacy/refills", label: "Refills", icon: RefreshCw },
    { to: "/pharmacy/inventory", label: "Inventory", icon: Briefcase },
  ],
  billing: [
    { to: "/billing", label: "Dashboard", icon: LayoutDashboard },
    { to: "/billing/encounters", label: "Encounters", icon: FileText },
    { to: "/billing/invoices", label: "Invoices", icon: Receipt },
    { to: "/billing/payments", label: "Payments", icon: CreditCard },
  ],
  nursing: [
    { to: "/nursing", label: "Dashboard", icon: LayoutDashboard },
    { to: "/nursing/patients", label: "Patients", icon: Users },
    { to: "/nursing/vitals", label: "Vitals", icon: Activity },
  ],
};

export const PORTAL_ACCENT: Record<PortalKey, string> = {
  admin: "bg-ink text-primary-foreground",
  reception: "bg-clay text-accent-foreground",
  doctor: "bg-emerald-700 text-white",
  lab: "bg-violet-700 text-white",
  pharmacy: "bg-amber-700 text-white",
  billing: "bg-sky-800 text-white",
  nursing: "bg-rose-700 text-white",
};
