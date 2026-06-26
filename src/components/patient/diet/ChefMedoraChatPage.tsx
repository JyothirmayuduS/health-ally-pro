import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Clock,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendChefChatMessage,
  CHEF_CHAT_EVENT,
  createChefChatSession,
  deleteChefChatSession,
  formatChefSessionDate,
  getOrCreateActiveChefSession,
  listChefChatSessions,
  setActiveChefSession,
  type ChefChatSession,
} from "@/lib/chef-chat-store";
import { buildChefAssistantReply, getChefSuggestionChips } from "@/lib/chef-chat-engine";
import {
  DIET_LANGUAGE_EVENT,
  getDietVideoLanguage,
  setDietVideoLanguage,
} from "@/lib/diet-language-store";
import { getDietMeal } from "@/lib/diet-store";
import type { DietLanguage } from "@/lib/diet-ai-types";
import { DietLanguagePicker } from "@/components/patient/diet/DietLanguagePicker";
import { DietNutritionPanel } from "@/components/patient/diet/DietNutritionPanel";
import { DietRecoveryPicks } from "@/components/patient/diet/DietRecoveryPicks";
import { listAllDietMeals } from "@/lib/diet-store";
import { cn } from "@/lib/utils";

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const shellClass =
  "flex h-dvh w-full flex-col bg-[#F9F7F2] lg:min-h-dvh";

