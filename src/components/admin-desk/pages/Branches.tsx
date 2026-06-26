import { useState } from "react";
import { loadBranches, saveBranches, type Branch } from "@/lib/admin-desk/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GitBranch } from "lucide-react";

export default function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>(() => loadBranches());

  const save = () => {
    saveBranches(branches);
    toast.success("Branches saved");
  };

  const add = () => {
    setBranches([
      ...branches,
      { id: `BR-${branches.length + 1}`, name: "New branch", city: "", beds: 0 },
    ]);
  };

  return (
    <div className="space-y-5" data-testid="admin-branches">
      <div className="flex justify-end">
        <Button variant="outline" className="border-ink-200 bg-white" onClick={add}>
          Add branch
        </Button>
      </div>
      <div className="space-y-3">
        {branches.map((b, i) => (
          <div key={b.id} className="surface grid gap-3 p-4 sm:grid-cols-4">
            <Input
              value={b.name}
              onChange={(e) => {
                const next = [...branches];
                next[i] = { ...b, name: e.target.value };
                setBranches(next);
              }}
              className="border-ink-200 bg-white"
            />
            <Input
              value={b.city}
              placeholder="City"
              onChange={(e) => {
                const next = [...branches];
                next[i] = { ...b, city: e.target.value };
                setBranches(next);
              }}
              className="border-ink-200 bg-white"
            />
            <Input
              type="number"
              value={b.beds}
              onChange={(e) => {
                const next = [...branches];
                next[i] = { ...b, beds: Number(e.target.value) };
                setBranches(next);
              }}
              className="border-ink-200 bg-white font-mono"
            />
            <div className="flex items-center gap-2 self-center font-mono text-xs text-ink-400">
              <GitBranch className="h-3.5 w-3.5" />
              {b.id}
            </div>
          </div>
        ))}
      </div>
      <Button className="btn-primary h-10" onClick={save}>
        Save branches
      </Button>
    </div>
  );
}
