import { ALERT_TIER_ORDER, type AlertTier } from "@/lib/doctor-alert-tiers";
import { computeClinicOverview, panelCounts } from "@/lib/doctor-clinic-overview";
import { PANEL_PATIENTS, PANEL_TASKS } from "@/lib/doctor-patients-apk-data";
import type { LiveQueueState } from "@/lib/doctor-live-queue";
import { getQueuePatient } from "@/lib/doctor-live-queue";
import { awaitingSignOffCount, listResultDocuments } from "@/lib/doctor-results-imaging";
import { referralsAwaitingCount, unreadNotificationCount } from "@/lib/doctor-profile-store";
import { getProfileStore } from "@/lib/doctor-profile-store";
import { listPanelAdherenceAlerts } from "@/lib/shared/adherence-triage";

export type WorkQueueItem = {
  id: string;
  tier: AlertTier;
  title: string;
  subtitle?: string;
  to: string;
  search?: Record<string, string | undefined>;
  params?: Record<string, string>;
};

function pushUnique(items: WorkQueueItem[], item: WorkQueueItem) {
  if (!items.some((x) => x.id === item.id)) items.push(item);
}

/** Single severity-sorted authoritative work queue */
export function buildAuthoritativeWorkQueue(
  queueState: LiveQueueState,
  nowMs = Date.now(),
): WorkQueueItem[] {
  const items: WorkQueueItem[] = [];
  const overview = computeClinicOverview(queueState, nowMs);
  const store = getProfileStore();

  const adherenceAlerts = listPanelAdherenceAlerts(nowMs);
  for (const alert of adherenceAlerts.slice(0, 3)) {
    pushUnique(items, {
      id: `adherence-${alert.panelPatientId}-${alert.tier}`,
      tier: alert.tier === "critical" ? "critical" : "warn",
      title: alert.label,
      subtitle: `${alert.patientName} · ${alert.detail}`,
      to: "/doctor/patients/$patientId",
      params: { patientId: alert.panelPatientId },
    });
  }

  const docs = listResultDocuments();
  const criticalReview = docs.filter(
    (d) => d.needsReview && d.analytes?.some((a) => a.flag === "Critical"),
  );
  if (criticalReview.length > 0) {
    pushUnique(items, {
      id: "critical-results",
      tier: "critical",
      title: `${criticalReview.length} critical result${criticalReview.length > 1 ? "s" : ""} awaiting sign-off`,
      subtitle: criticalReview[0]?.title,
      to: "/doctor/reports",
      search: { tab: "results", id: criticalReview[0]?.id },
    });
  } else {
    const awaiting = awaitingSignOffCount(docs);
    if (awaiting > 0) {
      pushUnique(items, {
        id: "results-review",
        tier: "urgent",
        title: `${awaiting} result${awaiting > 1 ? "s" : ""} awaiting review`,
        to: "/doctor/reports",
        search: { tab: "results" },
      });
    }
  }

  if (overview.urgentWaitingCount > 0) {
    pushUnique(items, {
      id: "urgent-queue",
      tier: "urgent",
      title: `${overview.urgentWaitingCount} urgent patient${overview.urgentWaitingCount > 1 ? "s" : ""} in queue`,
      subtitle: "Call next from live queue",
      to: "/doctor/queue",
    });
  }

  const urgentPanel = PANEL_PATIENTS.filter((p) => p.status === "Urgent" || p.status === "Critical");
  for (const p of urgentPanel.slice(0, 2)) {
    pushUnique(items, {
      id: `urgent-panel-${p.id}`,
      tier: p.status === "Critical" ? "critical" : "urgent",
      title: p.name,
      subtitle: p.alert ?? p.condition,
      to: "/doctor/patients/$patientId",
      params: { patientId: p.id },
    });
  }

  const pendingRefs = referralsAwaitingCount();
  if (pendingRefs > 0) {
    pushUnique(items, {
      id: "referrals",
      tier: "warn",
      title: `${pendingRefs} referral${pendingRefs > 1 ? "s" : ""} awaiting action`,
      to: "/doctor/reports",
      search: { tab: "referrals" },
    });
  }

  if (overview.bookingCount > 0) {
    pushUnique(items, {
      id: "booking-requests",
      tier: "warn",
      title: `${overview.bookingCount} booking request${overview.bookingCount > 1 ? "s" : ""}`,
      subtitle: "Approve to add to queue",
      to: "/doctor/queue",
    });
  }

  const openTasks = PANEL_TASKS.filter((t) => !t.done);
  const urgentTasks = openTasks.filter((t) => t.urgent);
  for (const task of urgentTasks.slice(0, 2)) {
    pushUnique(items, {
      id: `task-${task.id}`,
      tier: "urgent",
      title: task.title,
      subtitle: `${task.patientName} · ${task.due}`,
      to: "/doctor/patients/$patientId",
      params: { patientId: task.patientId },
    });
  }
  if (openTasks.length > urgentTasks.length) {
    pushUnique(items, {
      id: "open-tasks",
      tier: "info",
      title: `${openTasks.length} open task${openTasks.length > 1 ? "s" : ""} on panel`,
      to: "/doctor/patients/tasks",
    });
  }

  if (store.away.active) {
    pushUnique(items, {
      id: "away-mode",
      tier: "warn",
      title: "Away mode active",
      subtitle: "Coverage handoff in effect",
      to: "/doctor/settings/emergency",
    });
  }

  if (!overview.accepting && !store.away.active) {
    pushUnique(items, {
      id: "queue-paused",
      tier: "warn",
      title: "Queue paused",
      subtitle: "Patients cannot be called",
      to: "/doctor/queue",
    });
  }

  const waiting = queueState.entries.filter((e) => e.status === "waiting");
  if (waiting.length > 0 && overview.serving) {
    const next = waiting[0];
    if (next) {
      const patient = getQueuePatient(next.patientId);
      pushUnique(items, {
        id: "next-patient",
        tier: "info",
        title: `Next: ${patient?.name ?? "Patient"}`,
        subtitle: `Token ${next.token} · ${next.reason}`,
        to: "/doctor/queue",
      });
    }
  }

  const unread = unreadNotificationCount();
  if (unread > 0) {
    pushUnique(items, {
      id: "notifications",
      tier: "info",
      title: `${unread} unread notification${unread > 1 ? "s" : ""}`,
      to: "/doctor/settings/notifications",
    });
  }

  return items.sort((a, b) => ALERT_TIER_ORDER[a.tier] - ALERT_TIER_ORDER[b.tier]);
}

export function awqSummaryCount(items: WorkQueueItem[]) {
  const counts = panelCounts();
  return {
    critical: items.filter((i) => i.tier === "critical").length,
    urgent: items.filter((i) => i.tier === "urgent").length,
    total: items.length,
    panel: counts.panel,
  };
}
