import { LAB_DEMO_CREDENTIALS } from "@/lib/supabase/auth";
import { STAFF } from "@/lib/lab-desk/mockData";
import { SectionLabel } from "@/components/lab-desk/Pills";
import { ShieldCheck } from "lucide-react";

const PORTAL_USERS = [
  ...Object.entries(LAB_DEMO_CREDENTIALS).map(([email, cred]) => ({
    id: cred.userId,
    name: cred.fullName,
    email,
    role: cred.roles[0]?.replace("_", " ") ?? "staff",
  })),
  ...STAFF.map((s) => ({
    id: s.id,
    name: s.name,
    email: "—",
    role: s.role.replace("_", " "),
  })),
];

export default function Team() {
  return (
    <div className="space-y-6" data-testid="lab-team">
      <SectionLabel
        action={
          <div className="font-mono text-xs uppercase tracking-wider text-ink-400">
            {PORTAL_USERS.length} staff
          </div>
        }
      >
        Team &amp; roles
      </SectionLabel>

      <div className="flex items-start gap-3 rounded-xl border border-sage-soft bg-sage-soft/40 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
        <p className="text-[13px] text-ink-600">
          <strong className="text-ink-900">Role-based access</strong> controls portal access after
          sign-in. Supervisors validate and release results; technicians collect and process at the
          bench.
        </p>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="border-b border-ink-200 bg-bone/60">
            <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Shift</th>
            </tr>
          </thead>
          <tbody>
            {PORTAL_USERS.map((u) => {
              const staffRow = STAFF.find((s) => s.id === u.id);
              return (
                <tr key={u.id} className="border-b border-ink-200/80 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-ink-600">{u.role}</td>
                  <td className="px-4 py-3 text-ink-400">{staffRow?.shift ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
