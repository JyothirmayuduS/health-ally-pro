import { ResultsImagingScreen } from "@/components/doctor/results/ResultsImagingScreen";
import { InboxQuickLinks } from "@/components/doctor/InboxQuickLinks";

export function DoctorInboxWorkspace({ selectedResultId }: { selectedResultId?: string }) {
  return (
    <div className="space-y-3">
      <InboxQuickLinks />
      <ResultsImagingScreen selectedId={selectedResultId} />
    </div>
  );
}
