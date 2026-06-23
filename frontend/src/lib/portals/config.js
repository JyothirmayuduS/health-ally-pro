// Portal navigation config — mirrors the spec's src/lib/portals/config.ts pattern.
import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  RefreshCcw,
  Boxes,
} from "lucide-react";

export const PORTALS = {
  pharmacy: {
    key: "pharmacy",
    label: "Pharmacy",
    role: "pharmacist",
    basePath: "/pharmacy",
    sections: [
      {
        label: "Overview",
        items: [
          { to: "/pharmacy",                label: "Dashboard",          icon: LayoutDashboard, end: true,  testId: "nav-dashboard" },
        ],
      },
      {
        label: "Queue",
        items: [
          { to: "/pharmacy/prescriptions",  label: "Prescriptions inbox",icon: Inbox,           testId: "nav-prescriptions" },
          { to: "/pharmacy/dispense",       label: "Dispense counter",   icon: ClipboardList,   testId: "nav-dispense" },
        ],
      },
      {
        label: "Ongoing",
        items: [
          { to: "/pharmacy/refills",        label: "Refills",            icon: RefreshCcw,      testId: "nav-refills" },
        ],
      },
      {
        label: "Stock",
        items: [
          { to: "/pharmacy/inventory",      label: "Inventory",          icon: Boxes,           testId: "nav-inventory" },
        ],
      },
    ],
  },
};
