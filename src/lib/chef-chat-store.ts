export type ChefChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mealId?: string;
  mealName?: string;
  at: number;
};

export type ChefChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChefChatMessage[];
};

const SESSIONS_KEY = "medora-chef-chat-sessions-v1";
const ACTIVE_KEY = "medora-chef-chat-active-v1";

export const CHEF_CHAT_EVENT = "medora-chef-chat-changed";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHEF_CHAT_EVENT));
  }
}

function loadSessions(): ChefChatSession[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as ChefChatSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChefChatSession[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  emit();
}

function loadActiveId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACTIVE_KEY, id);
  }
}

const WELCOME: ChefChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour! I'm Chef Medora. I can help you prepare clinical-grade meals optimized for your medications and metabolic profile. What's on your mind?",
  at: Date.now(),
};

function newSession(title = "New chat"): ChefChatSession {
  return {
    id: `chat-${Date.now()}`,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [{ ...WELCOME, id: `welcome-${Date.now()}`, at: Date.now() }],
  };
}

export function listChefChatSessions(): ChefChatSession[] {
  return loadSessions().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getChefChatSession(id: string): ChefChatSession | undefined {
  return loadSessions().find((s) => s.id === id);
}

export function getOrCreateActiveChefSession(): ChefChatSession {
  const sessions = loadSessions();
  const activeId = loadActiveId();
  const existing = activeId ? sessions.find((s) => s.id === activeId) : undefined;
  if (existing) return existing;

  const session = newSession();
  saveSessions([session, ...sessions]);
  saveActiveId(session.id);
  return session;
}

export function createChefChatSession(title = "New chat"): ChefChatSession {
  const session = newSession(title);
  const sessions = loadSessions();
  saveSessions([session, ...sessions]);
  saveActiveId(session.id);
  return session;
}

export function setActiveChefSession(id: string) {
  saveActiveId(id);
  emit();
}

export function deleteChefChatSession(id: string) {
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
  const activeId = loadActiveId();
  if (activeId === id) {
    if (sessions[0]) saveActiveId(sessions[0].id);
    else if (typeof localStorage !== "undefined") localStorage.removeItem(ACTIVE_KEY);
  }
}

export function appendChefChatMessage(
  sessionId: string,
  message: Omit<ChefChatMessage, "id" | "at"> & { id?: string; at?: number },
): ChefChatSession | undefined {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) return undefined;

  const entry: ChefChatMessage = {
    id: message.id ?? `msg-${Date.now()}`,
    at: message.at ?? Date.now(),
    role: message.role,
    content: message.content,
    mealId: message.mealId,
    mealName: message.mealName,
  };

  const session = { ...sessions[idx] };
  session.messages = [...session.messages, entry];
  session.updatedAt = Date.now();

  if (message.role === "user" && session.title === "New chat") {
    session.title = message.content.slice(0, 48) || "New chat";
  }

  sessions[idx] = session;
  saveSessions(sessions);
  return session;
}

export function formatChefSessionDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
