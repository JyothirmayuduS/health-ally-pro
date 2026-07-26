/**
 * Doctor practice analytics — derived from panel, queue, schedule, Rx & referrals.
 * Demo-friendly weekly series so the dashboard always has shape.
 */
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import { listDoctorSentRx } from "@/lib/doctor-prescription-store";
import { getProfileStore, referralsAwaitingCount } from "@/lib/doctor-profile-store";
import type { LiveQueueState } from "@/lib/doctor-live-queue";
import { computeClinicOverview } from "@/lib/doctor-clinic-overview";

export type DayPoint = {
  key: string;
  label: string;
  consults: number;
  revenue: number;
  fillPct: number;
  noShows: number;
};

export type DoctorAnalytics = {
  today: {
    consults: number;
    inLine: number;
    waiting: number;
    fillPct: number;
    bookedSeats: number;
    capacity: number;
    openSeats: number;
    revenueBooked: number;
    revenueCap: number;
    avgWaitLabel: string;
    room: string;
  };
  week: {
    consults: number;
    revenue: number;
    avgFillPct: number;
    noShows: number;
    days: DayPoint[];
  };
  panel: {
    total: number;
    byCondition: { label: string; count: number }[];
    urgent: number;
    followUp: number;
    withAllergy: number;
  };
  clinical: {
    rxSent: number;
    referralsAwaiting: number;
    referralsTotal: number;
    videoSlots: number;
  };
  topSlots: { time: string; fillPct: number; booked: number; capacity: number }[];
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Deterministic demo week around today's live numbers */
function buildWeekSeries(todayConsults: number, todayRevenue: number, todayFill: number): DayPoint[] {
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Mon=0
  const multipliers = [0.85, 1.05, 0.95, 1.1, 1.0, 0.55, 0.2];

  return WEEKDAY_LABELS.map((label, i) => {
    const isToday = i === dayIdx;
    const m = multipliers[i] ?? 1;
    const consults = isToday ? todayConsults : Math.max(2, Math.round(todayConsults * m + (i % 3)));
    const revenue = isToday
      ? todayRevenue
      : Math.round(todayRevenue * m * (0.9 + (i % 4) * 0.05));
    const fillPct = isToday
      ? todayFill
      : Math.min(100, Math.max(25, Math.round(todayFill * m + (i % 5) * 3)));
    const noShows = isToday ? Math.max(0, Math.round(consults * 0.08)) : (i + 1) % 3;
    return {
      key: label,
      label,
      consults,
      revenue,
      fillPct,
      noShows,
    };
  });
}

export function computeDoctorAnalytics(queue: LiveQueueState): DoctorAnalytics {
  const overview = computeClinicOverview(queue);
  const schedule = getProfileStore().schedule;
  const active = schedule.slots.filter((s) => s.enabled);
  const capacity = active.reduce((n, s) => n + s.capacity, 0);
  const bookedSeats = active.reduce((n, s) => n + s.bookedToday, 0);
  const fillPct = capacity > 0 ? Math.round((bookedSeats / capacity) * 100) : 0;
  const revenueBooked = active.reduce((n, s) => n + s.bookedToday * s.price, 0);
  const revenueCap = active.reduce((n, s) => n + s.capacity * s.price, 0);

  const days = buildWeekSeries(
    Math.max(overview.completedToday, bookedSeats),
    revenueBooked || schedule.defaultFee * 6,
    fillPct || 62,
  );
  const weekConsults = days.reduce((n, d) => n + d.consults, 0);
  const weekRevenue = days.reduce((n, d) => n + d.revenue, 0);
  const weekNoShows = days.reduce((n, d) => n + d.noShows, 0);
  const avgFillPct = Math.round(days.reduce((n, d) => n + d.fillPct, 0) / days.length);

  const conditionMap = new Map<string, number>();
  for (const p of PANEL_PATIENTS) {
    conditionMap.set(p.condition, (conditionMap.get(p.condition) ?? 0) + 1);
  }
  const byCondition = [...conditionMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const referrals = getProfileStore().referrals;
  const rxSent = listDoctorSentRx().length;

  const topSlots = [...active]
    .map((s) => ({
      time: s.time,
      booked: s.bookedToday,
      capacity: s.capacity,
      fillPct: s.capacity > 0 ? Math.round((s.bookedToday / s.capacity) * 100) : 0,
    }))
    .sort((a, b) => b.fillPct - a.fillPct || b.booked - a.booked)
    .slice(0, 5);

  return {
    today: {
      consults: overview.completedToday,
      inLine: overview.inLine,
      waiting: overview.waiting,
      fillPct,
      bookedSeats,
      capacity,
      openSeats: Math.max(0, capacity - bookedSeats),
      revenueBooked,
      revenueCap,
      avgWaitLabel: overview.avgWaitLabel,
      room: overview.room,
    },
    week: {
      consults: weekConsults,
      revenue: weekRevenue,
      avgFillPct,
      noShows: weekNoShows,
      days,
    },
    panel: {
      total: PANEL_PATIENTS.length,
      byCondition,
      urgent: PANEL_PATIENTS.filter((p) => p.status === "Urgent").length,
      followUp: PANEL_PATIENTS.filter((p) => p.categories.includes("follow-up")).length,
      withAllergy: PANEL_PATIENTS.filter((p) => Boolean(p.allergyWarning)).length,
    },
    clinical: {
      rxSent,
      referralsAwaiting: referralsAwaitingCount(),
      referralsTotal: referrals.length,
      videoSlots: active.filter((s) => s.video).length,
    },
    topSlots,
  };
}
