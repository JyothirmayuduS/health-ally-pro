import { useState } from "react";
import { loadDepartments, saveDepartments, type Department } from "@/lib/admin-desk/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>(() => loadDepartments());

  const save = () => {
    saveDepartments(departments);
    toast.success("Departments saved");
  };

  return (
    <div className="space-y-5" data-testid="admin-departments">
      <DeskPanel title="Clinical units">
        <DeskTable>
          <DeskThead>
            <DeskTh>Department</DeskTh>
            <DeskTh>Head</DeskTh>
            <DeskTh>Floor</DeskTh>
          </DeskThead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.id} className="border-b border-stone-100">
                <td className="px-4 py-3">
                  <Input
                    value={d.name}
                    onChange={(e) => {
                      const next = [...departments];
                      next[i] = { ...d, name: e.target.value };
                      setDepartments(next);
                    }}
                    className="h-8 border-ink-200 bg-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={d.head}
                    onChange={(e) => {
                      const next = [...departments];
                      next[i] = { ...d, head: e.target.value };
                      setDepartments(next);
                    }}
                    className="h-8 border-ink-200 bg-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={d.floor}
                    onChange={(e) => {
                      const next = [...departments];
                      next[i] = { ...d, floor: e.target.value };
                      setDepartments(next);
                    }}
                    className="h-8 w-20 border-ink-200 bg-white font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
      <Button className="btn-primary h-10" onClick={save}>
        Save departments
      </Button>
    </div>
  );
}
