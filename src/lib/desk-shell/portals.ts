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
  FileText,
  Receipt,
  CreditCard,
  Activity,
  HeartPulse,
  Calendar,
  ListOrdered,
  Pill,
  TestTube,
  BedDouble,
  Scan,
  DollarSign,
  Shield,
  CalendarRange,
  LayoutGrid,
  Megaphone,
  TrendingUp,
  CalendarOff,
} from "lucide-react";
import type { DeskPortalConfig } from "./types";

export const BILLING_DESK: DeskPortalConfig = {
  id: "billing",
  portalLabel: "Billing",
  version: "v1.0",
  hospitalName: "Maple Hospital",
  wrapperClass: "billing-desk reception-desk",
  theme: {
    activeBg: "bg-teal-soft",
    activeText: "text-teal",
    activeBar: "bg-teal",
    brandIconBg: "bg-teal",
    brandIconFg: "text-white",
    avatarBg: "bg-teal-soft",
    avatarText: "text-teal",
    searchRing: "focus:border-teal focus:ring-teal",
  },
  sections: [
    {
      title: "Overview",
      items: [
        { to: "/billing", label: "Dashboard", icon: LayoutDashboard, exact: true, dot: "bg-teal" },
      ],
    },
    {
      title: "Revenue",
      items: [
        { to: "/billing/invoices", label: "Invoices", icon: Receipt, dot: "bg-money" },
        { to: "/billing/payments", label: "Payments", icon: CreditCard, dot: "bg-mustard" },
        { to: "/billing/encounters", label: "Encounters", icon: FileText, dot: "bg-plum" },
        { to: "/billing/leave", label: "My Leaves", icon: CalendarOff, dot: "bg-plum" },
      ],
    },
  ],
  searchPlaceholder: "Search invoice, MRN, patient…",
  staff: { name: "Anita Rao", role: "Finance · Back office", initials: "AR" },
  titleFromPath: (pathname) => {
    if (pathname === "/billing" || pathname === "/billing/")
      return { eyebrow: "Finance", title: "Billing dashboard" };
    if (pathname.startsWith("/billing/invoices"))
      return { eyebrow: "Ledger", title: "Hospital invoices" };
    if (pathname.startsWith("/billing/payments"))
      return { eyebrow: "Collections", title: "Payment log" };
    if (pathname.startsWith("/billing/encounters"))
      return { eyebrow: "Visits", title: "Encounter linkage" };
    if (pathname.startsWith("/billing/leave"))
      return { eyebrow: "HR", title: "My leaves" };
    return { eyebrow: "Billing", title: "Back office" };
  },
};

export const NURSING_DESK: DeskPortalConfig = {
  id: "nursing",
  portalLabel: "Nursing",
  version: "v1.0",
  hospitalName: "Maple Hospital",
  wrapperClass: "nursing-desk reception-desk",
  theme: {
    activeBg: "bg-clay-soft",
    activeText: "text-clay",
    activeBar: "bg-clay",
    brandIconBg: "bg-clay",
    brandIconFg: "text-white",
    avatarBg: "bg-clay-soft",
    avatarText: "text-clay",
    searchRing: "focus:border-clay focus:ring-clay",
  },
  sections: [
    {
      title: "Ward",
      items: [
        { to: "/nursing", label: "Dashboard", icon: LayoutDashboard, exact: true, dot: "bg-clay" },
        { to: "/nursing/beds", label: "IPD & beds", icon: BedDouble, dot: "bg-teal" },
        { to: "/nursing/patients", label: "Patients", icon: Users, dot: "bg-plum" },
        { to: "/nursing/vitals", label: "Vitals", icon: Activity, dot: "bg-teal" },
        { to: "/nursing/leave", label: "My Leaves", icon: CalendarOff, dot: "bg-plum" },
      ],
    },
  ],
  searchPlaceholder: "Search patient, MRN, ward…",
  staff: { name: "Sunita Pillai", role: "Ward · Day shift", initials: "SP" },
  titleFromPath: (pathname) => {
    if (pathname === "/nursing" || pathname === "/nursing/")
      return { eyebrow: "Ward", title: "Nursing station" };
    if (pathname.startsWith("/nursing/beds"))
      return { eyebrow: "IPD", title: "Bed management" };
    if (pathname.startsWith("/nursing/patients"))
      return { eyebrow: "Census", title: "Patient list" };
    if (pathname.startsWith("/nursing/vitals"))
      return { eyebrow: "Clinical", title: "Record vitals" };
    if (pathname.startsWith("/nursing/leave"))
      return { eyebrow: "HR", title: "My leaves" };
    return { eyebrow: "Nursing", title: "Station" };
  },
};

