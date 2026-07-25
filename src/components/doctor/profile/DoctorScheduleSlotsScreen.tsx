import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Clock,
  Copy,
  DoorOpen,
  Minus,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { DoctorProfileSubpage } from "./DoctorProfileSubpage";
import {
  isScheduleDirty,
  resetScheduleToDefaults,
  saveSchedule,
  slotsWithBookingConflict,
  updateSchedule,
} from "@/lib/doctor-profile-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import type { ScheduleSlot } from "@/lib/doctor-profile-workspace";
import { cn } from "@/lib/utils";
import { saveDoctorAvailability } from "@/lib/opd/client";
import { DOCTOR_PORTAL_STAFF_ID } from "@/lib/shared/clinic-queue";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function periodOf(time: string): "Morning" | "Afternoon" | "Evening" {
  const h = Number(time.split(":")[0] ?? 0);
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export function DoctorScheduleSlotsScreen() {
  const store = useProfileStore();
  const { schedule } = store;
  const [resetOpen, setResetOpen] = useState(false);
  const [dirty, setDirty] = useState(isScheduleDirty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeSlots = useMemo(() => schedule.slots.filter((s) => s.enabled), [schedule.slots]);
  const activeCount = activeSlots.length;
  const conflicts = slotsWithBookingConflict(schedule.slots);

  const analytics = useMemo(() => {
    const capacity = activeSlots.reduce((n, s) => n + s.capacity, 0);
    const booked = activeSlots.reduce((n, s) => n + s.bookedToday, 0);
    const open = Math.max(0, capacity - booked);
    const fillPct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
    const revenueBooked = activeSlots.reduce((n, s) => n + s.bookedToday * s.price, 0);
    const revenueCap = activeSlots.reduce((n, s) => n + s.capacity * s.price, 0);
    const videoSlots = activeSlots.filter((s) => s.video).length;
    return { capacity, booked, open, fillPct, revenueBooked, revenueCap, videoSlots };
  }, [activeSlots]);

  const grouped = useMemo(() => {
    const order: Array<"Morning" | "Afternoon" | "Evening"> = ["Morning", "Afternoon", "Evening"];
    const map = new Map<string, ScheduleSlot[]>();
    for (const p of order) map.set(p, []);
    for (const s of [...schedule.slots].sort((a, b) => a.time.localeCompare(b.time))) {
      map.get(periodOf(s.time))!.push(s);
    }
    return order
      .map((period) => ({ period, slots: map.get(period) ?? [] }))
      .filter((g) => g.slots.length > 0);
  }, [schedule.slots]);

  useEffect(() => {
    setDirty(isScheduleDirty());
  }, [schedule.savedAt]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isScheduleDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const patch = useCallback((next: Parameters<typeof updateSchedule>[0]) => {
    updateSchedule(next);
    setDirty(true);
  }, []);

  const updateSlot = (id: string, slotPatch: Partial<ScheduleSlot>) => {
    const slots = schedule.slots.map((s) => (s.id === id ? { ...s, ...slotPatch } : s));
    if (slotPatch.enabled === false) {
      const slot = schedule.slots.find((s) => s.id === id);
      if (slot && slot.bookedToday > 0) {
        toast.warning("Slot has bookings today", {
          description: `${slot.bookedToday} patient(s) already booked this slot.`,
        });
      }
    }
    patch({ slots });
  };

  const toggleDay = (day: string) => {
    const workingDays = schedule.workingDays.includes(day)
      ? schedule.workingDays.filter((d) => d !== day)
      : [...schedule.workingDays, day];
    patch({ workingDays });
  };

  const addSlot = () => {
    const last = schedule.slots[schedule.slots.length - 1];
    const nextTime = last
      ? addMinutesToTime(
          last.time,
          schedule.breakBetweenSlots
            ? schedule.slotSpacing + schedule.breakMinutes
            : schedule.slotSpacing,
        )
      : "09:00";
    const id = `s${Date.now()}`;
    patch({
      slots: [
        ...schedule.slots,
        {
          id,
          time: nextTime,
          price: schedule.defaultFee,
          capacity: 1,
          bookedToday: 0,
          inPerson: true,
          video: false,
          enabled: true,
        },
      ],
    });
    setEditingId(id);
    toast.success("Slot added");
  };

  const duplicateNext = (slot: ScheduleSlot) => {
    const idx = schedule.slots.findIndex((s) => s.id === slot.id);
    const nextTime = addMinutesToTime(
      slot.time,
      schedule.breakBetweenSlots
        ? schedule.slotSpacing + schedule.breakMinutes
        : schedule.slotSpacing,
    );
    const newSlot: ScheduleSlot = {
      id: `s${Date.now()}`,
      time: nextTime,
      price: slot.price,
      capacity: slot.capacity,
      bookedToday: 0,
      inPerson: slot.inPerson,
      video: slot.video,
      enabled: true,
    };
    const slots = [...schedule.slots];
    slots.splice(idx + 1, 0, newSlot);
    patch({ slots });
    setEditingId(newSlot.id);
    toast.success("Next slot added");
  };

  const applySessionTemplate = (kind: "morning" | "afternoon") => {
    const times =
      kind === "morning"
        ? ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
        : ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    const existing = new Set(schedule.slots.map((s) => s.time));
    const added: ScheduleSlot[] = times
      .filter((t) => !existing.has(t))
      .map((time, i) => ({
        id: `s${Date.now()}-${i}`,
        time,
        price: schedule.defaultFee,
        capacity: 1,
        bookedToday: 0,
        inPerson: true,
        video: false,
        enabled: true,
      }));
    if (added.length === 0) {
      toast.message(`All ${kind} slots already exist`);
      return;
    }
    patch({ slots: [...schedule.slots, ...added].sort((a, b) => a.time.localeCompare(b.time)) });
    toast.success(`Added ${added.length} ${kind} slots`);
  };

  const handleSave = () => {
    if (conflicts.length > 0) {
      toast.error("Resolve booking conflicts first", {
        description: `${conflicts.length} disabled slot(s) still have patients booked today.`,
      });
      return;
    }
    saveSchedule();
    const weekdayMap = new Map(WEEKDAYS.map((day, index) => [day, index]));
    for (const day of schedule.workingDays) {
      const weekday = weekdayMap.get(day);
      if (weekday == null) continue;
      for (const slot of schedule.slots) {
        if (!slot.enabled) continue;
        void saveDoctorAvailability({
          doctorId: DOCTOR_PORTAL_STAFF_ID,
          weekday,
          startTime: slot.time,
          endTime: addMinutesToTime(slot.time, schedule.slotSpacing),
          slotMinutes: schedule.slotSpacing,
          capacity: slot.capacity,
          effectiveFrom: null,
          effectiveTo: null,
          isActive: true,
        });
      }
    }
    setDirty(false);
    toast.success("Schedule published", {
      description: `${activeCount} active slots · ${schedule.room}`,
    });
  };

  const handleReset = () => {
    resetScheduleToDefaults();
    setResetOpen(false);
    setDirty(false);
    setEditingId(null);
    toast.message("Schedule reset to defaults");
  };

  return (
    <DoctorProfileSubpage
      title="Booking slots"
      subtitle={`${activeCount} open · ${schedule.room} · ${analytics.fillPct}% filled today`}
      breadcrumbs={[{ label: "Profile", to: "/doctor/settings" }, { label: "Booking slots" }]}
      className="lg:max-w-[1400px]"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/doctor/statistics"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E0DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#5C6B63] hover:border-[#C8C2BA]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </Link>
          <button
            type="button"
            onClick={addSlot}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1B3B2E] px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Slot
          </button>
        </div>
      }
    >
      {/* Today fill KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            label: "Fill today",
            value: `${analytics.fillPct}%`,
            hint: `${analytics.booked}/${analytics.capacity} seats`,
          },
          {
            label: "Open seats",
            value: String(analytics.open),
            hint: "Still bookable",
          },
          {
            label: "Booked revenue",
            value: `₹${analytics.revenueBooked.toLocaleString("en-IN")}`,
            hint: `Cap ₹${analytics.revenueCap.toLocaleString("en-IN")}`,
          },
          {
            label: "Video-ready",
            value: String(analytics.videoSlots),
            hint: "of active slots",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(27,59,46,0.04)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">{k.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[#1B3B2E]">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-[#8A8F8C]">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Fill bar */}
      <div className="rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[#1B3B2E]">Today’s seat fill</span>
          <span className="tabular-nums text-[#8A8F8C]">
            {analytics.booked} booked · {analytics.open} open
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#F0EEE9]">
          <div
            className="h-full rounded-full bg-[#1B3B2E] transition-all"
            style={{ width: `${Math.min(100, analytics.fillPct)}%` }}
          />
        </div>
      </div>

      {dirty && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EDEAE6] bg-[#FAF9F7] px-4 py-3">
          <p className="text-sm text-[#5C6B63]">
            Unsaved changes · {analytics.booked} booking(s) on today&apos;s schedule
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white"
          >
            Save &amp; publish
          </button>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-[#E8B4AE] bg-[#FDF5F4] px-4 py-3 text-sm text-[#8B3A32]">
          {conflicts.length} slot(s) are hidden but still have patients booked today.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        {/* Left: room + defaults */}
        <aside className="space-y-3 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F0EEE9] text-[#1B3B2E]">
                <DoorOpen className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">Room</p>
                <input
                  value={schedule.room}
                  onChange={(e) => patch({ room: e.target.value })}
                  className="mt-0.5 w-full border-0 bg-transparent text-lg font-semibold text-[#1B3B2E] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
              Working days
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = schedule.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-semibold",
                      active
                        ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                        : "border-[#E2E0DB] bg-white text-[#8A8F8C]",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
              Quick templates
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => applySessionTemplate("morning")}
                className="rounded-xl border border-[#E2E0DB] px-3 py-2 text-left text-xs font-semibold text-[#1B3B2E] hover:bg-[#FAF9F7]"
              >
                Morning OPD · 09:00–11:30
              </button>
              <button
                type="button"
                onClick={() => applySessionTemplate("afternoon")}
                className="rounded-xl border border-[#E2E0DB] px-3 py-2 text-left text-xs font-semibold text-[#1B3B2E] hover:bg-[#FAF9F7]"
              >
                Afternoon OPD · 14:00–16:30
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="w-full rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1B3B2E]"
          >
            {settingsOpen ? "Hide defaults ▴" : "Fee & spacing ▾"}
          </button>

          {settingsOpen ? (
            <div className="space-y-3 rounded-2xl border border-[#EDEAE6] bg-white p-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                  Default fee (₹)
                </span>
                <input
                  type="number"
                  value={schedule.defaultFee}
                  onChange={(e) => patch({ defaultFee: Number(e.target.value) })}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E0DB] px-3 text-sm outline-none focus:border-[#1B3B2E]"
                />
              </label>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                  Slot spacing
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ slotSpacing: Math.max(15, schedule.slotSpacing - 5) })}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[3rem] text-center text-sm font-bold tabular-nums">
                    {schedule.slotSpacing} min
                  </span>
                  <button
                    type="button"
                    onClick={() => patch({ slotSpacing: schedule.slotSpacing + 5 })}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#1B3B2E]">Break between slots</p>
                  <p className="text-[11px] text-[#8A8F8C]">
                    {schedule.breakBetweenSlots
                      ? `${schedule.breakMinutes} min gap`
                      : "Off"}
                  </p>
                </div>
                <Switch
                  checked={schedule.breakBetweenSlots}
                  onCheckedChange={(v) => patch({ breakBetweenSlots: v })}
                  className="data-[state=checked]:bg-[#1B3B2E]"
                />
              </div>
              {schedule.breakBetweenSlots ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      patch({ breakMinutes: Math.max(5, schedule.breakMinutes - 5) })
                    }
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-bold tabular-nums">{schedule.breakMinutes} min</span>
                  <button
                    type="button"
                    onClick={() => patch({ breakMinutes: schedule.breakMinutes + 5 })}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        {/* Right: dense day board */}
        <div className="space-y-4">
          {grouped.map(({ period, slots }) => (
            <section key={period} className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1B3B2E]">{period}</h2>
                <span className="text-[11px] text-[#8A8F8C]">
                  {slots.filter((s) => s.enabled).length}/{slots.length} open
                </span>
              </div>
              <ul className="space-y-2">
                {slots.map((slot) => {
                  const full = slot.bookedToday >= slot.capacity && slot.enabled;
                  const fill =
                    slot.capacity > 0
                      ? Math.round((slot.bookedToday / slot.capacity) * 100)
                      : 0;
                  const open = editingId === slot.id;
                  return (
                    <li
                      key={slot.id}
                      className={cn(
                        "overflow-hidden rounded-xl border transition",
                        !slot.enabled
                          ? "border-[#EDEAE6] bg-[#FAF9F7] opacity-70"
                          : full
                            ? "border-[#C8D4C8] bg-[#F4F8F4]"
                            : "border-[#EDEAE6] bg-white",
                        open && "border-[#1B3B2E]/40 ring-1 ring-[#1B3B2E]/10",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingId(open ? null : slot.id)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#8A8F8C]" />
                          <span className="text-base font-semibold tabular-nums text-[#1B3B2E]">
                            {slot.time}
                          </span>
                          <span className="text-xs tabular-nums text-[#8A8F8C]">
                            ₹{slot.price}
                          </span>
                          {slot.video ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F0EEE9] px-1.5 py-0.5 text-[10px] font-semibold text-[#5C6B63]">
                              <Video className="h-2.5 w-2.5" />
                              Video
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                              !slot.enabled
                                ? "bg-[#EDEAE6] text-[#8A8F8C]"
                                : full
                                  ? "bg-[#E8EFE6] text-[#1B3B2E]"
                                  : "bg-[#F0EEE9] text-[#5C6B63]",
                            )}
                          >
                            {!slot.enabled
                              ? "Off"
                              : slot.bookedToday > 0
                                ? `${slot.bookedToday}/${slot.capacity}`
                                : "Open"}
                          </span>
                        </button>
                        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[#F0EEE9] sm:w-20">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              full ? "bg-[#1B3B2E]" : "bg-[#8A8F8C]",
                            )}
                            style={{ width: `${slot.enabled ? fill : 0}%` }}
                          />
                        </div>
                        <Switch
                          checked={slot.enabled}
                          onCheckedChange={(enabled) => updateSlot(slot.id, { enabled })}
                          className="data-[state=checked]:bg-[#1B3B2E]"
                        />
                      </div>

                      {open ? (
                        <div className="space-y-3 border-t border-[#F0EDE8] bg-[#FAFAF8] px-3 py-3">
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                                Time
                              </span>
                              <input
                                type="time"
                                value={slot.time}
                                onChange={(e) => updateSlot(slot.id, { time: e.target.value })}
                                className="mt-1 h-10 w-full rounded-xl border border-[#E2E0DB] bg-white px-3 text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                                ₹ Price
                              </span>
                              <input
                                type="number"
                                value={slot.price}
                                onChange={(e) =>
                                  updateSlot(slot.id, { price: Number(e.target.value) })
                                }
                                className="mt-1 h-10 w-full rounded-xl border border-[#E2E0DB] bg-white px-3 text-sm"
                              />
                            </label>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">
                              Capacity
                            </span>
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateSlot(slot.id, {
                                    capacity: Math.max(1, slot.capacity - 1),
                                  })
                                }
                                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB] bg-white"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[2rem] text-center font-bold tabular-nums">
                                {slot.capacity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSlot(slot.id, { capacity: slot.capacity + 1 })
                                }
                                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0DB] bg-white"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => updateSlot(slot.id, { inPerson: !slot.inPerson })}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                                slot.inPerson
                                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                                  : "border-[#E2E0DB] bg-white text-[#8A8F8C]",
                              )}
                            >
                              In-person
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSlot(slot.id, { video: !slot.video })}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                                slot.video
                                  ? "border-[#1B3B2E] bg-[#1B3B2E] text-white"
                                  : "border-[#E2E0DB] bg-white text-[#8A8F8C]",
                              )}
                            >
                              Video
                            </button>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#EDEAE6] pt-2.5">
                            <button
                              type="button"
                              onClick={() => duplicateNext(slot)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B63]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Add next
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                patch({
                                  slots: schedule.slots.filter((s) => s.id !== slot.id),
                                });
                                setEditingId(null);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C45C4A]"
                              aria-label="Delete slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="flex flex-1 items-center justify-center rounded-full border border-[#E2E0DB] bg-white py-3 text-sm font-semibold text-[#5C6B63]"
            >
              Reset to defaults
            </button>
            {dirty ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex flex-1 items-center justify-center rounded-full bg-[#1B3B2E] py-3 text-sm font-semibold text-white"
              >
                Save &amp; publish
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset schedule to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard unsaved changes and restore the default 8-slot template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DoctorProfileSubpage>
  );
}
