import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2, Bell, Printer, Settings2 } from "lucide-react";

export const Route = createFileRoute("/reception/settings")({
  component: ReceptionSettings,
});

function ReceptionSettings() {
  const { refreshServiceFees } = useStore();

  return (
    <div data-testid="reception-settings" className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Configuration</div>
        <h1 className="mt-1 font-heading text-[22px] font-semibold text-ink-900">Reception desk settings</h1>
        <p className="mt-1 text-[13px] text-ink-500">Hospital front-desk preferences (mock).</p>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-sage" />
          <h2 className="font-heading font-semibold">Hospital profile</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Hospital name</Label>
            <Input className="mt-1 border-ink-200" defaultValue="Maple Hospital" />
          </div>
          <div>
            <Label className="text-xs">Desk / location</Label>
            <Input className="mt-1 border-ink-200" defaultValue="OPD Reception · Ground floor" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Address</Label>
            <Input className="mt-1 border-ink-200" defaultValue="412 Linden Way, Auckland 1010" />
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-sage" />
          <h2 className="font-heading font-semibold">Workflow</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-invoice on check-in</div>
              <div className="text-xs text-ink-400">Create consult invoice when patient checks in</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Lab orders → billing bridge</div>
              <div className="text-xs text-ink-400">Push lab charges to reception unpaid queue</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Print token on check-in</div>
              <div className="text-xs text-ink-400">Offer print dialog after token issue</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-sage" />
          <h2 className="font-heading font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Sound on new arrival</div>
            <div className="text-xs text-ink-400">Chime when scheduled patient is due</div>
          </div>
          <Switch />
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Printer className="h-4 w-4 text-sage" />
          <h2 className="font-heading font-semibold">Receipts</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Receipt header</Label>
            <Input className="mt-1 border-ink-200" defaultValue="Maple Hospital · OPD" />
          </div>
          <div>
            <Label className="text-xs">Tax label</Label>
            <Input className="mt-1 border-ink-200" defaultValue="GST 5%" />
          </div>
        </div>
        <button
          type="button"
          className="btn-outline mt-4"
          onClick={() => refreshServiceFees()}
        >
          Refresh consult fees from admin
        </button>
      </div>
    </div>
  );
}
