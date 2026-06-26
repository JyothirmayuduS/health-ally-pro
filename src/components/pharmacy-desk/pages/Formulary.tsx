import { useMemo, useState } from "react";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { SectionLabel, EmptyState, LocationChip } from "@/components/pharmacy-desk/Pills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  GST_OPTIONS,
  fmtMargin,
  marginPercent,
  unitLabel,
  type DrugPricingPatch,
} from "@/lib/pharmacy-desk/formulary";
import { fmtInr } from "@/lib/pharmacy-desk/billing";
import type { Drug } from "@/lib/pharmacy-desk/mockData";
import { BookOpen, IndianRupee, Pencil, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Admin maintains hospital-wide formulary; pharmacy staff can view and adjust selling prices. */
  mode?: "admin" | "pharmacy";
};

export default function Formulary({ mode = "pharmacy" }: Props) {
  const { drugs, updateDrugPricing, addDrug } = usePharmacyStore();
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [editDrug, setEditDrug] = useState<Drug | null>(null);
  const [draft, setDraft] = useState<DrugPricingPatch>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newDrug, setNewDrug] = useState({
    generic_name: "",
    strength: "",
    form: "Tablet",
    unit_price: 10,
  });

  const filtered = useMemo(() => {
    return drugs.filter((d) => {
      if (zoneFilter !== "all" && d.location.zone !== zoneFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return [d.generic_name, ...d.brand_names, d.sku, d.strength].join(" ").toLowerCase().includes(q);
    });
  }, [drugs, query, zoneFilter]);

  function openEdit(drug: Drug) {
    setEditDrug(drug);
    setDraft({
      unit_price: drug.unit_price,
      purchase_cost: drug.purchase_cost,
      pack_size: drug.pack_size,
      pack_mrp: drug.pack_mrp,
      gst_rate: drug.gst_rate,
      reorder_level: drug.reorder_level,
    });
  }

  function savePricing() {
    if (!editDrug) return;
    updateDrugPricing(editDrug.id, draft);
    setEditDrug(null);
  }

  const draftUnit = draft.unit_price ?? editDrug?.unit_price ?? 0;
  const draftCost = draft.purchase_cost ?? editDrug?.purchase_cost ?? 0;
  const draftPack = draft.pack_size ?? editDrug?.pack_size ?? 10;

  return (
    <div className="space-y-5" data-testid="pharmacy-formulary">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>
          {mode === "admin" ? "Hospital formulary" : "Formulary & pricing"}
        </SectionLabel>
        <p className="max-w-md text-[12px] text-ink-500">
          {mode === "admin"
            ? "Set MRP, cost, pack size, and GST for every medicine. Changes apply to pharmacy billing immediately."
            : "Selling prices feed Rx billing and walk-in OTC. Purchase cost is updated when stock is received."}
        </p>
      </div>

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search medicine, SKU, strength…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-ink-200 bg-white pl-9"
          />
        </div>
        {(["all", "main", "cold", "controlled", "otc"] as const).map((z) => (
          <Button
            key={z}
            size="sm"
            variant={zoneFilter === z ? "default" : "outline"}
            className={zoneFilter === z ? "btn-primary" : "border-ink-200"}
            onClick={() => setZoneFilter(z)}
          >
            {z === "all" ? "All" : z}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto border-ink-200" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add medicine
        </Button>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
              <th className="px-4 py-3 text-left">Medicine</th>
              <th className="px-4 py-3 text-left">Pack</th>
              <th className="px-4 py-3 text-right">Cost / unit</th>
              <th className="px-4 py-3 text-right">Sell / unit</th>
              <th className="px-4 py-3 text-right">Margin</th>
              <th className="px-4 py-3 text-center">GST</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={BookOpen} title="No medicines" hint="Adjust search or filters." />
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-b border-stone-100 hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">
                      {d.generic_name} {d.strength}
                    </div>
                    <div className="font-mono text-[11px] text-ink-400">{d.sku} · {d.form}</div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-600">
                    {d.pack_size} / pack
                    <div className="font-mono text-[11px] text-ink-400">MRP {fmtInr(d.pack_mrp ?? 0)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px]">
                    {fmtInr(d.purchase_cost ?? 0)}
                    <div className="text-[10px] text-ink-400">{unitLabel(d.form)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold text-sage">
                    {fmtInr(d.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-[12px] font-medium",
                        marginPercent(d.unit_price, d.purchase_cost ?? 0) >= 20
                          ? "text-sage"
                          : "text-mustard",
                      )}
                    >
                      {fmtMargin(d)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[12px]">{d.gst_rate ?? 5}%</td>
                  <td className="px-4 py-3">
                    <LocationChip location={d.location} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="border-ink-200" onClick={() => openEdit(d)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editDrug} onOpenChange={(o) => !o && setEditDrug(null)}>
        <DialogContent className="max-w-lg border-ink-200">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit pricing</DialogTitle>
            <DialogDescription>
              {editDrug?.generic_name} {editDrug?.strength} — {editDrug?.form}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Selling price {unitLabel(editDrug?.form ?? "unit")}</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  type="number"
                  step="0.01"
                  className="border-ink-200 pl-9"
                  value={draft.unit_price ?? ""}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, unit_price: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase cost {unitLabel(editDrug?.form ?? "unit")}</Label>
              <Input
                type="number"
                step="0.01"
                className="border-ink-200"
                value={draft.purchase_cost ?? ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, purchase_cost: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pack size (units)</Label>
              <Input
                type="number"
                className="border-ink-200"
                value={draft.pack_size ?? ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pack_size: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pack MRP</Label>
              <Input
                type="number"
                step="0.01"
                className="border-ink-200"
                value={draft.pack_mrp ?? ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pack_mrp: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>GST rate</Label>
              <Select
                value={String(draft.gst_rate ?? editDrug?.gst_rate ?? 5)}
                onValueChange={(v) => setDraft((p) => ({ ...p, gst_rate: Number(v) as 0 | 5 | 12 | 18 }))}
              >
                <SelectTrigger className="border-ink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={String(g.value)}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reorder level</Label>
              <Input
                type="number"
                className="border-ink-200"
                value={draft.reorder_level ?? ""}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, reorder_level: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-sage/20 bg-sage-soft/30 px-4 py-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-600">Margin</span>
              <span className="font-mono font-semibold text-sage">
                {marginPercent(draftUnit, draftCost)}%
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[12px] text-ink-500">
              <span>Auto pack MRP</span>
              <span className="font-mono">{fmtInr(Math.round(draftUnit * draftPack * 100) / 100)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDrug(null)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={savePricing}>
              Save pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md border-ink-200">
          <DialogHeader>
            <DialogTitle>Add medicine to formulary</DialogTitle>
            <DialogDescription>New entries appear in inventory search and walk-in OTC.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Generic name</Label>
              <Input
                className="mt-1 border-ink-200"
                value={newDrug.generic_name}
                onChange={(e) => setNewDrug((p) => ({ ...p, generic_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Strength</Label>
                <Input
                  className="mt-1 border-ink-200"
                  value={newDrug.strength}
                  onChange={(e) => setNewDrug((p) => ({ ...p, strength: e.target.value }))}
                  placeholder="500 mg"
                />
              </div>
              <div>
                <Label>Form</Label>
                <Select
                  value={newDrug.form}
                  onValueChange={(v) => setNewDrug((p) => ({ ...p, form: v }))}
                >
                  <SelectTrigger className="mt-1 border-ink-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Suspension">Suspension</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Unit price (₹)</Label>
              <Input
                type="number"
                className="mt-1 border-ink-200"
                value={newDrug.unit_price}
                onChange={(e) => setNewDrug((p) => ({ ...p, unit_price: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="btn-primary"
              disabled={!newDrug.generic_name || !newDrug.strength}
              onClick={() => {
                addDrug(newDrug);
                setAddOpen(false);
                setNewDrug({ generic_name: "", strength: "", form: "Tablet", unit_price: 10 });
              }}
            >
              Add to formulary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
