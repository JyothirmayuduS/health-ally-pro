import Constants from "expo-constants";
import type { ClinicalEvent } from "@/lib/clinical-event-log";
import { defaultClinicalPatientId } from "@/lib/clinical-event-log";

const POLL_MS = 5000;
const CURSOR_KEY = "medora-clinical-event-sync-cursor";
let pollTimer: ReturnType<typeof setInterval> | null = null;

function apiBase(): string {
  return (
    process.env.EXPO_PUBLIC_MEDORA_API_URL ??
    (Constants.expoConfig?.extra as { medoraApiUrl?: string } | undefined)?.medoraApiUrl ??
    "http://localhost:3000"
  );
}

async function readCursor(patientId: string): Promise<number> {
  try {
    const raw = await import("@react-native-async-storage/async-storage").then((m) =>
      m.default.getItem(CURSOR_KEY),
    );
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[patientId] ?? 0;
  } catch {
    return 0;
  }
}

async function writeCursor(patientId: string, seq: number): Promise<void> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  try {
    const raw = await AsyncStorage.getItem(CURSOR_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[patientId] = seq;
    await AsyncStorage.setItem(CURSOR_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

export async function publishClinicalEventSync(event: ClinicalEvent): Promise<void> {
  try {
    await fetch(`${apiBase()}/api/patient/clinical-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    /* server unreachable */
  }
}

async function pollOnce(): Promise<void> {
  const patientId = defaultClinicalPatientId();
  const since = await readCursor(patientId);
  try {
    const res = await fetch(
      `${apiBase()}/api/patient/clinical-events?patientId=${encodeURIComponent(patientId)}&since=${since}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      events: Array<ClinicalEvent & { seq: number }>;
      latestSeq: number;
    };
    const { upsertClinicalEventFromSync } = await import("@/lib/clinical-event-log");
    for (const event of data.events) {
      await upsertClinicalEventFromSync(event);
    }
    if (data.latestSeq > since) {
      await writeCursor(patientId, data.latestSeq);
    }
  } catch {
    /* offline */
  }
}

export function startClinicalEventSync(): () => void {
  if (pollTimer) return () => {};

  void pollOnce();
  pollTimer = setInterval(() => void pollOnce(), POLL_MS);

  return () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };
}
