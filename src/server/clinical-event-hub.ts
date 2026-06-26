import type { ClinicalEvent } from "@/lib/shared/clinical-event-log";

export type HubClinicalEvent = ClinicalEvent & { seq: number };

const inboxes = new Map<string, HubClinicalEvent[]>();
let globalSeq = 0;

export function publishClinicalEventToHub(event: ClinicalEvent): HubClinicalEvent {
  const pid = event.patientId;
  const list = inboxes.get(pid) ?? [];
  const existing = list.find((e) => e.id === event.id);
  if (existing) return existing;

  globalSeq += 1;
  const msg: HubClinicalEvent = { ...event, seq: globalSeq };
  list.unshift(msg);
  inboxes.set(pid, list.slice(0, 500));
  return msg;
}

export function pollClinicalEventInbox(
  patientId: string,
  since = 0,
): { events: HubClinicalEvent[]; latestSeq: number } {
  const list = inboxes.get(patientId) ?? [];
  const events = list.filter((e) => e.seq > since).sort((a, b) => a.seq - b.seq);
  const latestSeq = list.length > 0 ? Math.max(...list.map((e) => e.seq), since) : since;
  return { events, latestSeq };
}