export function ChefMedoraChatPage() {
  const [session, setSession] = useState<ChefChatSession>(() => getOrCreateActiveChefSession());
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChefChatSession[]>(() => listChefChatSessions());
  const [videoLanguage, setVideoLanguage] = useState<DietLanguage>(() => getDietVideoLanguage());
  const bottomRef = useRef<HTMLDivElement>(null);
  const chips = getChefSuggestionChips();

  const refresh = useCallback(() => {
    setSessions(listChefChatSessions());
    const active = getOrCreateActiveChefSession();
    setSession(active);
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(CHEF_CHAT_EVENT, onChange);
    return () => window.removeEventListener(CHEF_CHAT_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    const onLang = () => setVideoLanguage(getDietVideoLanguage());
    window.addEventListener(DIET_LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(DIET_LANGUAGE_EVENT, onLang);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, thinking]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setInput("");
    setThinking(true);

    appendChefChatMessage(session.id, { role: "user", content: trimmed });
    refresh();

    await new Promise((r) => setTimeout(r, 400));

    const reply = await buildChefAssistantReply(trimmed, videoLanguage);
    appendChefChatMessage(session.id, {
      role: "assistant",
      content: reply.content,
      mealId: reply.mealId,
      mealName: reply.mealName,
    });
    refresh();
    setThinking(false);
  };

  const handleNewChat = () => {
    const s = createChefChatSession();
    setSession(s);
    setSessions(listChefChatSessions());
    setHistoryOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveChefSession(id);
    refresh();
    setHistoryOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteChefChatSession(id);
    refresh();
  };

  if (historyOpen) {
    return (
      <div className={shellClass}>
        <header className="flex shrink-0 items-center justify-between px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <h1 className="font-serif text-[32px] text-ink">History</h1>
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            className="font-serif text-[32px] text-ink"
          >
            Done
          </button>
        </header>

        <ul className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8", HIDE_SCROLLBAR)}>
          {sessions.map((s) => (
            <li key={s.id}>
              <div className="flex items-center gap-3 rounded-[20px] border border-[#EDEAE6] bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={() => handleSelectSession(s.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {formatChefSessionDate(s.updatedAt)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(s.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FDF0EE] text-[#C44B3F]"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
          {sessions.length === 0 ? (
            <li className="py-12 text-center text-sm text-ink-muted">No chats yet</li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-[#EDEAE6]/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <Link
          to="/diet"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
          aria-label="Back to diet"
        >
          <ChevronLeft className="h-6 w-6 text-ink" strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[22px] leading-tight text-ink">Chef Medora</h1>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Clinical nutrition
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="grid h-10 w-10 place-items-center rounded-full text-ink"
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full text-ink"
          aria-label="Chat history"
        >
          <Clock className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* Messages */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5",
          HIDE_SCROLLBAR,
        )}
      >
        {session.messages.map((msg, i) => {
          if (msg.role === "assistant" && i === 0) {
            return (
              <div
                key={msg.id}
                className="rounded-[22px] border border-[#EDEAE6] bg-[#F3F1EC] px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
                    <Sparkles className="h-4 w-4 text-clay" strokeWidth={1.75} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    Clinical meal guidance
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-ink">{msg.content}</p>
              </div>
            );
          }

          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-[20px] bg-ink px-4 py-3 text-[15px] leading-relaxed text-white">
                  {msg.content}
                </p>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex flex-col gap-3">
              <div className="max-w-[min(100%,52rem)] whitespace-pre-line text-[15px] leading-relaxed text-ink">
                {msg.content.split("\n").map((line) => {
                  const bold = line.match(/^\*\*(.+)\*\*$/);
                  if (bold) {
                    return (
                      <p key={line} className="mb-1 font-semibold text-ink">
                        {bold[1]}
                      </p>
                    );
                  }
                  if (line.startsWith("• ") || /^\d+\./.test(line)) {
                    return (
                      <p key={line} className="text-ink-muted">
                        {line}
                      </p>
                    );
                  }
                  return line ? (
                    <p key={line} className={line.startsWith("**") ? "font-semibold" : ""}>
                      {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  ) : (
                    <br key={`${msg.id}-${line}-sp`} />
                  );
                })}
              </div>
              {msg.mealId && msg.mealName ? (
                <RecipePreviewCard mealId={msg.mealId} mealName={msg.mealName} />
              ) : null}
            </div>
          );
        })}

        {session.messages.length <= 1 ? (
          <DietRecoveryPicks
            meals={listAllDietMeals()}
            activeBudget="balanced"
            compact
            showAllTiers={false}
            className="mb-0"
          />
        ) : null}

        {thinking ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-clay [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-clay [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-clay [animation-delay:300ms]" />
            </span>
            Chef Medora is preparing your recipe…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#EDEAE6]/80 bg-[#F9F7F2] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Video language
        </p>
        <DietLanguagePicker
          value={videoLanguage}
          onChange={(lang) => {
            setVideoLanguage(lang);
            setDietVideoLanguage(lang);
          }}
          compact
          className="mb-3"
        />

        <div className={cn("-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1", HIDE_SCROLLBAR)}>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={thinking}
              onClick={() => sendMessage(chip)}
              className="shrink-0 rounded-full border border-[#EDEAE6] bg-white px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-clay/40 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="relative"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a recipe or food advice…"
            disabled={thinking}
            className={cn(
              "w-full rounded-full border border-[#EDEAE6] bg-white py-3.5 pl-5 pr-14 text-[15px]",
              "placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20",
              "disabled:opacity-60",
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#E8E6E1] text-ink transition-colors enabled:bg-ink enabled:text-white disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </div>
  );
}

function RecipePreviewCard({ mealId, mealName }: { mealId: string; mealName: string }) {
  const meal = getDietMeal(mealId);

  return (
    <Link
      to="/diet/$mealId"
      params={{ mealId }}
      className="flex max-w-[min(100%,52rem)] flex-col gap-4 rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-clay">
            Your clinical recipe
          </span>
          <span className="mt-1 block font-serif text-xl text-ink">{mealName}</span>
        </div>
        {meal?.protocol ? (
          <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase text-amber-800">
            {meal.protocol.medGap} gap
          </span>
        ) : null}
      </div>

      {meal ? (
        <>
          <DietNutritionPanel meal={meal} variant="card" />
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {meal.ingredients.slice(0, 5).join(" · ")}
          </p>
          {meal.instructions?.length ? (
            <p className="line-clamp-2 text-xs text-ink-muted">
              <span className="font-semibold text-ink">Step 1:</span> {meal.instructions[0]}
            </p>
          ) : null}
          {meal.youtubeVideos?.length ? (
            <p className="text-xs font-medium text-red-600">
              {meal.youtubeVideos.length} YouTube tutorial{meal.youtubeVideos.length > 1 ? "s" : ""} attached
            </p>
          ) : null}
        </>
      ) : null}
      <span className="text-sm font-semibold text-clay">View full procedure, nutrition & videos →</span>
    </Link>
  );
}
