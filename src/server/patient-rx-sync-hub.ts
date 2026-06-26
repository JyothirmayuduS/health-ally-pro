import type { PatientRxSyncEnvelope } from "@/lib/shared/patient-rx-sync-types";

export type InboxMessage = PatientRxSyncEnvelope & { seq: number };

const inboxes = new Map<string, InboxMessage[]>();
let globalSeq = 0;

export function publishPatientRxToHub(envelope: PatientRxSyncEnvelope): InboxMessage {
  const pid = envelope.patientId;
  const list = inboxes.get(pid) ?? [];
  const existing = list.find((m) => m.rx_number === envelope.rx_number);
  if (existing) return existing;

  globalSeq += 1;
  const msg: InboxMessage = { ...envelope, seq: globalSeq };
  list.push(msg);
  inboxes.set(pid, list.slice(-100));
  return msg;
}

export function pollPatientRxInbox(patientId: string, since = 0): { messages: InboxMessage[]; latestSeq: number } {
  const list = inboxes.get(patientId) ?? [];
  const messages = list.filter((m) => m.seq > since);
  const latestSeq = list.length > 0 ? list[list.length - 1]!.seq : since;
  return { messages, latestSeq };
}