export const ADMIN_DESK: DeskPortalConfig = {
  id: "admin",
  portalLabel: "Administration",
  version: "v1.0",
  hospitalName: "Oak Haven Medical",
  wrapperClass: "admin-desk reception-desk",
  theme: {
    activeBg: "bg-plum-soft",
    activeText: "text-plum",
    activeBar: "bg-plum",
    brandIconBg: "bg-plum",
    brandIconFg: "text-white",
    avatarBg: "bg-plum-soft",
    avatarText: "text-plum",
    searchRing: "focus:border-plum focus:ring-plum",
  },
  sections: [
    {
      title: "Overview",
      items: [
        { to: "/admin", label: "Command center", icon: LayoutDashboard, exact: true, dot: "bg-plum" },
        { to: "/admin/analytics", label: "Analytics", icon: BarChart3, dot: "bg-teal" },
        { to: "/admin/revenue", label: "Revenue", icon: DollarSign, dot: "bg-money" },
        { to: "/admin/occupancy", label: "Occupancy & load", icon: LayoutGrid, dot: "bg-clay" },
      ],
    },
    {
      title: "Organization",
      items: [
        { to: "/admin/hospital", label: "Hospital", icon: Building2, dot: "bg-sage" },
        { to: "/admin/branches", label: "Branches", icon: GitBranch, dot: "bg-mustard" },
        { to: "/admin/departments", label: "Departments", icon: Layers, dot: "bg-clay" },
        { to: "/admin/staff", label: "Staff", icon: Users, dot: "bg-plum" },
        { to: "/admin/access-control", label: "Access control", icon: Shield, dot: "bg-plum" },
        { to: "/admin/announcements", label: "Announcements", icon: Megaphone, dot: "bg-clay" },
        { to: "/admin/hr", label: "HR & Performance", icon: TrendingUp, dot: "bg-clay" },
      ],
    },
    {
      title: "Clinical config",
      items: [
        { to: "/admin/doctors", label: "Doctors", icon: Stethoscope, dot: "bg-teal" },
        { to: "/admin/doctor-roster", label: "Doctor roster", icon: CalendarRange, dot: "bg-teal" },
        { to: "/admin/ot", label: "Operation theatre", icon: Activity, dot: "bg-plum" },
        { to: "/admin/services", label: "Services & fees", icon: Briefcase, dot: "bg-money" },
        { to: "/admin/lab-catalog", label: "Lab catalog", icon: FlaskConical, dot: "bg-sage" },
        { to: "/admin/pharmacy-formulary", label: "Pharmacy formulary", icon: Pill, dot: "bg-mustard" },
      ],
    },
    {
      title: "System",
      items: [{ to: "/admin/settings", label: "Settings", icon: Settings, dot: "bg-ink-900" }],
    },
  ],
  searchPlaceholder: "Search staff, department, doctor…",
  staff: { name: "Admin User", role: "Hospital admin", initials: "AU" },
  titleFromPath: (pathname) => {
    if (pathname === "/admin" || pathname === "/admin/")
      return { eyebrow: "Control", title: "Hospital command center" };
    if (pathname.startsWith("/admin/hospital"))
      return { eyebrow: "Organization", title: "Hospital profile" };
    if (pathname.startsWith("/admin/branches"))
      return { eyebrow: "Organization", title: "Branches" };
    if (pathname.startsWith("/admin/departments"))
      return { eyebrow: "Organization", title: "Departments" };
    if (pathname.startsWith("/admin/staff"))
      return { eyebrow: "People", title: "Staff directory" };
    if (pathname.startsWith("/admin/doctors"))
      return { eyebrow: "Clinical", title: "Doctors" };
    if (pathname.startsWith("/admin/services"))
      return { eyebrow: "Pricing", title: "Service fees" };
    if (pathname.startsWith("/admin/lab-catalog"))
      return { eyebrow: "Clinical", title: "Lab catalog" };
    if (pathname.startsWith("/admin/pharmacy-formulary"))
      return { eyebrow: "Clinical", title: "Pharmacy formulary" };
    if (pathname.startsWith("/admin/settings"))
      return { eyebrow: "System", title: "Hospital settings" };
    if (pathname.startsWith("/admin/analytics"))
      return { eyebrow: "Insights", title: "Analytics" };
    if (pathname.startsWith("/admin/revenue"))
      return { eyebrow: "Finance", title: "Revenue cycle" };
    if (pathname.startsWith("/admin/access-control"))
      return { eyebrow: "Security", title: "Access control" };
    if (pathname.startsWith("/admin/doctor-roster"))
      return { eyebrow: "Clinical", title: "Doctor roster" };
    if (pathname.startsWith("/admin/occupancy"))
      return { eyebrow: "Operations", title: "Occupancy & load" };
    if (pathname.startsWith("/admin/announcements"))
      return { eyebrow: "Communications", title: "Announcements" };
    if (pathname.startsWith("/admin/ot"))
      return { eyebrow: "Clinical", title: "Operation theatre" };
    if (pathname.startsWith("/admin/hr"))
      return { eyebrow: "People", title: "HR & Performance" };
    return { eyebrow: "Admin", title: "Control center" };
  },
};

