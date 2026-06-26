import { Link } from "@tanstack/react-router";
import { Building2, Users, Stethoscope, FlaskConical, Pill, BarChart3 } from "lucide-react";
import { loadLedgerInvoices } from "@/lib/shared/billing-ledger";
import { listEncounters } from "@/lib/shared/encounters";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { DEFAULT_STAFF } from "@/lib/admin-desk/config";
import { loadServiceFees } from "@/lib/shared/services";
import { DeskKpi, DeskPanel, DeskQuickAction } from "@/components/desk-shell/ui";

export default function AdminDashboard() {
  const invoices = loadLedgerInvoices();
  const encounters = listEncounters();
  const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const doctors = loadServiceFees();

  const links = [
    { to: "/admin/hospital", label: "Hospital profile", icon: Building2 },
    { to: "/admin/staff", label: "Staff directory", icon: Users },
    { to: "/admin/doctors", label: "Doctors & fees", icon: Stethoscope },
    { to: "/admin/lab-catalog", label: "Lab catalog", icon: FlaskConical },
    { to: "/admin/pharmacy-formulary", label: "Pharmacy formulary", icon: Pill },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskKpi label="Patients" value={SHARED_PATIENTS.length} />
        <DeskKpi label="Staff" value={DEFAULT_STAFF.length} />
        <DeskKpi
          label="Collected revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          accent="text-money"
        />
        <DeskKpi label="Encounters" value={encounters.length} accent="text-plum" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <DeskQuickAction
            key={l.to}
            to={l.to}
            icon={l.icon}
            label={l.label}
            accentClass="bg-plum-soft text-plum group-hover:bg-plum group-hover:text-white"
          />
        ))}
      </div>

      <DeskPanel title="Doctors on roster">
        <ul className="divide-y divide-ink-100">
          {doctors.map((d) => (
            <li key={d.doctorId} className="flex items-center justify-between px-5 py-3 text-[13px]">
              <div>
                <span className="font-medium">{d.doctorName}</span>
                <span className="ml-2 text-ink-400">{d.specialty}</span>
              </div>
              <span className="font-mono text-money">₹{d.fee.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink-200 px-5 py-3 text-right">
          <Link to="/admin/services" className="text-[12px] font-medium text-plum hover:underline">
            Edit consultation fees →
          </Link>
        </div>
      </DeskPanel>
    </div>
  );
}
