// Admin / Team management — supervisor only
import { useEffect, useState } from "react";
import { listUsers, updateUserRole } from "@/lab/api";
import { useAuth } from "@/lab/auth";
import { SectionLabel } from "@/lab/components/Pills";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "lab_supervisor", label: "Lab Supervisor" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "doctor", label: "Doctor" },
  { value: "receptionist", label: "Receptionist" },
];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => listUsers().then((u) => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { reload(); }, []);

  const onChange = async (uid, role) => {
    if (uid === me?.user_id && role !== "lab_supervisor") {
      toast.error("You cannot remove yourself from Lab Supervisor — pick another supervisor first.");
      return;
    }
    try {
      await updateUserRole(uid, role);
      toast.success("Role updated");
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update role");
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-users">
      <SectionLabel action={<div className="text-xs font-mono uppercase tracking-wider text-stone-500">{users.length} staff</div>}>
        Team &amp; roles
      </SectionLabel>

      <div className="bg-[var(--sage-50)] border border-[var(--sage-100)] rounded-xl p-4 flex items-start gap-3" data-testid="rbac-note">
        <ShieldCheck className="h-5 w-5 text-[var(--sage-700)] mt-0.5" />
        <div className="text-sm text-[var(--sage-900)]">
          <b>Role-based access</b> determines which portal each user lands on after sign-in. Supervisors retain full lab access; doctors place orders &amp; view their patients&apos; results; receptionists register walk-ins; technicians work the bench but can&apos;t validate.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-stone-500">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={4} className="px-4 py-8 text-center text-stone-500">Loading…</td></tr>)}
            {users.map((u) => (
              <tr key={u.user_id} data-testid={`user-${u.user_id}`} className={cn("border-b border-stone-100", u.user_id === me?.user_id && "bg-[var(--sage-50)]/40")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.picture ? (
                      <img src={u.picture} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[var(--sage-100)] flex items-center justify-center text-[11px] font-semibold text-[var(--sage-900)]">
                        {u.name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{u.name} {u.user_id === me?.user_id && <span className="text-xs font-mono text-[var(--sage-700)]">· you</span>}</div>
                      <div className="text-[11px] font-mono text-stone-500">{u.user_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Select value={u.role} onValueChange={(v) => onChange(u.user_id, v)}>
                    <SelectTrigger className="w-48 border-stone-200" data-testid={`role-select-${u.user_id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-stone-600 text-xs font-mono">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
