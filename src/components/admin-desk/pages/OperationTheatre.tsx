import { ErpStatusPill } from "@/components/hospital-erp/ErpStatusPill";
import { OT_ROOMS, OT_UTILIZATION } from "@/lib/hospital-erp-data";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export default function OperationTheatrePage() {
  return (
    <div className="space-y-6" data-testid="admin-ot">
      <div className="grid gap-4 sm:grid-cols-3">
        <DeskKpi label="OT utilization" value={`${OT_UTILIZATION}%`} accent="text-teal" />
        <DeskKpi label="Rooms occupied" value={OT_ROOMS.filter((r) => r.status === "occupied").length} accent="text-plum" />
        <DeskKpi label="Available now" value={OT_ROOMS.filter((r) => r.status === "available").length} accent="text-sage" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <DeskPanel title="Utilization gauge">
          <div className="flex flex-col items-center justify-center p-6">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: OT_UTILIZATION }, { value: 100 - OT_UTILIZATION }]}
                    innerRadius={50}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="#2C7873" />
                    <Cell fill="#EDEAE6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold text-teal">{OT_UTILIZATION}%</p>
            <p className="text-xs text-ink-400">Today&apos;s OT utilization</p>
          </div>
        </DeskPanel>

        <DeskPanel title="Theatre status">
          <ul className="divide-y divide-ink-100">
            {OT_ROOMS.map((ot) => (
              <li key={ot.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold text-ink-900">{ot.name}</p>
                  {ot.procedure && <p className="text-sm text-ink-600">{ot.procedure}</p>}
                  {ot.until && <p className="text-xs text-ink-400">Free in {ot.until}</p>}
                </div>
                <ErpStatusPill status={ot.status} />
              </li>
            ))}
          </ul>
        </DeskPanel>
      </div>
    </div>
  );
}
