const STORAGE_KEY = "medora-profile-prefs-v1";
export const PROFILE_PREFS_EVENT = "medora-profile-prefs-changed";

export type ProfilePrefId = "reminders" | "insights" | "2fa";

const DEFAULTS: Record<ProfilePrefId, boolean> = {
  reminders: true,
  insights: false,
  "2fa": true,
};

function read(): Record<ProfilePrefId, boolean> {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Record<ProfilePrefId, boolean>) };
  } catch {
    return { ...DEFAULTS };
  }
}

let cache = read();

export function getProfilePreferences(): Record<ProfilePrefId, boolean> {
  return { ...cache };
}

export function setProfilePreference(id: ProfilePrefId, value: boolean) {
  cache = { ...cache, [id]: value };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_PREFS_EVENT));
  }
}

export function refreshProfilePreferences() {
  cache = read();
}
