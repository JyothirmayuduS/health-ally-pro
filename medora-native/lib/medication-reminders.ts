import { Platform } from "react-native";
import type { Medication } from "@/lib/mock-data";
import { getNotificationsModule, requestNotificationPermission } from "@/lib/notifications";

let remindersOn = true;

export function medRemindersEnabled(): boolean {
  return remindersOn;
}

export function setMedRemindersEnabled(on: boolean) {
  remindersOn = on;
}

function parseMedTime(label: string): { hour: number; minute: number } | null {
  const u = label.trim().toUpperCase();
  if (u.includes("DINNER")) return { hour: 19, minute: 0 };
  if (u.includes("BED")) return { hour: 21, minute: 30 };

  const m = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

export async function scheduleMedicationReminders(meds: Medication[]): Promise<void> {
  if (!remindersOn) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* noop */
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("med-reminders", {
      name: "Medication reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#B6785C",
    });
  }

  const seen = new Set<string>();
  for (const med of meds) {
    const t = parseMedTime(med.time);
    if (!t) continue;
    const key = `${t.hour}:${t.minute}:${med.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for your medication",
        body: `${med.name} ${med.dosage} — ${med.reason}`,
        data: { medId: med.id, type: "med-reminder" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
        channelId: Platform.OS === "android" ? "med-reminders" : undefined,
      },
    });
  }
}
