import React, { useMemo, useState } from "react";
import { useStore, Bed, AdmissionRecord, WARD_CATEGORIES } from "@/lib/reception-desk/store";
import type { SharedPatient } from "@/lib/shared/patients";
import type { DOCTORS } from "@/lib/reception-desk/mockData";

type ReceptionDoctor = (typeof DOCTORS)[number];
import { toast } from "sonner";
import {
  Search,
  Bed as BedIcon,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  AlertTriangle,
  IndianRupee,
  Activity,
  FileText,
  Sparkles,
  Check,
  X,
  Snowflake,
  Tv,
  Wind,
  Users,
  UserX,
} from "lucide-react";

const fmt = (n: number | string | undefined) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const calcDaysAdmittedStr = (admittedAt: string) => {
  if (!admittedAt) return "—";
  const start = new Date(admittedAt);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  if (days <= 1) return "Today";
  return `${days}d`;
};

function BedAmenities({ category }: { category: Bed["wardCategory"] }) {
  const iconCls = "w-3 h-3 shrink-0";
  switch (category) {
    case "general":
      return (
        <span className="inline-flex items-center gap-2 text-[10px] text-ink-400">
          <span className="inline-flex items-center gap-0.5">
            <Wind className={iconCls} /> Fan
          </span>
          <span className="inline-flex items-center gap-0.5">
            <UserX className={iconCls} /> No guest
          </span>
        </span>
      );
    case "semi-private":
      return (
        <span className="inline-flex items-center gap-2 text-[10px] text-ink-400">
          <span className="inline-flex items-center gap-0.5">
            <Wind className={iconCls} /> Fan
          </span>
          <span className="inline-flex items-center gap-0.5 text-teal">
            <User className={iconCls} /> 1 guest
          </span>
        </span>
      );
    case "private-deluxe":
      return (
        <span className="inline-flex items-center gap-2 text-[10px] text-ink-500">
          <span className="inline-flex items-center gap-0.5 text-teal">
            <Snowflake className={iconCls} /> AC
          </span>
          <span className="inline-flex items-center gap-0.5 text-plum">
            <Tv className={iconCls} /> TV
          </span>
          <span className="inline-flex items-center gap-0.5 text-sage">
            <Users className={iconCls} /> 3 guests
          </span>
        </span>
      );
    case "icu":
      return (
        <span className="inline-flex items-center gap-2 text-[10px] text-ink-400">
          <span className="inline-flex items-center gap-0.5 text-clay font-semibold">
            <Activity className={`${iconCls} animate-pulse`} /> Ventilator
          </span>
          <span className="inline-flex items-center gap-0.5">
            <UserX className={iconCls} /> No visitors
          </span>
        </span>
      );
  }
}

const MOCK_RECOMMENDATIONS = [
  {
    patientId: "MRN-100234",
    name: "Aman Gupta",
    age: 45,
    gender: "Male",
    diagnosis: "Severe Acute Pancreatitis (ICD K85.9)",
    recommendedWard: "icu" as const,
    recommendedBy: "DOC-005",
    recommendedAt: "10 mins ago",
  },
  {
    patientId: "MRN-100235",
    name: "Rohan Gupta",
    age: 28,
    gender: "Male",
    diagnosis: "Post-op ACL Reconstruction Observation",
    recommendedWard: "semi-private" as const,
    recommendedBy: "DOC-003",
    recommendedAt: "2 hours ago",
  },
];

type WardFilter = "all" | Bed["wardCategory"];
type StatusFilter = "all" | Bed["status"];

