import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Pill,
  Package,
  RefreshCw,
  Briefcase,
  Search,
  Map,
  Activity,
  ShieldAlert,
  Receipt,
  BedDouble,
  Store,
  BookOpen,
  ClipboardCheck,
  ShoppingCart,
} from "lucide-react";

export type PharmacyCountKey =
  | "inbox"
  | "dispense"
  | "pickup"
  | "refills"
  | "lowStock"
  | "hold"
  | "ward"
  | "alerts"
  | "billing";

export type PharmacyNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  countKey?: PharmacyCountKey;
  urgentBadge?: boolean;
};

export type PharmacyNavSection = {
  title: string;
  items: PharmacyNavLink[];
};

export const PHARMACY_NAV: PharmacyNavSection[] = [
  {
    title: "Overview",
    items: [{ to: "/pharmacy", label: "Control desk", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Queue",
    items: [
      { to: "/pharmacy/prescriptions", label: "Prescriptions inbox", icon: Pill, countKey: "inbox", urgentBadge: true },
      { to: "/pharmacy/billing", label: "Billing counter", icon: Receipt, countKey: "billing", urgentBadge: true },
      { to: "/pharmacy/dispense", label: "Dispense counter", icon: Package, countKey: "dispense" },
      { to: "/pharmacy/ward", label: "Ward deliveries", icon: BedDouble, countKey: "ward", urgentBadge: true },
      { to: "/pharmacy/refills", label: "Refills", icon: RefreshCw, countKey: "refills" },
      { to: "/pharmacy/walk-in", label: "Walk-in OTC", icon: Store },
    ],
  },
  {
    title: "Stock",
    items: [
      { to: "/pharmacy/search", label: "Medicine search", icon: Search },
      { to: "/pharmacy/inventory", label: "Inventory", icon: Briefcase, countKey: "lowStock" },
      { to: "/pharmacy/purchase-orders", label: "Purchase orders", icon: ShoppingCart },
      { to: "/pharmacy/formulary", label: "Formulary & pricing", icon: BookOpen },
      { to: "/pharmacy/map", label: "Storage map", icon: Map },
      { to: "/pharmacy/cycle-count", label: "Cycle count", icon: ClipboardCheck },
    ],
  },
  {
    title: "Compliance",
    items: [
      { to: "/pharmacy/controlled", label: "Controlled register", icon: ShieldAlert },
      { to: "/pharmacy/operations", label: "Operations center", icon: Activity, countKey: "alerts", urgentBadge: true },
    ],
  },
];
