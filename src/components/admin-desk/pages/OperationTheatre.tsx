import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Thermometer,
  Droplets,
  Gauge,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Wind,
  User,
  Stethoscope,
  Timer,
  Activity,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { loadServiceFees } from "@/lib/shared/services";

interface SurgicalCase {
  procedure: string;
  surgeon: string;
  anaesthetist: string;
  patientName: string;
  mrn: string;
  durationMins: number;
  elapsedMins: number;
}

interface OperationalOT {
  id: string;
  name: string;
  status: "occupied" | "available" | "cleaning" | "maintenance";
  tempCelsius: number;
  humidityPct: number;
  achRate: number;
  positivePressurePascal: number;
  oxygenBar: number;
  nitrousBar: number;
  vacuumBar: number;
  activeCase?: SurgicalCase;
}

const SEED_OPERATIONAL_OTS: OperationalOT[] = [
  {
    id: "OT-1", name: "Theatre 1", status: "occupied",
    tempCelsius: 19.5, humidityPct: 52, achRate: 24, positivePressurePascal: 18.2,
    oxygenBar: 4.1, nitrousBar: 4.0, vacuumBar: -0.62,
    activeCase: {
      procedure: "Knee Arthroscopy & ACL Reconstruction",
      surgeon: "Dr. Rohan Bhatt", anaesthetist: "Dr. Sandeep Sen",
      patientName: "Ravi Deshmukh", mrn: "MRN-100234",
      durationMins: 90, elapsedMins: 45,
    },
  },
  {
    id: "OT-2", name: "Theatre 2", status: "available",
    tempCelsius: 20.1, humidityPct: 48, achRate: 22, positivePressurePascal: 16.5,
    oxygenBar: 4.2, nitrousBar: 4.1, vacuumBar: -0.65,
  },
  {
    id: "OT-3", name: "Theatre 3", status: "cleaning",
    tempCelsius: 21.0, humidityPct: 55, achRate: 26, positivePressurePascal: 15.0,
    oxygenBar: 4.0, nitrousBar: 3.9, vacuumBar: -0.58,
  },
  {
    id: "OT-4", name: "Theatre 4", status: "occupied",
    tempCelsius: 18.8, humidityPct: 50, achRate: 25, positivePressurePascal: 19.1,
    oxygenBar: 4.3, nitrousBar: 4.2, vacuumBar: -0.68,
    activeCase: {
      procedure: "Emergency Lower Segment C-Section",
      surgeon: "Dr. Priya Nair", anaesthetist: "Dr. Ananya Ray",
      patientName: "Sneha Rao", mrn: "MRN-100232",
      durationMins: 60, elapsedMins: 10,
    },
  },
  {
    id: "OT-5", name: "Theatre 5", status: "available",
    tempCelsius: 19.8, humidityPct: 49, achRate: 23, positivePressurePascal: 17.0,
    oxygenBar: 4.1, nitrousBar: 4.0, vacuumBar: -0.61,
  },
  {
    id: "OT-6", name: "Theatre 6", status: "maintenance",
    tempCelsius: 22.5, humidityPct: 42, achRate: 12, positivePressurePascal: 5.4,
    oxygenBar: 0.2, nitrousBar: 0.1, vacuumBar: -0.05,
  },
];

const STATUS_CONFIG = {
  occupied: {
    label: "In Surgery",
    accent: "border-l-plum",
    badge: "bg-plum/10 text-plum border-plum/20",
    dot: "bg-plum animate-pulse",
    icon: Activity,
    headerBg: "bg-gradient-to-r from-plum/5 to-transparent",
  },
  available: {
    label: "Available",
    accent: "border-l-teal",
    badge: "bg-teal/10 text-teal border-teal/20",
    dot: "bg-teal",
    icon: CheckCircle2,
    headerBg: "bg-gradient-to-r from-teal/5 to-transparent",
  },
  cleaning: {
    label: "Post-Op Cleaning",
    accent: "border-l-mustard",
    badge: "bg-mustard/10 text-mustard border-mustard/20",
    dot: "bg-mustard animate-pulse",
    icon: Wind,
    headerBg: "bg-gradient-to-r from-mustard/5 to-transparent",
  },
  maintenance: {
    label: "HVAC Maintenance",
    accent: "border-l-stone-400",
    badge: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
    icon: Wrench,
    headerBg: "bg-gradient-to-r from-stone-100/50 to-transparent",
  },
};