export const DOCTOR_DESK: DeskPortalConfig = {
  id: "doctor",
  portalLabel: "Doctor",
  version: "v1.0",
  hospitalName: "Maple Hospital",
  wrapperClass: "doctor-desk reception-desk",
  theme: {
    activeBg: "bg-clay-soft",
    activeText: "text-clay",
    activeBar: "bg-clay",
    brandIconBg: "bg-clay",
    brandIconFg: "text-white",
    avatarBg: "bg-clay-soft",
    avatarText: "text-clay",
    searchRing: "focus:border-clay focus:ring-clay",
  },
  sections: [
    {
      title: "Clinic",
      items: [
        { to: "/doctor", label: "Dashboard", icon: LayoutDashboard, exact: true, dot: "bg-clay" },
        { to: "/doctor/schedule", label: "Schedule", icon: Calendar, dot: "bg-clay" },
        { to: "/doctor/settings/slots", label: "Booking slots", icon: Calendar, dot: "bg-teal" },
        { to: "/doctor/queue", label: "Queue", icon: ListOrdered, dot: "bg-mustard" },
        { to: "/doctor/leave", label: "My Leaves", icon: CalendarOff, dot: "bg-plum" },
      ],
    },
    {
      title: "Patients",
      items: [
        { to: "/doctor/patients", label: "Patients", icon: Users, dot: "bg-plum" },
        { to: "/doctor/encounters", label: "Encounters", icon: FileText, dot: "bg-teal" },
      ],
    },
    {
      title: "Orders",
      items: [
        { to: "/doctor/orders", label: "Lab orders", icon: TestTube, dot: "bg-teal" },
        { to: "/doctor/prescriptions", label: "Prescriptions", icon: Pill, dot: "bg-mustard" },
        { to: "/doctor/results", label: "Results", icon: FlaskConical, dot: "bg-clay" },
      ],
    },
  ],
  searchPlaceholder: "Search patient, MRN…",
  staff: { name: "Tyra Dhillon", role: "General Physician", initials: "TD" },
  titleFromPath: (pathname) => {
    if (pathname === "/doctor" || pathname === "/doctor/")
      return { eyebrow: "Today", title: "Doctor dashboard" };
    if (pathname.startsWith("/doctor/schedule"))
      return { eyebrow: "Calendar", title: "My schedule" };
    if (pathname.startsWith("/doctor/settings/slots"))
      return { eyebrow: "Clinic", title: "Time slots" };
    if (pathname.startsWith("/doctor/queue"))
      return { eyebrow: "Live", title: "Consultation queue" };
    if (pathname.startsWith("/doctor/patients"))
      return { eyebrow: "Records", title: "My patients" };
    if (pathname.startsWith("/doctor/encounters"))
      return { eyebrow: "Clinical", title: "Encounters" };
    if (pathname.startsWith("/doctor/orders"))
      return { eyebrow: "Diagnostics", title: "Lab orders" };
    if (pathname.startsWith("/doctor/prescriptions"))
      return { eyebrow: "Pharmacy", title: "E-prescriptions" };
    if (pathname.startsWith("/doctor/results"))
      return { eyebrow: "Diagnostics", title: "Lab results" };
    if (pathname.startsWith("/doctor/leave"))
      return { eyebrow: "HR", title: "My leaves" };
    return { eyebrow: "Doctor", title: "Clinic" };
  },
};