export default function Admissions() {
  const {
    patients,
    doctors,
    beds,
    admissions,
    admitPatient,
    transferPatient,
    initiateDischarge,
    finalizeDischarge,
    clearMaintenanceBed,
  } = useStore();

  const [selectedBedId, setSelectedBedId] = useState<string>("B-101");
  const [wardFilter, setWardFilter] = useState<WardFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bedSearch, setBedSearch] = useState("");

  const [admitPatientId, setAdmitPatientId] = useState("");
  const [admitDoctorId, setAdmitDoctorId] = useState("DOC-001");
  const [admitTariff, setAdmitTariff] = useState<"standard" | "star-corporate" | "cghs" | "staff">(
    "standard",
  );
  const [admitDeposit, setAdmitDeposit] = useState("5000");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [transferTargetBedId, setTransferTargetBedId] = useState("");
  const [dischargeChecklist, setDischargeChecklist] = useState({
    clinicalClearance: false,
    medsDispensed: false,
    interimBillGenerated: false,
    duesCleared: false,
  });

  const selectedBed = useMemo(() => {
    return beds.find((b: Bed) => b.id === selectedBedId) || beds[0];
  }, [beds, selectedBedId]);

  const activeAdmissionForSelectedBed = useMemo(() => {
    if (!selectedBed || selectedBed.status !== "occupied") return null;
    return admissions.find(
      (a: AdmissionRecord) => a.bedId === selectedBed.id && a.status !== "discharged",
    );
  }, [selectedBed, admissions]);

  const activeAdmissionsList = useMemo(() => {
    return admissions.filter((a: AdmissionRecord) => a.status !== "discharged");
  }, [admissions]);

  const occupancy = useMemo(() => {
    const available = beds.filter((b) => b.status === "available").length;
    const occupied = beds.filter((b) => b.status === "occupied").length;
    const maintenance = beds.filter((b) => b.status === "maintenance").length;
    return { available, occupied, maintenance, total: beds.length };
  }, [beds]);

  const filteredBeds = useMemo(() => {
    const q = bedSearch.trim().toLowerCase();
    return beds.filter((b: Bed) => {
      if (wardFilter !== "all" && b.wardCategory !== wardFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      const adm = admissions.find(
        (a: AdmissionRecord) => a.bedId === b.id && a.status !== "discharged",
      );
      const pat = adm ? patients.find((p: SharedPatient) => p.id === adm.patientId) : null;
      return (
        b.id.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        (pat?.name || "").toLowerCase().includes(q) ||
        (pat?.mrn || "").toLowerCase().includes(q)
      );
    });
  }, [beds, wardFilter, statusFilter, bedSearch, admissions, patients]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return [];
    return patients.filter(
      (p: SharedPatient) =>
        p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.phone.includes(patientSearchQuery),
    );
  }, [patients, patientSearchQuery]);

  const getBedStatusBadge = (status: Bed["status"]) => {
    switch (status) {
      case "available":
        return <span className="chip-money">Available</span>;
      case "occupied":
        return <span className="chip-teal">Occupied</span>;
      case "maintenance":
        return <span className="chip-mustard">Cleaning</span>;
    }
  };

  const getWardName = (ward: Bed["wardCategory"]) => {
    switch (ward) {
      case "general":
        return "General Ward";
      case "semi-private":
        return "Semi-Private";
      case "private-deluxe":
        return "Private Deluxe";
      case "icu":
        return "ICU";
    }
  };

  const handleApplyRecommendation = (rec: (typeof MOCK_RECOMMENDATIONS)[0]) => {
    setAdmitPatientId(rec.patientId);
    setAdmitDoctorId(rec.recommendedBy);
    setPatientSearchQuery(rec.name);
    setWardFilter(rec.recommendedWard);
    const availBed = beds.find(
      (b: Bed) => b.wardCategory === rec.recommendedWard && b.status === "available",
    );
    if (availBed) setSelectedBedId(availBed.id);
    toast.success(`Loaded admission for ${rec.name}`);
  };

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatientId) {
      toast.error("Please select a patient to admit.");
      return;
    }
    if (!selectedBed || selectedBed.status !== "available") {
      toast.error("Selected bed is not available.");
      return;
    }
    const depositVal = parseFloat(admitDeposit) || 0;
    admitPatient(admitPatientId, selectedBed.id, admitDoctorId, admitTariff, depositVal);
    setAdmitPatientId("");
    setPatientSearchQuery("");
    setAdmitDeposit("5000");
    toast.success(`Admitted to ${selectedBed.name}`);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmissionForSelectedBed) return;
    if (!transferTargetBedId) {
      toast.error("Please select a target bed.");
      return;
    }
    transferPatient(activeAdmissionForSelectedBed.id, transferTargetBedId);
    toast.success(`Transferred to ${transferTargetBedId}`);
    setSelectedBedId(transferTargetBedId);
    setTransferTargetBedId("");
  };

  const handleInitiateDischarge = () => {
    if (!activeAdmissionForSelectedBed) return;
    initiateDischarge(activeAdmissionForSelectedBed.id);
    toast.success("Discharge initiated — pending billing clearance.");
  };

  const handleFinalizeDischarge = () => {
    if (!activeAdmissionForSelectedBed) return;
    if (
      !dischargeChecklist.clinicalClearance ||
      !dischargeChecklist.medsDispensed ||
      !dischargeChecklist.interimBillGenerated ||
      !dischargeChecklist.duesCleared
    ) {
      toast.error("Clear all discharge checklist items first.");
      return;
    }
    finalizeDischarge(activeAdmissionForSelectedBed.id);
    toast.success("Discharge finalized. Bed set to cleaning.");
    setDischargeChecklist({
      clinicalClearance: false,
      medsDispensed: false,
      interimBillGenerated: false,
      duesCleared: false,
    });
  };

  const handleClearMaintenance = () => {
    if (!selectedBed || selectedBed.status !== "maintenance") return;
    clearMaintenanceBed(selectedBed.id);
    toast.success(`${selectedBed.id} marked available.`);
  };

  const stayStats = useMemo(() => {
    if (!activeAdmissionForSelectedBed) return null;
    const rate = WARD_CATEGORIES.find((w) => w.id === selectedBed.wardCategory)?.ratePerDay || 0;
    const start = new Date(activeAdmissionForSelectedBed.admittedAt);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const rawCost = rate * days;

    let discount = 0;
    let tariffName = "Standard";
    if (activeAdmissionForSelectedBed.tariffPlan === "star-corporate") {
      discount = rawCost * 0.15;
      tariffName = "Star Corporate (−15%)";
    } else if (activeAdmissionForSelectedBed.tariffPlan === "staff") {
      discount = rawCost * 0.5;
      tariffName = "Staff (−50%)";
    } else if (activeAdmissionForSelectedBed.tariffPlan === "cghs") {
      const capRate = Math.min(rate, 1000);
      discount = (rate - capRate) * days;
      tariffName = "CGHS capped";
    }

    const netCost = rawCost - discount;
    const deposit = activeAdmissionForSelectedBed.depositAmount || 0;
    const balanceDue = netCost - deposit;

    return { days, rate, rawCost, discount, netCost, deposit, balanceDue, tariffName };
  }, [activeAdmissionForSelectedBed, selectedBed]);

  const wardTabs: { id: WardFilter; label: string; count: number }[] = [
    { id: "all", label: "All wards", count: beds.length },
    ...WARD_CATEGORIES.map((cat) => ({
      id: cat.id as WardFilter,
      label: cat.name,
      count: beds.filter((b) => b.wardCategory === cat.id).length,
    })),
  ];

  return (
    <div
      data-testid="admissions-page"
      className="-mx-4 -my-5 sm:-mx-6 sm:-my-6 lg:-mx-8 flex h-[calc(100dvh-3.75rem)] flex-col overflow-hidden bg-paper sm:h-[calc(100dvh-4.25rem)] lg:h-[calc(100dvh-4.75rem)]"
    >
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-ink-200 bg-white">
        <div className="flex flex-wrap items-stretch divide-x divide-ink-200">
          <div className="flex items-center gap-4 px-4 py-2.5 sm:px-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                Occupancy
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5 font-heading text-[18px] font-semibold text-ink-900">
                {occupancy.occupied}
                <span className="text-[12px] font-normal text-ink-400">/ {occupancy.total}</span>
              </div>
            </div>
            <div className="hidden h-8 w-px bg-ink-200 sm:block" />
            <div className="hidden items-center gap-3 sm:flex">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
                className={`flex items-center gap-1.5 text-[11.5px] ${
                  statusFilter === "available" ? "font-semibold text-sage" : "text-ink-600"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-sage" />
                {occupancy.available} free
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "occupied" ? "all" : "occupied")}
                className={`flex items-center gap-1.5 text-[11.5px] ${
                  statusFilter === "occupied" ? "font-semibold text-teal" : "text-ink-600"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-teal" />
                {occupancy.occupied} in
              </button>
              <button
                type="button"
                onClick={() =>
                  setStatusFilter(statusFilter === "maintenance" ? "all" : "maintenance")
                }
                className={`flex items-center gap-1.5 text-[11.5px] ${
                  statusFilter === "maintenance" ? "font-semibold text-mustard" : "text-ink-600"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-mustard" />
                {occupancy.maintenance} clean
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-2">
            {wardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWardFilter(tab.id)}
                className={`shrink-0 rounded-sm px-2.5 py-1.5 text-[12px] transition-colors ${
                  wardFilter === tab.id
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-bone hover:text-ink-900"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 font-mono text-[10px] ${
                    wardFilter === tab.id ? "text-white/60" : "text-ink-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center px-3 py-2 sm:px-4">
            <div className="relative w-full min-w-[160px] sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={bedSearch}
                onChange={(e) => setBedSearch(e.target.value)}
                placeholder="Bed, patient, MRN…"
                className="h-8 w-full rounded-sm border border-ink-200 bg-bone pl-8 pr-3 text-[12.5px] focus:border-sage focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* OPD recommendations — slim strip */}
        {MOCK_RECOMMENDATIONS.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-t border-ink-100 bg-plum-soft/30 px-3 py-1.5 sm:px-5">
            <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-plum">
              <Sparkles className="h-3 w-3" />
              Admit next
            </span>
            {MOCK_RECOMMENDATIONS.map((rec) => {
              const doc = doctors.find((d: ReceptionDoctor) => d.id === rec.recommendedBy);
              return (
                <button
                  key={rec.patientId}
                  type="button"
                  onClick={() => handleApplyRecommendation(rec)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-plum/20 bg-white px-2.5 py-1 text-left text-[11.5px] transition-colors hover:border-plum/40"
                >
                  <span className="font-semibold text-ink-900">{rec.name}</span>
                  <span className="font-mono text-[10px] uppercase text-plum">
                    {rec.recommendedWard}
                  </span>
                  <span className="hidden text-ink-400 sm:inline">
                    Dr. {doc?.name.split(" ").pop()} · {rec.recommendedAt}
                  </span>
                  <Plus className="h-3 w-3 text-sage" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Body: board + ADT ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Bed board */}
        <div className="min-h-0 flex-1 overflow-y-auto border-b border-ink-200 lg:border-b-0 lg:border-r">
          {filteredBeds.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center text-[13px] text-ink-400">
              No beds match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-ink-200 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredBeds.map((bed: Bed) => {
                const active = selectedBedId === bed.id;
                const adm = admissions.find(
                  (a: AdmissionRecord) => a.bedId === bed.id && a.status !== "discharged",
                );
                const pat = adm
                  ? patients.find((p: SharedPatient) => p.id === adm.patientId)
                  : null;
                const rate =
                  WARD_CATEGORIES.find((w) => w.id === bed.wardCategory)?.ratePerDay || 0;

                let tone = "bg-white hover:bg-bone/80";
                let bar = "bg-ink-200";
                if (bed.status === "available") {
                  tone = active ? "bg-sage-soft" : "bg-white hover:bg-sage-soft/40";
                  bar = "bg-sage";
                } else if (bed.status === "occupied") {
                  tone = active ? "bg-teal-soft" : "bg-white hover:bg-teal-soft/40";
                  bar = "bg-teal";
                } else {
                  tone = active ? "bg-mustard-soft" : "bg-white hover:bg-mustard-soft/40";
                  bar = "bg-mustard";
                }

                return (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => setSelectedBedId(bed.id)}
                    className={`relative flex min-h-[108px] flex-col gap-2 p-3 text-left transition-colors ${tone} ${
                      active ? "ring-1 ring-inset ring-ink-900/20" : ""
                    }`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-0.5 ${bar}`} />
                    <div className="flex items-start justify-between gap-2 pl-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-heading text-[13px] font-semibold text-ink-900">
                          <BedIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          <span className="truncate">{bed.name}</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-ink-400">
                          {getWardName(bed.wardCategory)} · {fmt(rate)}/d
                        </div>
                      </div>
                      {bed.status === "available" && (
                        <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wide text-sage">
                          Vacant
                        </span>
                      )}
                      {bed.status === "occupied" && (
                        <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wide text-teal">
                          In
                        </span>
                      )}
                      {bed.status === "maintenance" && (
                        <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wide text-mustard">
                          Clean
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center pl-1.5">
                      {bed.status === "occupied" && pat ? (
                        <>
                          <div className="truncate font-heading text-[13px] font-bold text-ink-900">
                            {pat.name}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2 text-[10.5px] text-ink-500">
                            <span className="truncate">{pat.mrn}</span>
                            <span className="shrink-0 font-mono">
                              {calcDaysAdmittedStr(adm?.admittedAt || "")}
                            </span>
                          </div>
                        </>
                      ) : bed.status === "available" ? (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
                          Ready to admit
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-mustard">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Sanitizing
                        </div>
                      )}
                    </div>

                    <div className="border-t border-ink-100/80 pt-1.5 pl-1.5">
                      <BedAmenities category={bed.wardCategory} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ADT action rail */}
        <aside className="flex w-full shrink-0 flex-col overflow-y-auto bg-white lg:w-[360px] xl:w-[380px]">
          <div className="sticky top-0 z-10 border-b border-ink-200 bg-white px-4 py-3">
            <div className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
              <BedIcon className="h-3 w-3" />
              Selected bed
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h2 className="font-heading text-[17px] font-semibold text-ink-900">
                {selectedBed.name}
              </h2>
              <span className="font-mono text-[11px] text-ink-400">
                {fmt(WARD_CATEGORIES.find((w) => w.id === selectedBed.wardCategory)?.ratePerDay)}/d
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {getBedStatusBadge(selectedBed.status)}
              <span className="text-[11.5px] text-ink-500">{getWardName(selectedBed.wardCategory)}</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* Active IPD quick list */}
            {activeAdmissionsList.length > 0 && (
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                  Active IPD · {activeAdmissionsList.length}
                </div>
                <div className="flex max-h-[120px] flex-col gap-px overflow-y-auto border border-ink-200">
                  {activeAdmissionsList.map((adm) => {
                    const pat = patients.find((p: SharedPatient) => p.id === adm.patientId);
                    const bed = beds.find((b: Bed) => b.id === adm.bedId);
                    const active = selectedBedId === adm.bedId;
                    return (
                      <button
                        key={adm.id}
                        type="button"
                        onClick={() => setSelectedBedId(adm.bedId)}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[12px] ${
                          active ? "bg-teal-soft text-teal" : "bg-bone hover:bg-white"
                        }`}
                      >
                        <span className="truncate font-medium text-ink-900">
                          {pat?.name || adm.patientId}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-400">
                          {bed?.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admit */}
            {selectedBed.status === "available" && (
              <form onSubmit={handleAdmit} className="flex flex-col gap-3">
                <h3 className="font-heading text-[13px] font-semibold text-ink-900">
                  New admission
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-ink-500">Patient</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-400" />
                    <input
                      type="text"
                      placeholder="Name, MRN, phone…"
                      className="h-9 w-full rounded-sm border border-ink-200 bg-bone pl-8 pr-3 text-[13px] focus:border-sage focus:outline-none"
                      value={patientSearchQuery}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        if (!e.target.value) setAdmitPatientId("");
                      }}
                    />
                  </div>
                  {filteredPatients.length > 0 && !admitPatientId && (
                    <div className="max-h-[140px] overflow-y-auto border border-ink-200 bg-white">
                      {filteredPatients.map((p: SharedPatient) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setAdmitPatientId(p.id);
                            setPatientSearchQuery(p.name);
                          }}
                          className="flex w-full items-center justify-between border-b border-ink-100 px-2.5 py-1.5 text-left text-[12px] last:border-0 hover:bg-bone"
                        >
                          <span className="font-medium text-ink-900">{p.name}</span>
                          <span className="font-mono text-[11px] text-ink-400">{p.mrn}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {admitPatientId && (
                    <div className="flex items-center justify-between border border-sage/25 bg-sage-soft/50 px-2.5 py-1.5 text-[12.5px] text-sage">
                      <span className="font-medium">Selected: {patientSearchQuery}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAdmitPatientId("");
                          setPatientSearchQuery("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-ink-500">Doctor</label>
                  <select
                    className="h-9 rounded-sm border border-ink-200 bg-white px-2.5 text-[13px] focus:border-sage focus:outline-none"
                    value={admitDoctorId}
                    onChange={(e) => setAdmitDoctorId(e.target.value)}
                  >
                    {doctors.map((d: ReceptionDoctor) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-ink-500">Tariff</label>
                    <select
                      className="h-9 rounded-sm border border-ink-200 bg-white px-2 text-[12px] focus:border-sage focus:outline-none"
                      value={admitTariff}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setAdmitTariff(e.target.value as typeof admitTariff)
                      }
                    >
                      <option value="standard">Standard</option>
                      <option value="star-corporate">Star Corporate</option>
                      <option value="cghs">CGHS</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-ink-500">Deposit</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-2.5 h-3.5 w-3.5 text-ink-400" />
                      <input
                        type="number"
                        className="h-9 w-full rounded-sm border border-ink-200 bg-white pl-7 pr-2 text-[13px] focus:border-sage focus:outline-none"
                        value={admitDeposit}
                        onChange={(e) => setAdmitDeposit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-1 flex h-10 w-full items-center justify-center gap-1.5 rounded-sm bg-sage text-[13px] font-medium text-white transition-colors hover:bg-sage-hover"
                >
                  Admit to {selectedBed.name}
                </button>
              </form>
            )}

            {/* Occupied: stay + transfer + discharge */}
            {selectedBed.status === "occupied" && activeAdmissionForSelectedBed && stayStats && (
              <div className="flex flex-col gap-3">
                <div className="border border-ink-200 bg-bone p-3">
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-ink-400">
                    <span>{activeAdmissionForSelectedBed.id}</span>
                    <span className="font-semibold uppercase text-teal">
                      {activeAdmissionForSelectedBed.status}
                    </span>
                  </div>
                  <div className="mt-1 font-heading text-[15px] font-bold text-ink-900">
                    {patients.find(
                      (p: SharedPatient) => p.id === activeAdmissionForSelectedBed.patientId,
                    )?.name || activeAdmissionForSelectedBed.patientId}
                  </div>
                  <div className="mt-2 space-y-1 text-[12px] text-ink-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-ink-400" />
                      MRN{" "}
                      {
                        patients.find(
                          (p: SharedPatient) => p.id === activeAdmissionForSelectedBed.patientId,
                        )?.mrn
                      }
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-ink-400" />
                      Dr.{" "}
                      {
                        doctors.find(
                          (d: ReceptionDoctor) => d.id === activeAdmissionForSelectedBed.doctorId,
                        )?.name
                      }
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-ink-400" />
                      {new Date(activeAdmissionForSelectedBed.admittedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="border border-ink-200 p-3 text-[12px]">
                  <div className="mb-2 border-b border-ink-100 pb-1.5 font-semibold text-ink-800">
                    Stay cost
                  </div>
                  <div className="space-y-1 text-ink-600">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="font-semibold text-ink-900">{stayStats.days}d</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate</span>
                      <span>{fmt(stayStats.rate)}/d</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tariff</span>
                      <span className="font-mono text-[11px] text-plum">{stayStats.tariffName}</span>
                    </div>
                    {stayStats.discount > 0 && (
                      <div className="flex justify-between text-clay">
                        <span>Discount</span>
                        <span>−{fmt(stayStats.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-ink-100 pt-1.5 font-bold text-ink-900">
                      <span>Net</span>
                      <span>{fmt(stayStats.netCost)}</span>
                    </div>
                    <div className="flex justify-between text-money">
                      <span>Deposit</span>
                      <span>{fmt(stayStats.deposit)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-ink-200 pt-1.5 text-[13px] font-bold text-ink-900">
                      <span>{stayStats.balanceDue < 0 ? "Refund" : "Due"}</span>
                      <span className={stayStats.balanceDue > 0 ? "text-clay" : "text-money"}>
                        {fmt(Math.abs(stayStats.balanceDue))}
                      </span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleTransfer}
                  className="border border-ink-200 bg-bone p-2.5"
                >
                  <div className="mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-ink-700">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Transfer
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="h-8 flex-1 rounded-sm border border-ink-200 bg-white px-2 text-[12px] focus:border-sage focus:outline-none"
                      value={transferTargetBedId}
                      onChange={(e) => setTransferTargetBedId(e.target.value)}
                      required
                    >
                      <option value="">Empty bed…</option>
                      {beds
                        .filter((b: Bed) => b.status === "available")
                        .map((b: Bed) => (
                          <option key={b.id} value={b.id}>
                            {b.name} · {getWardName(b.wardCategory)}
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      className="h-8 rounded-sm bg-sage px-3 text-[12px] font-medium text-white hover:bg-sage-hover"
                    >
                      Go
                    </button>
                  </div>
                </form>

                {activeAdmissionForSelectedBed.status === "active" ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="border border-ink-200 p-2.5">
                      <div className="mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-ink-700">
                        <FileText className="h-3.5 w-3.5 text-ink-400" />
                        Before discharge
                      </div>
                      <div className="space-y-1.5 text-[11.5px] font-medium text-ink-600">
                        {(
                          [
                            ["clinicalClearance", "Clinical clearance"],
                            ["medsDispensed", "Take-home meds dispensed"],
                            ["interimBillGenerated", "Interim bill generated"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-ink-200 text-sage focus:ring-sage"
                              checked={dischargeChecklist[key]}
                              onChange={(e) =>
                                setDischargeChecklist({
                                  ...dischargeChecklist,
                                  [key]: e.target.checked,
                                })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleInitiateDischarge}
                      disabled={
                        !dischargeChecklist.clinicalClearance ||
                        !dischargeChecklist.medsDispensed ||
                        !dischargeChecklist.interimBillGenerated
                      }
                      className="flex h-9 w-full items-center justify-center gap-1 rounded-sm bg-clay text-[12.5px] font-medium text-white transition-colors hover:bg-clay-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Initiate discharge
                    </button>
                  </div>
                ) : (
                  <div className="border border-mustard/25 bg-mustard-soft/30 p-3">
                    <div className="flex items-center gap-1 text-[12.5px] font-semibold text-mustard">
                      <AlertTriangle className="h-4 w-4" />
                      Final billing clearance
                    </div>
                    <p className="mt-1 text-[12px] text-ink-600">
                      Complete payment, then release the bed.
                    </p>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11.5px] font-medium text-ink-800">
                      <input
                        type="checkbox"
                        className="rounded border-ink-200 text-sage focus:ring-sage"
                        checked={dischargeChecklist.duesCleared}
                        onChange={(e) =>
                          setDischargeChecklist({
                            ...dischargeChecklist,
                            duesCleared: e.target.checked,
                          })
                        }
                      />
                      Dues cleared ({fmt(Math.max(0, stayStats.balanceDue))})
                    </label>
                    <button
                      type="button"
                      onClick={handleFinalizeDischarge}
                      className="mt-3 flex h-9 w-full items-center justify-center rounded-sm bg-teal text-[12.5px] font-medium text-white hover:bg-teal-hover"
                    >
                      Finalize & release bed
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Maintenance */}
            {selectedBed.status === "maintenance" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 border border-dashed border-mustard/35 bg-mustard-soft/15 px-4 py-10 text-center">
                <AlertTriangle className="h-10 w-10 text-mustard" />
                <div>
                  <h3 className="font-heading text-[15px] font-bold text-ink-900">
                    Bed under sanitation
                  </h3>
                  <p className="mt-1 text-[12px] text-ink-500">
                    Mark available when housekeeping is done.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearMaintenance}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-mustard px-4 text-[12.5px] font-medium text-white hover:opacity-90"
                >
                  <Check className="h-4 w-4" />
                  Mark available
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
