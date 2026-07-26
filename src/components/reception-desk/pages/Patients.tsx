import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { Route } from "@/routes/reception.patients";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import StatusPill from "@/components/reception-desk/StatusPill";
import { PatientProfileWorkspace } from "@/components/patient-management/PatientProfileWorkspace";
import { QrScanner } from "@/components/patient-management/QrScanner";
import { searchPatients, resolveQr } from "@/lib/patient-management/client";
import { managedToSharedPatient } from "@/lib/patient-management/compat";
import type { ManagedPatient } from "@/lib/patient-management/schemas";
import {
  Search,
  CalendarPlus,
  LogIn,
  Printer,
  IndianRupee,
  Shield,
  ScanLine,
  UserPlus,
  Users,
  AlertCircle,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const age = (dob: string | undefined) => {
  if (!dob) return "—";
  const d = new Date(dob);
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warn" | "sage";
}) {
  return (
    <div
      className={cn(
        "flex min-w-[88px] flex-col items-center justify-center gap-0.5 rounded-xl border px-4 py-2.5",
        tone === "warn"
          ? "border-status-noshowBorder bg-status-noshowBg/40"
          : tone === "sage"
            ? "border-sage/20 bg-sage-soft/50"
            : "border-ink-200 bg-white",
      )}
    >
      <span
        className={cn(
          "font-heading text-[20px] font-semibold tabular-nums leading-none",
          tone === "warn"
            ? "text-status-noshowText"
            : tone === "sage"
              ? "text-sage"
              : "text-ink-900",
        )}
      >
        {value}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-400">
        {label}
      </span>
    </div>
  );
}