function SensorPill({ icon: Icon, value, label, ok }: { icon: React.ElementType; value: string; label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${ok ? "bg-white border-stone-200 text-ink-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${ok ? "text-ink-400" : "text-red-500"}`} />
      <div>
        <div className={`text-[12px] font-mono font-semibold leading-none ${ok ? "text-ink-800" : "text-red-700"}`}>{value}</div>
        <div className="text-[9px] text-ink-400 uppercase tracking-wider leading-none mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function GasReadingRow({ label, value, unit, safe }: { label: string; value: number; unit: string; safe: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <span className="text-[12px] text-ink-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[13px] font-mono font-semibold ${safe ? "text-teal" : "text-red-600"}`}>
          {value > 0 ? "+" : ""}{value.toFixed(2)} {unit}
        </span>
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${safe ? "bg-teal/10 text-teal" : "bg-red-100 text-red-600"}`}>
          {safe ? "OK" : "!"}
        </span>
      </div>
    </div>
  );
}

export default function OperationTheatrePage() {
  const [rooms, setRooms] = useState<OperationalOT[]>(() => {
    if (typeof window === "undefined") return SEED_OPERATIONAL_OTS;
    try {
      const raw = localStorage.getItem("medora-admin-ot-rooms-v2");
      return raw ? JSON.parse(raw) : SEED_OPERATIONAL_OTS;
    } catch { return SEED_OPERATIONAL_OTS; }
  });

  const [schedulerRoomId, setSchedulerRoomId] = useState<string | null>(null);
  const [formProcedure, setFormProcedure] = useState("");
  const [formSurgeonId, setFormSurgeonId] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formPatientMrn, setFormPatientMrn] = useState("");
  const [formAnaesthetist, setFormAnaesthetist] = useState("");
  const [formDuration, setFormDuration] = useState("90");

  const doctorsList = loadServiceFees();

  const persist = (next: OperationalOT[]) => {
    setRooms(next);
    localStorage.setItem("medora-admin-ot-rooms-v2", JSON.stringify(next));
  };

  const setRoomStatus = (roomId: string, status: OperationalOT["status"]) => {
    const next = rooms.map((r) => {
      if (r.id !== roomId) return r;
      const updated: OperationalOT = {
        ...r, status,
        tempCelsius: status === "maintenance" ? 22.5 : status === "cleaning" ? 21.0 : 19.8,
        achRate: status === "maintenance" ? 12 : 24,
        positivePressurePascal: status === "maintenance" ? 5.0 : 17.5,
        oxygenBar: status === "maintenance" ? 0.2 : 4.1,
        nitrousBar: status === "maintenance" ? 0.1 : 4.0,
        vacuumBar: status === "maintenance" ? -0.05 : -0.62,
      };
      if (status !== "occupied") delete updated.activeCase;
      return updated;
    });
    persist(next);
    toast.info(`${roomId} → ${status}`);
  };

  const openScheduler = (roomId: string) => {
    setSchedulerRoomId(roomId);
    setFormProcedure("");
    setFormSurgeonId(doctorsList[0]?.doctorId ?? "");
    setFormPatientName("");
    setFormPatientMrn(`MRN-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormAnaesthetist("Dr. Sandeep Sen");
    setFormDuration("90");
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerRoomId || !formProcedure || !formPatientName) return;
    const doc = doctorsList.find((d) => d.doctorId === formSurgeonId);
    const next = rooms.map((r) => {
      if (r.id !== schedulerRoomId) return r;
      return {
        ...r, status: "occupied" as const,
        tempCelsius: 19.2, humidityPct: 50, achRate: 25,
        positivePressurePascal: 18.5, oxygenBar: 4.2, nitrousBar: 4.1, vacuumBar: -0.64,
        activeCase: {
          procedure: formProcedure,
          surgeon: doc?.doctorName ?? "Unknown Doctor",
          anaesthetist: formAnaesthetist,
          patientName: formPatientName,
          mrn: formPatientMrn,
          durationMins: Number(formDuration),
          elapsedMins: 0,
        },
      };
    });
    persist(next);
    setSchedulerRoomId(null);
    toast.success(`Surgery scheduled in ${schedulerRoomId}`);
  };

  const isTempOk = (t: number) => t >= 18.0 && t <= 21.5;
  const isHumOk = (h: number) => h >= 45 && h <= 60;
  const isACHOk = (a: number) => a >= 20;

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const availableCount = rooms.filter((r) => r.status === "available").length;
  const cleaningCount = rooms.filter((r) => r.status === "cleaning").length;
  const maintenanceCount = rooms.filter((r) => r.status === "maintenance").length;
  const liveUtil = Math.round((occupiedCount / totalRooms) * 100);

  return (
    <div className="space-y-6" data-testid="admin-ot">

      {/* ── KPI Strip ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Live Utilization", value: `${liveUtil}%`, sub: `${occupiedCount}/${totalRooms} theatres active`, color: "text-plum", border: "border-l-plum" },
          { label: "Available", value: String(availableCount), sub: "Ready for intake", color: "text-teal", border: "border-l-teal" },
          { label: "Post-Op Clean", value: String(cleaningCount), sub: "Sanitisation queue", color: "text-mustard", border: "border-l-mustard" },
          { label: "HVAC Service", value: String(maintenanceCount), sub: "Under maintenance", color: "text-stone-500", border: "border-l-stone-300" },
        ].map((k) => (
          <div key={k.label} className={`surface px-5 py-4 border-l-4 ${k.border} shadow-soft`}>
            <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">{k.label}</p>
            <p className={`mt-1.5 text-3xl font-heading font-bold ${k.color} tabular-nums`}>{k.value}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Layout ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

        {/* Left sidebar */}
        <div className="space-y-5">

          {/* Utilization gauge */}
          <div className="surface p-5 flex flex-col items-center shadow-soft">
            <p className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono w-full pb-3 border-b border-stone-100 mb-4 text-center">
              OT Load
            </p>
            <div className="relative h-40 w-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: liveUtil }, { v: 100 - liveUtil }]} dataKey="v"
                    innerRadius={56} outerRadius={72} startAngle={90} endAngle={-270}>
                    <Cell fill="#6B3FA0" />
                    <Cell fill="#E6E1DA" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[30px] font-heading font-bold text-plum leading-none">{liveUtil}%</span>
                <span className="text-[9px] uppercase tracking-wider text-ink-400 font-mono mt-1">Live</span>
              </div>
            </div>
            <p className="text-[11px] text-ink-400 mt-3 text-center leading-relaxed">
              Calculated across {totalRooms} theatres
            </p>
          </div>

          {/* Gas manifold panel */}
          <div className="surface p-5 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <p className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                Gas Manifold
              </p>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                All Safe
              </span>
            </div>
            <GasReadingRow label="Oxygen (O₂)" value={4.2} unit="bar" safe={true} />
            <GasReadingRow label="Nitrous Oxide" value={4.1} unit="bar" safe={true} />
            <GasReadingRow label="Vacuum" value={-0.64} unit="bar" safe={true} />
            <GasReadingRow label="Air Compressor" value={4.0} unit="bar" safe={true} />
          </div>
        </div>

        {/* Theatre room cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 content-start">
          {rooms.map((room) => {
            const cfg = STATUS_CONFIG[room.status];
            const StatusIcon = cfg.icon;
            const hasCase = room.status === "occupied" && room.activeCase;
            const progress = hasCase
              ? Math.min(100, Math.round(((room.activeCase!.elapsedMins) / (room.activeCase!.durationMins)) * 100))
              : 0;

            return (
              <div
                key={room.id}
                className={`surface border-l-4 ${cfg.accent} shadow-soft overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift`}
              >
                {/* Card header */}
                <div className={`${cfg.headerBg} px-4 py-3 flex items-center justify-between border-b border-stone-100`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                    <div>
                      <p className="font-heading font-semibold text-[14px] text-ink-950 leading-tight">{room.name}</p>
                      <p className="text-[10px] text-ink-400 font-mono">{room.id}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Environment sensors strip */}
                <div className="px-4 py-2.5 bg-stone-50/60 border-b border-stone-100 flex items-center gap-2 flex-wrap">
                  <SensorPill icon={Thermometer} value={`${room.tempCelsius.toFixed(1)}°C`} label="Temp" ok={isTempOk(room.tempCelsius)} />
                  <SensorPill icon={Droplets} value={`${room.humidityPct}%`} label="RH" ok={isHumOk(room.humidityPct)} />
                  <SensorPill icon={Gauge} value={`${room.achRate} ACH`} label="Ventilation" ok={isACHOk(room.achRate)} />
                </div>

                {/* Body */}
                <div className="px-4 py-4 flex-1 space-y-4">
                  {hasCase ? (
                    <>
                      {/* Procedure name */}
                      <div>
                        <p className="text-[9.5px] uppercase tracking-widest text-ink-400 font-mono mb-1">Active Procedure</p>
                        <p className="font-semibold text-ink-950 text-[13.5px] leading-snug">{room.activeCase!.procedure}</p>
                      </div>

                      {/* Staff grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-full bg-plum/10 text-plum grid place-items-center shrink-0 mt-0.5">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-ink-400 font-mono tracking-wider">Surgeon</p>
                            <p className="text-[12px] font-semibold text-ink-900 leading-snug">{room.activeCase!.surgeon}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-full bg-teal/10 text-teal grid place-items-center shrink-0 mt-0.5">
                            <Stethoscope className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-ink-400 font-mono tracking-wider">Anaesthetist</p>
                            <p className="text-[12px] font-semibold text-ink-900 leading-snug">{room.activeCase!.anaesthetist}</p>
                          </div>
                        </div>
                      </div>

                      {/* Patient chip */}
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-md px-3 py-2">
                        <div className="h-6 w-6 rounded-full bg-mustard/10 text-mustard grid place-items-center shrink-0">
                          <User className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-ink-900 truncate">{room.activeCase!.patientName}</p>
                          <p className="text-[10px] text-ink-400 font-mono">{room.activeCase!.mrn}</p>
                        </div>
                      </div>

                      {/* Surgery progress timeline */}
                      <div>
                        <div className="flex justify-between text-[10.5px] text-ink-500 font-mono mb-1.5">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {room.activeCase!.elapsedMins}m elapsed
                          </span>
                          <span>{progress}% · {room.activeCase!.durationMins - room.activeCase!.elapsedMins}m remaining</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-plum transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                      <div className={`h-10 w-10 rounded-full grid place-items-center ${cfg.badge} border`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <p className="text-[12px] text-ink-500 font-medium">{cfg.label}</p>
                      <p className="text-[11px] text-ink-400">
                        {room.status === "available" && "Ready for surgical intake"}
                        {room.status === "cleaning" && "Post-op sanitization in progress"}
                        {room.status === "maintenance" && "HVAC filter service underway"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-4 pb-4 pt-0 flex items-center justify-between gap-2 flex-wrap border-t border-stone-100 mt-auto pt-3">
                  {/* Status quick-set */}
                  <div className="flex items-center gap-1">
                    {(["available", "cleaning", "maintenance"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setRoomStatus(room.id, s)}
                        className={`text-[10px] px-2 py-1 rounded border transition font-medium ${
                          room.status === s
                            ? s === "available" ? "bg-teal/10 border-teal/30 text-teal"
                            : s === "cleaning" ? "bg-mustard/10 border-mustard/30 text-mustard"
                            : "bg-stone-100 border-stone-300 text-stone-600"
                            : "bg-white border-stone-200 text-ink-500 hover:bg-stone-50"
                        }`}
                      >
                        {s === "available" ? "Free" : s === "cleaning" ? "Clean" : "Service"}
                      </button>
                    ))}
                  </div>

                  {room.status !== "occupied" ? (
                    <button
                      onClick={() => openScheduler(room.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-plum text-white hover:bg-plum/85 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Schedule
                    </button>
                  ) : (
                    <button
                      onClick={() => setRoomStatus(room.id, "cleaning")}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-white border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      Close Case
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Surgery Scheduler Modal ────────────────────────────── */}
      {schedulerRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-plum/10 text-plum grid place-items-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-ink-950 text-[15px]">Schedule Surgical Case</h3>
                <p className="text-[11.5px] text-ink-400 font-mono mt-0.5">{schedulerRoomId} · {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</p>
              </div>
              <button type="button" onClick={() => setSchedulerRoomId(null)} className="text-ink-400 hover:text-ink-700 transition p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 overflow-y-auto space-y-5">

              {/* Procedure */}
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Procedure Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Open Cholecystectomy"
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13.5px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                />
              </div>

              {/* Patient row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13.5px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">MRN</label>
                  <input
                    type="text"
                    required
                    value={formPatientMrn}
                    onChange={(e) => setFormPatientMrn(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13.5px] font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>
              </div>

              {/* Surgeon + Anaesthetist */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Lead Surgeon</label>
                  <select
                    value={formSurgeonId}
                    onChange={(e) => setFormSurgeonId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3 text-[13px] text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  >
                    {doctorsList.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Anaesthetist</label>
                  <input
                    type="text"
                    required
                    value={formAnaesthetist}
                    onChange={(e) => setFormAnaesthetist(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13.5px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>
              </div>

              {/* Duration selector – visual chips */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Estimated Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["30", "30 min"], ["60", "1 hour"], ["90", "1.5 hours"], ["120", "2 hours"], ["180", "3 hours"], ["240", "4 hours"]].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormDuration(val)}
                      className={`h-10 rounded-lg border text-[12px] font-semibold transition ${
                        formDuration === val
                          ? "bg-plum text-white border-plum shadow-sm"
                          : "bg-white text-ink-700 border-stone-200 hover:border-plum/40 hover:bg-plum/5"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center bg-stone-50/60 shrink-0">
              <button
                type="button"
                onClick={() => setSchedulerRoomId(null)}
                className="text-[12.5px] font-medium text-ink-600 hover:text-ink-900 transition px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-plum text-white text-[13px] font-semibold hover:bg-plum/85 transition shadow-sm"
              >
                <Activity className="h-4 w-4" />
                Begin Procedure
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
