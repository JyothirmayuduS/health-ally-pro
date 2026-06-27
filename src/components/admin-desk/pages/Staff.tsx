import { useState, useMemo } from "react";
import { useAdminStore, type ExtendedStaffMember, type Role } from "@/lib/admin-desk/store";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";
import { Plus, Search, Edit2, ShieldAlert, Download, X, Check, EyeOff } from "lucide-react";

export default function AdminStaff() {
  const { staff, updateStaff } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingStaff, setEditingStaff] = useState<ExtendedStaffMember | null>(null);

  // Form states for creating/editing staff
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formRole, setFormRole] = useState<Role>("Read Only");
  const [formShift, setFormShift] = useState<"morning" | "afternoon" | "night" | "rotational">("morning");

  // Get unique departments/roles for filters
  const departments = useMemo(() => {
    const list = staff?.map((s) => s.department).filter(Boolean) ?? [];
    return ["All", ...Array.from(new Set(list))];
  }, [staff]);

  const roles = useMemo(() => {
    const list = staff?.map((s) => s.roleFull).filter(Boolean) ?? [];
    return ["All", ...Array.from(new Set(list))];
  }, [staff]);

  // Statistics
  const totalStaffCount = staff?.length ?? 0;
  const activeStaffCount = staff?.filter((s) => s.active).length ?? 0;
  const inactiveStaffCount = totalStaffCount - activeStaffCount;

  // Filter/Sort logic
  const filteredStaff = useMemo(() => {
    return (staff ?? [])
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.employeeId && s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = deptFilter === "All" || s.department === deptFilter;
        const matchesRole = roleFilter === "All" || s.roleFull === roleFilter;
        return matchesSearch && matchesDept && matchesRole;
      });
  }, [staff, searchTerm, deptFilter, roleFilter]);

  const handleEditClick = (s: ExtendedStaffMember) => {
    setEditingStaff(s);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone ?? "");
    setFormDept(s.department);
    setFormDesignation(s.designation ?? "");
    setFormRole(s.roleFull ?? "Read Only");
    setFormShift(s.shift ?? "morning");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    updateStaff(editingStaff.id, {
      name: formName,
      email: formEmail,
      phone: formPhone,
      department: formDept,
      designation: formDesignation,
      roleFull: formRole,
      shift: formShift,
      // Map back plain role field
      role: formRole === "Hospital Admin" ? "Hospital admin" : formRole.toLowerCase(),
    });

    setEditingStaff(null);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateStaff(id, { active: !currentStatus });
  };

  const exportCSV = () => {
    const headers = ["Employee ID", "Name", "Designation", "Department", "Role", "Email", "Phone", "Shift", "Status"];
    const rows = filteredStaff.map((s) => [
      s.employeeId ?? "",
      s.name,
      s.designation ?? s.role,
      s.department,
      s.roleFull ?? "",
      s.email,
      s.phone ?? "",
      s.shift ?? "",
      s.active ? "Active" : "Inactive",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "staff_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" data-testid="admin-staff">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Total Directory</div>
          <div className="mt-1 text-3xl font-heading font-semibold text-plum">{totalStaffCount} members</div>
        </div>
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Active Duty</div>
          <div className="mt-1 text-3xl font-heading font-semibold text-teal">{activeStaffCount} active</div>
        </div>
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Deactivated</div>
          <div className="mt-1 text-3xl font-heading font-semibold text-clay">{inactiveStaffCount} suspended</div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-bone/30 p-4 border border-ink-100 rounded-lg surface">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, email or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border-stone-300 pl-9 text-[13px] focus:ring-plum focus:border-plum"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
          >
            <option value="All">All Departments</option>
            {departments.filter((d) => d !== "All").map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
          >
            <option value="All">All Roles</option>
            {roles.filter((r) => r !== "All").map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCSV}
          className="rounded-md border border-ink-100 bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-bone transition flex items-center gap-1.5"
        >
          <Download className="h-4 w-4 text-ink-500" />
          Export CSV
        </button>
      </div>

      {/* Directory Table */}
      <div className="surface overflow-hidden">
        <DeskPanel title={`Filtered Staff Directory · ${filteredStaff.length}`}>
          <div className="overflow-x-auto">
            <DeskTable>
              <DeskThead>
                <DeskTh>Employee ID</DeskTh>
                <DeskTh>Name</DeskTh>
                <DeskTh>Designation / Dept</DeskTh>
                <DeskTh>Security Role</DeskTh>
                <DeskTh>Contact & Shift</DeskTh>
                <DeskTh>Status</DeskTh>
                <DeskTh className="text-right">Actions</DeskTh>
              </DeskThead>
              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 hover:bg-bone/20 text-[13px]">
                    <td className="px-4 py-3 font-mono font-medium text-[12px] text-ink-500">{s.employeeId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-950">{s.name}</div>
                      <div className="text-[11px] text-ink-400 font-mono">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-800">{s.designation ?? s.role}</div>
                      <div className="text-[11px] text-ink-400">{s.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded bg-plum-soft px-2 py-0.5 text-[10px] font-semibold text-plum uppercase">
                        {s.roleFull ?? "Staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px]">{s.phone ?? "—"}</div>
                      <div className="text-[11.5px] text-ink-500 capitalize">{s.shift ?? "morning"} Shift</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase ${
                          s.active
                            ? "bg-status-doneBg text-status-doneText"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(s)}
                          className="p-1 hover:bg-plum-soft text-plum rounded transition"
                          title="Edit Directory Info"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(s.id, s.active)}
                          className={`p-1 rounded transition ${
                            s.active ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"
                          }`}
                          title={s.active ? "Deactivate / Suspend" : "Activate"}
                        >
                          {s.active ? <EyeOff className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DeskTable>
          </div>
        </DeskPanel>
      </div>

      {/* Edit Directory Info Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="surface max-w-md w-full overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-ink-100 px-6 py-4 flex items-center justify-between bg-bone/20">
              <h3 className="font-heading font-semibold text-ink-950">Modify Staff Directory Details</h3>
              <button type="button" onClick={() => setEditingStaff(null)} className="text-ink-400 hover:text-ink-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="block text-[11.5px] uppercase font-mono text-ink-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Department</label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Designation</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">RBAC Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as Role)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Hospital Admin">Hospital Admin</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Lab Supervisor">Lab Supervisor</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Billing Staff">Billing Staff</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Read Only">Read Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Scheduled Shift</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  >
                    <option value="morning">Morning Shift</option>
                    <option value="afternoon">Afternoon Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="rotational">Rotational</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-ink-100 px-6 py-4 flex justify-end gap-2 shrink-0 bg-bone/20">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-700 bg-white hover:bg-bone transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white hover:bg-plum-soft hover:text-plum transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
