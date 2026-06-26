import { useMemo, useState } from "react";
import type { LabCatalogItem } from "@/lib/lab-desk/mockData";
import { SECTIONS } from "@/lib/lab-desk/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Plus, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  catalog: LabCatalogItem[];
  onUpdatePrice: (code: string, price: number) => void;
  onAddTest?: (item: LabCatalogItem) => void;
  mode?: "admin" | "lab";
};

export default function LabCatalogEditor({ catalog, onUpdatePrice, onAddTest, mode = "lab" }: Props) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");
  const [editCode, setEditCode] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [newTest, setNewTest] = useState<Partial<LabCatalogItem>>({
    code: "",
    name: "",
    section: "biochemistry",
    sample_type: "Serum",
    tube: "Gold (SST)",
    tat_hours: 4,
    fasting: false,
    price: 0,
    parameters: [],
  });

  const filtered = useMemo(
    () =>
      catalog.filter((t) => {
        if (section !== "all" && t.section !== section) return false;
        if (!q) return true;
        const ql = q.toLowerCase();
        return t.name.toLowerCase().includes(ql) || t.code.toLowerCase().includes(ql);
      }),
    [catalog, q, section],
  );

  function openEdit(code: string) {
    const item = catalog.find((t) => t.code === code);
    if (!item) return;
    setEditCode(code);
    setPriceDraft(item.price);
  }

  function savePrice() {
    if (!editCode) return;
    onUpdatePrice(editCode, priceDraft);
    setEditCode(null);
  }

  function submitNew() {
    if (!onAddTest || !newTest.code || !newTest.name) return;
    onAddTest({
      code: newTest.code.toUpperCase(),
      name: newTest.name,
      section: newTest.section ?? "biochemistry",
      sample_type: newTest.sample_type ?? "Serum",
      tube: newTest.tube ?? "Gold (SST)",
      tat_hours: newTest.tat_hours ?? 4,
      fasting: Boolean(newTest.fasting),
      price: Number(newTest.price) || 0,
      parameters: newTest.parameters ?? [],
    });
    setAddOpen(false);
    setNewTest({
      code: "",
      name: "",
      section: "biochemistry",
      sample_type: "Serum",
      tube: "Gold (SST)",
      tat_hours: 4,
      fasting: false,
      price: 0,
      parameters: [],
    });
  }

  return (
    <div className="space-y-5" data-testid="lab-catalog-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-500">
          {mode === "admin"
            ? "Hospital-wide lab test catalog. Prices sync to lab desk and reception billing."
            : "Edit test prices. Changes persist in this browser."}
        </p>
        {onAddTest && (
          <Button size="sm" className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add test
          </Button>
        )}
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search tests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-ink-200 bg-white pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSection("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wider",
              section === "all" ? "bg-sage text-white" : "bg-stone-100 text-ink-600",
            )}
          >
            All
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wider",
                section === s.id ? "bg-sage text-white" : "bg-stone-100 text-ink-600",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Test</th>
              <th className="px-4 py-3 text-left">Section</th>
              <th className="px-4 py-3 text-right">TAT</th>
              <th className="px-4 py-3 text-right">Price (₹)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.code} className="border-b border-stone-100 hover:bg-stone-50/60">
                <td className="px-4 py-3 font-mono text-[12px]">{t.code}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-[12px] capitalize text-ink-500">{t.section}</td>
                <td className="px-4 py-3 text-right font-mono text-[12px]">{t.tat_hours}h</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-sage">
                  ₹{t.price.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="border-ink-200" onClick={() => openEdit(t.code)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit price
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editCode} onOpenChange={(o) => !o && setEditCode(null)}>
        <DialogContent className="max-w-sm border-ink-200">
          <DialogHeader>
            <DialogTitle>Edit test price</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              type="number"
              className="border-ink-200 pl-9"
              value={priceDraft}
              onChange={(e) => setPriceDraft(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCode(null)}>Cancel</Button>
            <Button className="btn-primary" onClick={savePrice}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg border-ink-200">
          <DialogHeader>
            <DialogTitle>Add lab test</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Code</Label>
              <Input
                className="mt-1 border-ink-200"
                value={newTest.code}
                onChange={(e) => setNewTest((p) => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1 border-ink-200"
                value={newTest.name}
                onChange={(e) => setNewTest((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Section</Label>
              <Select
                value={newTest.section}
                onValueChange={(v) => setNewTest((p) => ({ ...p, section: v }))}
              >
                <SelectTrigger className="mt-1 border-ink-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                className="mt-1 border-ink-200"
                value={newTest.price}
                onChange={(e) => setNewTest((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="btn-primary" onClick={submitNew}>Add test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