export default function Patients() {
  const { patient: patientParam } = Route.useSearch();
  const { patients, appointments, doctors } = useStore();
  const [q, setQ] = useState("");
  const [apiItems, setApiItems] = useState<ManagedPatient[]>([]);
  const [selectedId, setSelectedId] = useState(patients[0]?.id || null);
  const [scanOpen, setScanOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (patientParam) setSelectedId(patientParam);
  }, [patientParam]);

  const runSearch = useCallback(async (query: string) => {
    setSearching(true);
    const res = await searchPatients(query, 1);
    if (res.ok) setApiItems(res.data.items);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!clientReady) return;
    const t = setTimeout(() => void runSearch(q), 300);
    return () => clearTimeout(t);
  }, [q, runSearch, clientReady]);

  const mergedList = useMemo(() => {
    const byKey = new Map<string, (typeof patients)[number]>();
    for (const p of patients) byKey.set(p.id, p);
    for (const m of apiItems) {
      const shared = managedToSharedPatient(m);
      const key = shared.id;
      if (!byKey.has(key)) byKey.set(key, shared);
    }
    let list = Array.from(byKey.values());
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.id.toLowerCase().includes(s) ||
          p.phone.replace(/\s+/g, "").includes(s.replace(/\s+/g, "")),
      );
    }
    return list;
  }, [patients, apiItems, q]);

  const selected = mergedList.find((p) => p.id === selectedId) || mergedList[0];

  const history = useMemo(
    () =>
      selected
        ? appointments
            .filter((a) => a.patientId === selected.id)
            .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
        : [],
    [appointments, selected],
  );

  const upcoming = history.filter((a) => a.date >= TODAY_STR && a.status === "scheduled");
  const dueCount = mergedList.filter((p) => (p.balance ?? 0) > 0).length;
  const todayVisits = appointments.filter(
    (a) => a.date === TODAY_STR && a.status !== "cancelled",
  ).length;

  const onQrScan = async (token: string) => {
    const res = await resolveQr(token);
    if (!res.ok) {
      toast.error("QR not recognized", { description: res.error });
      return;
    }
    const id = res.data.patient.mrn || res.data.patient.id;
    setSelectedId(id);
    setScanOpen(false);
    toast.success(`Loaded ${res.data.patient.fullName}`);
  };

  return (
    <div data-testid="patients-page" className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {/* Page header */}
      <header className="rounded-2xl border border-ink-200 bg-gradient-to-br from-white via-white to-sage-soft/35 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono font-medium uppercase tracking-[0.16em] text-sage">
              Reception · Records
            </p>
            <h1 className="mt-1 font-heading text-[22px] font-semibold tracking-tight text-ink-900 sm:text-[24px]">
              Patients
            </h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-500">
              Find a record, scan a patient ID, then book, check in, or update the profile without
              leaving the desk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatChip label="In registry" value={mergedList.length} tone="sage" />
            <StatChip label="Balance due" value={dueCount} tone={dueCount ? "warn" : "default"} />
            <StatChip label="Today" value={todayVisits} />
            <Link
              to="/reception/register"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-sage px-4 text-[13px] font-semibold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-sage-hover"
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Directory */}
        <section className="flex h-[min(72vh,780px)] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-ink-100 bg-bone/30 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                data-testid="patients-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, MRN, phone…"
                className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 text-[13px] outline-none transition-shadow placeholder:text-ink-400 focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-ink-400">
                {mergedList.length} match{mergedList.length === 1 ? "" : "es"}
                {searching ? " · searching…" : ""}
              </div>
              <button
                type="button"
                data-testid="patients-scan-qr"
                onClick={() => setScanOpen((o) => !o)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors",
                  scanOpen
                    ? "bg-sage text-white"
                    : "border border-ink-200 bg-white text-sage hover:border-sage/40 hover:bg-sage-soft/40",
                )}
              >
                {scanOpen ? <X className="h-3.5 w-3.5" /> : <ScanLine className="h-3.5 w-3.5" />}
                {scanOpen ? "Close scanner" : "Scan ID"}
              </button>
            </div>
            {scanOpen ? (
              <div className="overflow-hidden rounded-xl border border-sage/20 bg-sage-soft/30 p-3">
                <p className="mb-2 text-[11px] text-ink-500">
                  Point the camera at the hospital patient QR, or paste a token.
                </p>
                <QrScanner onScan={(t) => void onQrScan(t)} />
              </div>
            ) : null}
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {mergedList.map((p) => {
              const active = selected?.id === p.id;
              const due = (p.balance ?? 0) > 0;
              return (
                <li key={p.id} className="border-b border-ink-100 last:border-0">
                  <button
                    data-testid={`patient-row-${p.id}`}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                      active
                        ? "bg-sage-soft/70"
                        : "hover:bg-bone/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                        active
                          ? "bg-sage text-white"
                          : "bg-sage-soft text-sage group-hover:bg-white",
                      )}
                    >
                      {initials(p.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-ink-900">
                          {p.name}
                        </span>
                        {due ? (
                          <span className="shrink-0 rounded-full border border-status-noshowBorder bg-status-noshowBg px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-status-noshowText">
                            Due ₹{p.balance}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-400">
                        {p.id} · {p.phone}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11px] font-mono text-ink-500">
                        {age(p.dob)} y · {p.gender?.[0] || "—"}
                      </span>
                      <ChevronRight
                        className={cn(
                          "ml-auto mt-1 h-3.5 w-3.5",
                          active ? "text-sage" : "text-ink-300",
                        )}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
            {mergedList.length === 0 ? (
              <li className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <Users className="h-8 w-8 text-ink-300" />
                <p className="text-[13px] font-medium text-ink-600">No patients match</p>
                <p className="text-[12px] text-ink-400">
                  Try another search, scan an ID, or register a new patient.
                </p>
                <Link
                  to="/reception/register"
                  className="mt-2 text-[12.5px] font-semibold text-sage hover:underline"
                >
                  Open registration
                </Link>
              </li>
            ) : null}
          </ul>
        </section>

        {/* Detail pane */}
        <section className="min-w-0 space-y-4">
          {!selected ? (
            <div className="flex h-[min(72vh,420px)] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-bone/20 px-6 text-center">
              <Users className="h-10 w-10 text-ink-300" />
              <p className="font-heading text-[17px] font-semibold text-ink-700">
                Select a patient
              </p>
              <p className="max-w-sm text-[13px] text-ink-400">
                Choose someone from the directory, or scan their hospital QR to open the chart.
              </p>
            </div>
          ) : (
            <>
              {/* Selected patient hero + actions */}
              <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                <div className="border-b border-ink-100 bg-sage px-5 py-4 text-white sm:px-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 text-[16px] font-heading font-semibold">
                      {initials(selected.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-heading text-[20px] font-semibold">
                          {selected.name}
                        </h2>
                        {(selected.balance ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Balance due
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-[12px] text-white/75">
                        {selected.id} · {selected.phone}
                        {selected.dob ? ` · ${age(selected.dob)} y` : ""}
                        {selected.gender ? ` · ${selected.gender}` : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
                        Outstanding
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-0.5 font-heading text-[18px] font-semibold tabular-nums">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {(selected.balance ?? 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-4 py-3.5 sm:px-5">
                  <Link
                    to="/reception/appointments/new"
                    search={{ patient: selected.id }}
                    data-testid="patient-book"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-sage px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-sage-hover"
                  >
                    <CalendarPlus className="h-4 w-4" /> Book
                  </Link>
                  <Link
                    to="/reception/check-in"
                    data-testid="patient-checkin"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-semibold text-ink-900 transition-colors hover:border-ink-400 hover:bg-bone"
                  >
                    <LogIn className="h-4 w-4" /> Check-in
                  </Link>
                  <Link
                    to="/reception/insurance"
                    search={{ patientId: selected.id, action: "new-preauth" }}
                    data-testid="patient-preauth"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-semibold text-ink-900 transition-colors hover:border-ink-400 hover:bg-bone"
                  >
                    <Shield className="h-4 w-4 text-sage" /> Pre-auth
                  </Link>
                  <button
                    data-testid="patient-print"
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition-colors hover:bg-bone hover:text-ink-900"
                    aria-label="Print patient card"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {clientReady ? (
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                  <div className="border-b border-ink-100 bg-bone/30 px-5 py-3">
                    <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-400">
                      Chart
                    </p>
                    <p className="text-[14px] font-heading font-semibold text-ink-900">
                      Profile & clinical record
                    </p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <PatientProfileWorkspace
                      patientId={selected.id}
                      mode="staff"
                      sharedPatient={selected}
                      embedded
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center text-[13px] text-ink-400 shadow-sm">
                  Loading patient profile…
                </div>
              )}

              {/* Visits */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
                    <Clock3 className="h-4 w-4 text-sage" />
                    <div>
                      <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-ink-400">
                        Schedule
                      </p>
                      <p className="text-[13.5px] font-heading font-semibold text-ink-900">
                        Upcoming
                      </p>
                    </div>
                    <span className="ml-auto rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-mono font-semibold text-sage">
                      {upcoming.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink-100">
                    {upcoming.length === 0 ? (
                      <li className="px-5 py-8 text-center text-[12.5px] text-ink-400">
                        No upcoming visits.
                        <Link
                          to="/reception/appointments/new"
                          search={{ patient: selected.id }}
                          className="mt-1 block font-semibold text-sage hover:underline"
                        >
                          Book an appointment
                        </Link>
                      </li>
                    ) : null}
                    {upcoming.map((a) => {
                      const d = doctors.find((x) => x.id === a.doctorId);
                      return (
                        <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-[4.5rem] shrink-0 font-mono text-[12px] text-ink-900">
                            {a.date.slice(5)}
                            <div className="text-ink-400">{a.time}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] font-medium text-ink-900">
                              {d?.name}
                            </div>
                            <div className="text-[11px] text-ink-400">{a.type}</div>
                          </div>
                          <StatusPill status={a.status} />
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
                    <Users className="h-4 w-4 text-sage" />
                    <div>
                      <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-ink-400">
                        Timeline
                      </p>
                      <p className="text-[13.5px] font-heading font-semibold text-ink-900">
                        Visit history
                      </p>
                    </div>
                    <span className="ml-auto rounded-full bg-bone px-2 py-0.5 text-[10px] font-mono font-semibold text-ink-500">
                      {Math.min(history.length, 6)}
                      {history.length > 6 ? "+" : ""}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink-100">
                    {history.length === 0 ? (
                      <li className="px-5 py-8 text-center text-[12.5px] text-ink-400">
                        No visit history yet.
                      </li>
                    ) : null}
                    {history.slice(0, 6).map((a) => {
                      const d = doctors.find((x) => x.id === a.doctorId);
                      return (
                        <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-[4.5rem] shrink-0 font-mono text-[12px] text-ink-500">
                            {a.date.slice(5)}
                          </div>
                          <div className="min-w-0 flex-1 truncate text-[12.5px] text-ink-900">
                            {d?.name} · {a.type}
                          </div>
                          <StatusPill status={a.status} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
