import { Link } from "@tanstack/react-router";
import { loadServiceFees } from "@/lib/shared/services";

export default function AdminDoctors() {
  const doctors = loadServiceFees();

  return (
    <div className="space-y-5" data-testid="admin-doctors">
      <div className="flex justify-end">
        <Link to="/admin/services" className="text-[13px] font-medium text-plum hover:underline">
          Edit consultation fees →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {doctors.map((d) => (
          <div key={d.doctorId} className="surface p-5 transition-colors hover:border-plum/30">
            <h2 className="font-heading font-semibold text-ink-900">{d.doctorName}</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">{d.specialty}</p>
            <p className="mt-4 font-mono text-2xl font-semibold text-money">
              ₹{d.fee.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink-400">{d.doctorId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
