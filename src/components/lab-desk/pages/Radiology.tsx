import { ErpStatusPill } from "@/components/hospital-erp/ErpStatusPill";
import { IMAGING_ORDERS } from "@/lib/hospital-erp-data";
import { DeskKpi, DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";

export default function RadiologyPage() {
  const completed = IMAGING_ORDERS.filter((o) => o.status === "completed").length;
  const inProgress = IMAGING_ORDERS.filter((o) => o.status === "in-progress").length;
  const upcoming = IMAGING_ORDERS.filter((o) => o.status === "upcoming").length;

  return (
    <div className="space-y-6" data-testid="lab-radiology">
      <div className="grid gap-4 sm:grid-cols-3">
        <DeskKpi label="Scans today" value={IMAGING_ORDERS.length} accent="text-teal" />
        <DeskKpi label="In progress" value={inProgress} accent="text-plum" />
        <DeskKpi label="Completed" value={completed} accent="text-sage" />
      </div>

      <DeskPanel title="Imaging orders">
        <DeskTable>
          <DeskThead>
            <DeskTh>Study</DeskTh>
            <DeskTh>Patient</DeskTh>
            <DeskTh>Modality</DeskTh>
            <DeskTh>Status</DeskTh>
          </DeskThead>
          <tbody>
            {IMAGING_ORDERS.map((o) => (
              <tr key={o.id} className="border-b border-stone-100 hover:bg-bone/50">
                <td className="px-4 py-3 font-medium">{o.study}</td>
                <td className="px-4 py-3">
                  <div>{o.patient}</div>
                  <div className="text-[11px] text-ink-400">{o.mrn}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{o.modality}</td>
                <td className="px-4 py-3">
                  <ErpStatusPill status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>

      <p className="text-sm text-ink-500">
        {upcoming} scan(s) scheduled. PACS integration and radiologist reporting can be linked from the doctor results inbox.
      </p>
    </div>
  );
}
