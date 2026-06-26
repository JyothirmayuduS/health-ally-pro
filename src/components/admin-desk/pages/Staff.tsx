import { DEFAULT_STAFF } from "@/lib/admin-desk/config";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";

export default function AdminStaff() {
  return (
    <div data-testid="admin-staff">
    <DeskPanel title={`Staff directory · ${DEFAULT_STAFF.length}`}>
      <DeskTable>
        <DeskThead>
          <DeskTh>Name</DeskTh>
          <DeskTh>Role</DeskTh>
          <DeskTh>Department</DeskTh>
          <DeskTh>Email</DeskTh>
          <DeskTh>Status</DeskTh>
        </DeskThead>
        <tbody>
          {DEFAULT_STAFF.map((s) => (
            <tr key={s.id} className="border-b border-stone-100 hover:bg-bone/40">
              <td className="px-4 py-3 font-medium">{s.name}</td>
              <td className="px-4 py-3 text-ink-600">{s.role}</td>
              <td className="px-4 py-3 text-ink-500">{s.department}</td>
              <td className="px-4 py-3 font-mono text-[11px]">{s.email}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    s.active
                      ? "rounded-sm bg-status-doneBg px-2 py-0.5 text-[10px] font-medium uppercase text-status-doneText"
                      : "text-ink-400"
                  }
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </DeskTable>
    </DeskPanel>
    </div>
  );
}
