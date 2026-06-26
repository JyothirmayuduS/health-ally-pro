export type QueueNodeKind = "completed" | "in-room" | "you" | "waiting";

export type QueuePersona =
  | "elderly-man"
  | "elderly-woman"
  | "adult-man"
  | "adult-woman"
  | "boy"
  | "girl";

export type QueueTimelineNode = {
  position: number;
  kind: QueueNodeKind;
  persona: QueuePersona;
};

const PERSONA_ROSTER: QueuePersona[] = [
  "elderly-woman",
  "adult-man",
  "adult-woman",
  "boy",
  "girl",
  "elderly-man",
];

export function queuePersonaForPosition(position: number): QueuePersona {
  return PERSONA_ROSTER[(position - 1) % PERSONA_ROSTER.length];
}

export function getPersonaShortLabel(persona: QueuePersona): string {
  const labels: Record<QueuePersona, string> = {
    "elderly-man": "An elderly gentleman",
    "elderly-woman": "An elderly patient",
    "adult-man": "A man",
    "adult-woman": "A woman",
    boy: "A young boy",
    girl: "A young girl",
  };
  return labels[persona];
}

export type QueueTimelineSegments = {
  completed: QueueTimelineNode[];
  inRoom: QueueTimelineNode | null;
  you: QueueTimelineNode | null;
  waiting: QueueTimelineNode[];
};

export function buildQueueTimelineSegments(position: number, total: number): QueueTimelineSegments {
  const all = buildQueueTimeline(position, total);
  return {
    completed: all.filter((n) => n.kind === "completed"),
    inRoom: all.find((n) => n.kind === "in-room") ?? null,
    you: all.find((n) => n.kind === "you") ?? null,
    waiting: all.filter((n) => n.kind === "waiting"),
  };
}

export function getPersonaDisplayLabel(persona: QueuePersona): string {
  const labels: Record<QueuePersona, string> = {
    "elderly-man": "Elderly gentleman",
    "elderly-woman": "Elderly patient",
    "adult-man": "Adult man",
    "adult-woman": "Adult woman",
    boy: "Young boy",
    girl: "Young girl",
  };
  return labels[persona];
}

export function patientInConsultation(position: number): QueueTimelineNode | null {
  if (position <= 1) return null;
  const pos = position - 1;
  return { position: pos, kind: "in-room", persona: queuePersonaForPosition(pos) };
}

export function patientsSeenBeforeYou(position: number): number {
  return Math.max(0, position - 2);
}

export function patientsAhead(position: number): number {
  return position > 1 ? 1 : 0;
}

export function patientsBehind(position: number, total: number): number {
  return Math.max(0, total - position);
}

export function getQueueProgressCaption(position: number, doctorName: string): string {
  const inRoom = patientInConsultation(position);
  if (!inRoom) return `You're #${position} in line`;
  const serving = `${getPersonaShortLabel(inRoom.persona)} is with ${doctorName} now`;
  if (patientsAhead(position) === 0) return serving;
  return `${serving} · you're next after them`;
}

export function getQueueBoardSummary(position: number, total: number): string {
  const behind = patientsBehind(position, total);
  const seen = patientsSeenBeforeYou(position);
  if (patientsAhead(position) === 0) return `You're #${position} · ${behind} behind you`;
  const seenPart = seen > 0 ? `${seen} seen · ` : "";
  return `${seenPart}1 in room · ${behind} behind you`;
}

export function getYouRowSubtitle(position: number): string {
  if (patientsAhead(position) === 0) return "You're first — we'll call you soon";
  return "You're next after the patient in the room";
}

export function getQueueStatusCaption(inRoomPersona: QueuePersona, doctorName: string): string {
  return `${getPersonaShortLabel(inRoomPersona)} is with ${doctorName} now · you're next after them`;
}

export function buildQueueTimeline(position: number, total: number): QueueTimelineNode[] {
  return Array.from({ length: total }, (_, i) => {
    const num = i + 1;
    const persona = queuePersonaForPosition(num);
    if (num < position - 1) return { position: num, kind: "completed", persona };
    if (num === position - 1) return { position: num, kind: "in-room", persona };
    if (num === position) return { position: num, kind: "you", persona };
    return { position: num, kind: "waiting", persona };
  });
}

export function queueProgressPercent(position: number, total: number) {
  if (total <= 1) return 100;
  return Math.round(((position - 1) / (total - 1)) * 100);
}

export function formatAppointmentTime(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${period}`;
}

export function formatQueueDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
