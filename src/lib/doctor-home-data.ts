import { apkTasks } from "@/lib/doctor-apk-data";
import type { ClinicOverview } from "@/lib/doctor-clinic-overview";
import {
  awaitingSignOffCount,
  getResultPatientName,
  listResultDocuments,
  type ResultDocument,
} from "@/lib/doctor-results-imaging";

export type ResultsInboxSummary = {
  awaiting: number;
  firstReview?: ResultDocument;
  headline: string;
  subline: string;
};

export function getResultsInboxSummary(): ResultsInboxSummary {
  const docs = listResultDocuments();
  const awaiting = awaitingSignOffCount(docs);
  const firstReview = docs.find((d) => d.needsReview);

  if (awaiting === 0) {
    return {
      awaiting: 0,
      headline: "Inbox clear",
      subline: "All results reviewed and filed",
    };
  }

  const patient = firstReview ? getResultPatientName(firstReview.patientId) : "";
  return {
    awaiting,
    firstReview,
    headline: `${awaiting} result${awaiting === 1 ? "" : "s"} to review`,
    subline: firstReview ? `${patient} — ${firstReview.title}` : "Open your results inbox",
  };
}

export type HomeActionItem = {
  id: string;
  kind: "urgent" | "booking" | "results" | "task";
  title: string;
  subtitle: string;
  to: string;
  search?: Record<string, unknown>;
};

export function buildHomeNextActions(overview: ClinicOverview, max = 4): HomeActionItem[] {
  const items: HomeActionItem[] = [];
  const inbox = getResultsInboxSummary();

  if (overview.urgentWaitingCount > 0) {
    items.push({
      id: "urgent-queue",
      kind: "urgent",
      title: `${overview.urgentWaitingCount} urgent in queue`,
      subtitle: "Patients flagged urgent are waiting",
      to: "/doctor/queue",
    });
  }

  if (overview.bookingCount > 0) {
    items.push({
      id: "bookings",
      kind: "booking",
      title: `${overview.bookingCount} booking request${overview.bookingCount === 1 ? "" : "s"}`,
      subtitle: "Approve to assign a queue token",
      to: "/doctor/queue",
    });
  }

  if (inbox.awaiting > 0 && inbox.firstReview) {
    items.push({
      id: "results",
      kind: "results",
      title: inbox.headline,
      subtitle: inbox.subline,
      to: "/doctor/reports",
      search: { id: inbox.firstReview.id },
    });
  }

  for (const task of apkTasks.slice(0, 2)) {
    if (items.length >= max) break;
    items.push({
      id: task.id,
      kind: "task",
      title: task.title,
      subtitle: task.due,
      to: "/doctor/patients/tasks",
    });
  }

  return items.slice(0, max);
}
