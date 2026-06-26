import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Copy,
  DoorOpen,
  Minus,
  Plus,
  Trash2,
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
import { DoctorProfileSubpage, ProfileSectionCard } from "./DoctorProfileSubpage";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function DoctorScheduleSlotsScreen() {
  const store = useProfileStore();
  const { schedule } = store;
  const [resetOpen, setResetOpen] = useState(false);
  const [dirty, setDirty] = useState(isScheduleDirty);

  const activeCount = schedule.slots.filter((s) => s.enabled).length;
  const conflicts = slotsWithBookingConflict(schedule.slots);
  const bookingsToday = schedule.slots.reduce((n, s) => n + s.bookedToday, 0);

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

  const patch = useCallback((patch: Parameters<typeof updateSchedule>[0]) => {
    updateSchedule(patch);
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
    toast.success("Next slot added");
  };

  const handleSave = () => {
    if (conflicts.length > 0) {
      toast.error("Resolve booking conflicts first", {
        description: `${conflicts.length} disabled slot(s) still have patients booked today.`,
      });
      return;
    }
    saveSchedule();
    setDirty(false);
    toast.success("Schedule published", {
      description: `${activeCount} active slots · ${schedule.room}`,
    });
  };

  const handleReset = () => {
    resetScheduleToDefaults();
    setResetOpen(false);
    setDirty(false);
    toast.message("Schedule reset to defaults");
  };

  return (
    <DoctorProfileSubpage
      title="Booking slots"
      subtitle={`${activeCount} active slots · ${schedule.room}`}
      breadcrumbs={[
        { label: "Profile", to: "/doctor/settings" },
        { label: "Booking slots" },
      ]}
      action={
        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3.5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Slot
        </button>
      }
      contentClassName="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0"
    >
      {dirty && (
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F5E6B8] bg-[#FDF8EB] px-4 py-3">
          <p className="text-sm text-[#5C4A1E]">
            Unsaved changes · {bookingsToday} booking(s) on today&apos;s schedule
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white"
          >
            Save & publish
          </button>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="lg:col-span-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#C45C4A]">
          {conflicts.length} slot(s) are hidden but still have patients booked today.
        </div>
      )}

      <div className="space-y-5">
        <ProfileSectionCard title="Consultation room">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8EFE6]">
              <DoorOpen className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <p className="text-xs text-[#8A8F8C]">
                Shown on your queue board and patient confirmations
              </p>
              <input
                value={schedule.room}
                onChange={(e) => patch({ room: e.target.value })}
                className="mt-2 w-full border-0 bg-transparent text-2xl font-bold text-[#1B3B2E] outline-none focus-visible:ring-2 focus-visible:ring-[#B8735D]/30 rounded-lg"
              />
            </div>
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard title="Defaults">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-[#8A8F8C]">Default fee (₹)</span>
              <input
                type="number"
                value={schedule.defaultFee}
                onChange={(e) => patch({ defaultFee: Number(e.target.value) })}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E4DF] px-3.5 text-sm outline-none"
              />
            </label>
            <div>
              <span className="text-xs font-semibold text-[#8A8F8C]">Slot spacing (minutes)</span>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => patch({ slotSpacing: Math.max(15, schedule.slotSpacing - 5) })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF] bg-[#FAFAF8]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-lg font-bold tabular-nums">
                  {schedule.slotSpacing}
                </span>
                <button
                  type="button"
                  onClick={() => patch({ slotSpacing: schedule.slotSpacing + 5 })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF] bg-[#FAFAF8]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-[#8A8F8C]">Used when you duplicate or add a new slot</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#1B3B2E]">Break between slots</p>
                <p className="text-xs text-[#8A8F8C]">
                  {schedule.breakBetweenSlots
                    ? `${schedule.breakMinutes} min gap between slots`
                    : "Disabled (next slot starts right after the slot)"}
                </p>
              </div>
              <Switch
                checked={schedule.breakBetweenSlots}
                onCheckedChange={(v) => patch({ breakBetweenSlots: v })}
                className="data-[state=checked]:bg-[#7A9B7E]"
              />
            </div>
            {schedule.breakBetweenSlots && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => patch({ breakMinutes: Math.max(5, schedule.breakMinutes - 5) })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold tabular-nums">{schedule.breakMinutes}</span>
                <button
                  type="button"
                  onClick={() => patch({ breakMinutes: schedule.breakMinutes + 5 })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard title="Working days">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3B2E]">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            Working days
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = schedule.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-semibold",
                    active
                      ? "border-[#1B3B2E] bg-[#E8EFE6] text-[#1B3B2E]"
                      : "border-[#E8E4DF] bg-white text-[#8A8F8C]",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </ProfileSectionCard>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-[#1B3B2E]">Time slots</h2>
          <span className="text-xs text-[#8A8F8C]">{schedule.slots.length} total</span>
        </div>
        <p className="px-1 text-xs text-[#8A8F8C]">
          Set price and how many patients can book each slot. Toggle off to hide from booking.
        </p>

        <ul className="space-y-3">
          {schedule.slots.map((slot) => (
            <li
              key={slot.id}
              className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#8A8F8C]" strokeWidth={1.75} />
                  <span className="text-lg font-bold tabular-nums text-[#1B3B2E]">{slot.time}</span>
                </div>
                <Switch
                  checked={slot.enabled}
                  onCheckedChange={(enabled) => updateSlot(slot.id, { enabled })}
                  className="data-[state=checked]:bg-[#7A9B7E]"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-semibold text-[#8A8F8C]">₹ PRICE</span>
                  <input
                    type="number"
                    value={slot.price}
                    onChange={(e) => updateSlot(slot.id, { price: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E4DF] px-3 text-sm"
                  />
                </label>
                <div>
                  <span className="text-[10px] font-semibold text-[#8A8F8C]">PER SLOT</span>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateSlot(slot.id, { capacity: Math.max(1, slot.capacity - 1) })
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex-1 text-center font-bold tabular-nums">{slot.capacity}</span>
                    <button
                      type="button"
                      onClick={() => updateSlot(slot.id, { capacity: slot.capacity + 1 })}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[#E8E4DF]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSlot(slot.id, { inPerson: !slot.inPerson })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      slot.inPerson
                        ? "bg-[#E8EFE6] text-[#1B3B2E]"
                        : "border border-[#E8E4DF] text-[#8A8F8C]",
                    )}
                  >
                    In-person
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSlot(slot.id, { video: !slot.video })}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      slot.video
                        ? "bg-[#E8EFE6] text-[#1B3B2E]"
                        : "border border-[#E8E4DF] text-[#8A8F8C]",
                    )}
                  >
                    Video
                  </button>
                </div>
                <span
                  className={cn(
                    "text-xs",
                    slot.bookedToday >= slot.capacity ? "text-[#7A9B7E]" : "text-[#8A8F8C]",
                  )}
                >
                  {slot.bookedToday > 0
                    ? `${slot.bookedToday}/${slot.capacity} booked today`
                    : "Open"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#F0EDE8] pt-3">
                <button
                  type="button"
                  onClick={() => duplicateNext(slot)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#8A8F8C]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Add next slot
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patch({ slots: schedule.slots.filter((s) => s.id !== slot.id) })
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#FCE8E6] text-[#C45C4A]"
                  aria-label="Delete slot"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] bg-white py-3.5 text-sm font-semibold text-[#1B3B2E]"
          >
            Reset to defaults
          </button>
          {dirty && (
            <button
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center rounded-xl bg-[#1B3B2E] py-3.5 text-sm font-semibold text-white"
            >
              Save & publish
            </button>
          )}
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
