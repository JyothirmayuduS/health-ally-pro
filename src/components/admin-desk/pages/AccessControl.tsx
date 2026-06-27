import { useState } from "react";
import { useAdminStore, type Role, type RolePermissions } from "@/lib/admin-desk/store";
import { Shield, Key, LogOut, X } from "lucide-react";

export default function AdminAccessControl() {
  const { rolePermissions, sessions, forceLogout } = useAdminStore();
  const [activeTab, setActiveTab] = useState<"roles" | "sessions">("roles");
  const [editingRole, setEditingRole] = useState<RolePermissions | null>(null);

  // Quick summary numbers
  const totalRoles = rolePermissions?.length ?? 0;
  const activeSessionsCount = sessions?.length ?? 0;

  const handleForceLogout = (id: string) => {
    forceLogout(id);
  };

  return (
    <div className="space-y-6" data-testid="admin-access-control">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Defined Roles</div>
            <div className="mt-1 text-3xl font-heading font-semibold text-plum">{totalRoles}</div>
            <div className="text-[11px] text-ink-400 mt-1">Configured RBAC mappings</div>
          </div>
          <div className="h-10 w-10 rounded bg-plum-soft text-plum grid place-items-center">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="surface px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Active Sessions</div>
            <div className="mt-1 text-3xl font-heading font-semibold text-teal">{activeSessionsCount}</div>
            <div className="text-[11px] text-ink-400 mt-1">Users online across all modules</div>
          </div>
          <div className="h-10 w-10 rounded bg-teal-soft text-teal grid place-items-center">
            <Key className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-ink-100 bg-bone/60 p-1">
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
            activeTab === "roles" ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          Staff Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
            activeTab === "sessions" ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          Active Sessions ({activeSessionsCount})
        </button>
      </div>

      {activeTab === "roles" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 flex items-center justify-between bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">RBAC Matrix</span>
            <span className="text-[11px] text-ink-400">Role-Based Access Control configuration</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead className="border-b border-ink-100 bg-bone/40 font-mono">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Role</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Reception Desk</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Lab Desk</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Pharmacy Desk</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">IPD Ward</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Admin Desk</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rolePermissions?.map((rp) => {
                  const checkCount = (obj: Record<string, boolean>) => Object.values(obj).filter(Boolean).length;
                  const totalCount = (obj: Record<string, boolean>) => Object.keys(obj).length;

                  return (
                    <tr key={rp.role} className="hover:bg-bone/20">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink-950">{rp.role}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-ink-500 font-mono">
                          {checkCount(rp.permissions.reception)}/{totalCount(rp.permissions.reception)} actions
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-ink-500 font-mono">
                          {checkCount(rp.permissions.lab)}/{totalCount(rp.permissions.lab)} actions
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-ink-500 font-mono">
                          {checkCount(rp.permissions.pharmacy)}/{totalCount(rp.permissions.pharmacy)} actions
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-ink-500 font-mono">
                          {checkCount(rp.permissions.ipd)}/{totalCount(rp.permissions.ipd)} actions
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-ink-500 font-mono">
                          {checkCount(rp.permissions.admin)}/{totalCount(rp.permissions.admin)} actions
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setEditingRole(JSON.parse(JSON.stringify(rp)))}
                          className="text-[12px] text-plum hover:underline"
                        >
                          Modify Permissions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 flex items-center justify-between bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 text-teal">Active User Sessions</span>
            <span className="text-[11px] text-ink-400">Force termination available for audit/incident response</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead className="border-b border-ink-100 bg-bone/40 font-mono">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">User</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Role</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Module Access</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Login Time</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Last Active</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {sessions?.map((session) => (
                  <tr key={session.id} className="hover:bg-bone/20">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-950">{session.name}</div>
                      <div className="text-[10px] text-ink-400 font-mono">{session.id}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{session.role}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono font-medium text-ink-700">
                        {session.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-ink-500">
                      {new Date(session.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-ink-500">
                      {new Date(session.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleForceLogout(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors inline-flex items-center gap-1 text-[12px] font-medium"
                        title="Force logout"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Force Logout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editing Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="surface max-w-lg w-full overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-ink-950">Modify Permissions</h3>
                <p className="text-[12px] text-ink-400 font-mono mt-0.5">Role: {editingRole.role}</p>
              </div>
              <button onClick={() => setEditingRole(null)} className="text-ink-400 hover:text-ink-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {(Object.keys(editingRole.permissions) as Array<keyof typeof editingRole.permissions>).map((module) => (
                <div key={module} className="space-y-2 border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-plum capitalize">{module} Desk</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(editingRole.permissions[module]).map((permission) => {
                      const typedPermission = permission as keyof typeof editingRole.permissions[typeof module];
                      const isChecked = editingRole.permissions[module][typedPermission] as boolean;
                      return (
                        <label key={permission} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = { ...editingRole };
                              (updated.permissions[module] as any)[permission] = e.target.checked;
                              setEditingRole(updated);
                            }}
                            className="rounded border-stone-300 text-plum focus:ring-plum"
                          />
                          <span className="text-[12px] text-ink-700 capitalize">
                            {permission.replace(/([A-Z])/g, " $1")}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-100 px-6 py-4 flex justify-end gap-2 shrink-0 bg-bone/20">
              <button
                onClick={() => setEditingRole(null)}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-700 bg-white hover:bg-bone transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditingRole(null);
                }}
                className="rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white hover:bg-plum-soft hover:text-plum transition"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
