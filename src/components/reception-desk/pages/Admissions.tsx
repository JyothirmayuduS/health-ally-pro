import React, { useMemo, useState } from "react";
import { useStore, Bed, AdmissionRecord, WARD_CATEGORIES } from "@/lib/reception-desk/store";
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
  RefreshCcw,
  Check,
  X,
  Snowflake,
  Tv,
  Wind,
  Users,
  UserX,
} from "lucide-react";

const fmt = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const calcDaysAdmittedStr = (admittedAt: string) => {
  if (!admittedAt) return "—";
  const start = new Date(admittedAt);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  if (days <= 1) return "Admitted today";
  return `${days} days stay`;
};

function BedAmenities({ category }: { category: Bed["wardCategory"] }) {
  const iconCls = "w-3 h-3";
  switch (category) {
    case "general":
      return (
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sage-soft text-sage border border-sage/10 text-[9.5px] font-medium leading-none">
            <Wind className={iconCls} /> 1 Fan
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bone text-ink-500 border border-ink-200 text-[9.5px] font-medium leading-none">
            <UserX className={iconCls} /> No Companion
          </span>
        </div>
      );
    case "semi-private":
      return (
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sage-soft text-sage border border-sage/10 text-[9.5px] font-medium leading-none">
            <Wind className={iconCls} /> Fan
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-soft text-teal border border-teal/10 text-[9.5px] font-semibold leading-none">
            <User className={iconCls} /> 1 Companion Bed
          </span>
        </div>
      );
    case "private-deluxe":
      return (
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-soft text-teal border border-teal/15 text-[9.5px] font-bold leading-none">
            <Snowflake className={iconCls} /> AC
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-plum-soft text-plum border border-plum/15 text-[9.5px] font-bold leading-none">
            <Tv className={iconCls} /> TV
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sage-soft text-sage border border-sage/15 text-[9.5px] font-bold leading-none">
            <Users className={iconCls} /> 3 Guest Beds
          </span>
        </div>
      );
    case "icu":
      return (
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-clay-soft text-clay border border-clay/15 text-[9.5px] font-extrabold leading-none">
            <Activity className={`${iconCls} animate-pulse`} /> Ventilator
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bone text-ink-400 border border-ink-200 text-[9.5px] font-medium leading-none">
            <UserX className={iconCls} /> 0 Visitors
          </span>
        </div>
      );
  }
}

// Mock Referrals/Recommendations for OPD -> IPD admission
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
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>("");

  // Forms and actions states
  const [admitPatientId, setAdmitPatientId] = useState("");
  const [admitDoctorId, setAdmitDoctorId] = useState("DOC-001");
  const [admitTariff, setAdmitTariff] = useState<"standard" | "star-corporate" | "cghs" | "staff">("standard");
  const [admitDeposit, setAdmitDeposit] = useState("5000");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  const [transferTargetBedId, setTransferTargetBedId] = useState("");

  // Checklists for discharge
  const [dischargeChecklist, setDischargeChecklist] = useState({
    clinicalClearance: false,
    medsDispensed: false,
    interimBillGenerated: false,
    duesCleared: false,
  });

  // Selected bed object
  const selectedBed = useMemo(() => {
    return beds.find((b: Bed) => b.id === selectedBedId) || beds[0];
  }, [beds, selectedBedId]);

  // Selected active admission (if occupied)
  const activeAdmissionForSelectedBed = useMemo(() => {
    if (!selectedBed || selectedBed.status !== "occupied") return null;
    return admissions.find((a: AdmissionRecord) => a.bedId === selectedBed.id && a.status !== "discharged");
  }, [selectedBed, admissions]);

  // Active admissions listing
  const activeAdmissionsList = useMemo(() => {
    return admissions.filter((a: AdmissionRecord) => a.status !== "discharged");
  }, [admissions]);

  // Search filter for patient selector in Admit Form
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return [];
    return patients.filter(
      (p: any) =>
        p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.phone.includes(patientSearchQuery),
    );
  }, [patients, patientSearchQuery]);

  // Bed status details
  const getBedStatusBadge = (status: Bed["status"]) => {
    switch (status) {
      case "available":
        return <span className="chip-money">Available</span>;
      case "occupied":
        return <span className="chip-teal">Occupied</span>;
      case "maintenance":
        return <span className="chip-mustard">Cleaning / Maint</span>;
    }
  };

  const getWardName = (ward: Bed["wardCategory"]) => {
    switch (ward) {
      case "general":
        return "General Ward";
      case "semi-private":
        return "Semi-Private Ward";
      case "private-deluxe":
        return "Private Deluxe Room";
      case "icu":
        return "Intensive Care Unit (ICU)";
    }
  };

  const handleApplyRecommendation = (rec: typeof MOCK_RECOMMENDATIONS[0]) => {
    setAdmitPatientId(rec.patientId);
    setAdmitDoctorId(rec.recommendedBy);
    setPatientSearchQuery(rec.name);
    // Find first available bed in recommended ward
    const availBed = beds.find((b: Bed) => b.wardCategory === rec.recommendedWard && b.status === "available");
    if (availBed) {
      setSelectedBedId(availBed.id);
    }
    toast.success(`Applied admission details for ${rec.name}`);
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
    
    // Reset form
    setAdmitPatientId("");
    setPatientSearchQuery("");
    setAdmitDeposit("5000");
    toast.success(`Patient admitted successfully to ${selectedBed.name}`);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmissionForSelectedBed) return;
    if (!transferTargetBedId) {
      toast.error("Please select a target bed.");
      return;
    }

    transferPatient(activeAdmissionForSelectedBed.id, transferTargetBedId);
    toast.success(`Patient transferred to Bed ${transferTargetBedId}`);
    setSelectedBedId(transferTargetBedId);
    setTransferTargetBedId("");
  };

  const handleInitiateDischarge = () => {
    if (!activeAdmissionForSelectedBed) return;
    initiateDischarge(activeAdmissionForSelectedBed.id);
    toast.success("Discharge workflow initiated. Pending billing clearance.");
  };

  const handleFinalizeDischarge = () => {
    if (!activeAdmissionForSelectedBed) return;
    if (!dischargeChecklist.clinicalClearance || !dischargeChecklist.medsDispensed || !dischargeChecklist.interimBillGenerated || !dischargeChecklist.duesCleared) {
      toast.error("Please clear all items in the discharge checklist.");
      return;
    }

    finalizeDischarge(activeAdmissionForSelectedBed.id);
    toast.success("Discharge finalized. Bed set to maintenance cleaning.");
    
    // Reset checklists
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
    toast.success(`Bed ${selectedBed.id} cleared and marked Available.`);
  };

  // Helper to calculate days stay and bill estimation
  const stayStats = useMemo(() => {
    if (!activeAdmissionForSelectedBed) return null;
    const rate = WARD_CATEGORIES.find((w) => w.id === selectedBed.wardCategory)?.ratePerDay || 0;
    
    // Calculate days hospitalized
    const start = new Date(activeAdmissionForSelectedBed.admittedAt);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const rawCost = rate * days;
    
    // Apply tariff discount
    let discount = 0;
    let tariffName = "Standard Rates";
    if (activeAdmissionForSelectedBed.tariffPlan === "star-corporate") {
      discount = rawCost * 0.15;
      tariffName = "Star Health Corporate (15% Disc)";
    } else if (activeAdmissionForSelectedBed.tariffPlan === "staff") {
      discount = rawCost * 0.50;
      tariffName = "Staff Discount (50% Disc)";
    } else if (activeAdmissionForSelectedBed.tariffPlan === "cghs") {
      // CGHS capped rates, let's say capped at 1000 per day max
      const capRate = Math.min(rate, 1000);
      discount = (rate - capRate) * days;
      tariffName = "CGHS Gov Scheme (Capped)";
    }

    const netCost = rawCost - discount;
    const deposit = activeAdmissionForSelectedBed.depositAmount || 0;
    const balanceDue = netCost - deposit;

    return {
      days,
      rate,
      rawCost,
      discount,
      netCost,
      deposit,
      balanceDue,
      tariffName,
    };
  }, [activeAdmissionForSelectedBed, selectedBed]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ─── LEFT PANEL: DIRECTORY & RECOMMENDATIONS ────────────────────── */}
      <div className="flex flex-col gap-5 lg:col-span-3">
        {/* Directory */}
        <div className="bg-white border border-ink-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-ink-100">
            <span className="font-heading text-[13.5px] font-semibold text-ink-900">
              IPD Admissions ({activeAdmissionsList.length})
            </span>
          </div>

          {activeAdmissionsList.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-ink-400">
              No active inpatient admissions.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {activeAdmissionsList.map((adm) => {
                const pat = patients.find((p: any) => p.id === adm.patientId);
                const doc = doctors.find((d: any) => d.id === adm.doctorId);
                const bed = beds.find((b: Bed) => b.id === adm.bedId);
                const active = selectedBedId === adm.bedId;
                
                return (
                  <button
                    key={adm.id}
                    onClick={() => setSelectedBedId(adm.bedId)}
                    className={`text-left p-2.5 rounded-lg border text-[12.5px] transition-all flex flex-col gap-1 ${
                      active
                        ? "bg-sage-soft border-sage/30 text-sage"
                        : "bg-bone border-ink-100 text-ink-600 hover:border-ink-200"
                    }`}
                  >
                    <div className="font-semibold text-ink-900 flex justify-between">
                      <span>{pat?.name || adm.patientId}</span>
                      <span className="font-mono text-[11px] text-ink-400">{bed?.name}</span>
                    </div>
                    <div className="text-[11px] text-ink-400 flex justify-between items-center">
                      <span>Dr. {doc?.name.split(" ").pop()}</span>
                      <span className="font-mono uppercase px-1 py-0.5 rounded bg-ink-200/50 text-ink-600 text-[9px]">
                        {adm.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Doctor OPD Admissions Referrals */}
        <div className="bg-white border border-ink-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-ink-100 text-plum font-semibold">
            <Sparkles className="w-4 h-4" />
            <span className="font-heading text-[13.5px]">OPD Recommendations</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {MOCK_RECOMMENDATIONS.map((rec) => {
              const doc = doctors.find((d: any) => d.id === rec.recommendedBy);
              return (
                <div
                  key={rec.patientId}
                  className="bg-bone border border-ink-150 rounded-lg p-3 text-[12px] flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-ink-900">{rec.name}</div>
                      <div className="text-[11px] text-ink-400">
                        {rec.age} y/o · {rec.gender}
                      </div>
                    </div>
                    <span className="font-mono text-[9px] uppercase bg-plum-soft text-plum px-1.5 py-0.5 rounded">
                      {rec.recommendedWard}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-ink-600 italic bg-white p-2 rounded border border-ink-100">
                    &quot;{rec.diagnosis}&quot;
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] text-ink-400">
                    <span>Rec by: Dr. {doc?.name.split(" ").pop()}</span>
                    <span>{rec.recommendedAt}</span>
                  </div>
                  <button
                    onClick={() => handleApplyRecommendation(rec)}
                    className="w-full h-7 mt-1 text-[11.5px] bg-sage hover:bg-sage-hover text-white rounded font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    Process Admission
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MIDDLE PANEL: INTERACTIVE BED BOARD ──────────────────────── */}
      <div className="bg-white border border-ink-200 rounded-xl shadow-sm p-5 lg:col-span-5 flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-[16px] font-semibold text-ink-900">Bed Allocation Board</h2>
          <p className="text-[12px] text-ink-400 mt-0.5">Click any bed to manage admission, transfer, or discharge.</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-bone p-3 rounded-lg border border-ink-100 text-[11.5px] text-ink-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sage" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-mustard" />
            <span>Maintenance</span>
          </div>
        </div>

        {/* Wards Sections */}
        <div className="flex flex-col gap-5 max-h-[550px] overflow-y-auto pr-1">
          {WARD_CATEGORIES.map((cat) => {
            const wardBeds = beds.filter((b: Bed) => b.wardCategory === cat.id);
            return (
              <div key={cat.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-ink-150 pb-1">
                  <span className="font-heading text-[13px] font-semibold text-ink-800">
                    {cat.name}
                  </span>
                  <span className="font-mono text-[11px] text-ink-400">
                    ₹{cat.ratePerDay}/day · {wardBeds.filter((b: Bed) => b.status === "available").length} empty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wardBeds.map((bed: Bed) => {
                    const active = selectedBedId === bed.id;
                    const adm = admissions.find((a: AdmissionRecord) => a.bedId === bed.id && a.status !== "discharged");
                    const pat = adm ? patients.find((p: any) => p.id === adm.patientId) : null;
                    
                    let bgCls = "";
                    let dotCls = "";
                    let statusBadge = null;
                    if (bed.status === "available") {
                      bgCls = active ? "bg-sage-soft border-sage text-sage font-medium" : "bg-bone border-ink-100 text-ink-600 hover:border-sage/40 hover:bg-sage-soft/30";
                      dotCls = "bg-sage";
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-money-soft text-money border border-money/20 uppercase tracking-wide">
                          Vacant
                        </span>
                      );
                    } else if (bed.status === "occupied") {
                      bgCls = active ? "bg-teal-soft border-teal text-teal font-medium" : "bg-white border-ink-200 text-ink-800 hover:border-teal/40 hover:bg-teal-soft/30";
                      dotCls = "bg-teal";
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-teal-soft text-teal border border-teal/20 uppercase tracking-wide">
                          Occupied
                        </span>
                      );
                    } else {
                      bgCls = active ? "bg-mustard-soft border-mustard text-mustard font-medium" : "bg-bone border-ink-100 text-ink-600 hover:border-mustard/40 hover:bg-mustard-soft/30";
                      dotCls = "bg-mustard";
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-mustard-soft text-mustard border border-mustard/20 uppercase tracking-wide">
                          Sanitizing
                        </span>
                      );
                    }

                    return (
                      <button
                        key={bed.id}
                        onClick={() => setSelectedBedId(bed.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[160px] relative shadow-sm ${bgCls}`}
                      >
                        {/* Header: Room Name/ID + Status Badge */}
                        <div className="flex justify-between items-center w-full">
                          <span className="font-heading text-[13px] font-bold text-ink-900 flex items-center gap-1.5">
                            <BedIcon className="w-3.5 h-3.5 text-ink-400" />
                            {bed.name}
                          </span>
                          {statusBadge}
                        </div>

                        {/* Mid Section: Occupancy Data */}
                        <div className="w-full flex-1 flex flex-col justify-center py-2.5">
                          {bed.status === "occupied" && pat ? (
                            <div className="flex flex-col gap-1 w-full">
                              <div className="font-heading font-extrabold text-[13.5px] text-ink-900 leading-none truncate">
                                {pat.name}
                              </div>
                              <div className="text-[10.5px] text-ink-500 font-medium flex justify-between">
                                <span>MRN: {pat.mrn}</span>
                                <span>Dr. {doctors.find(d => d.id === adm?.doctorId)?.name.split(" ").pop()}</span>
                              </div>
                              <div className="text-[10.5px] text-ink-400 font-mono mt-0.5 flex justify-between items-center">
                                <span>{calcDaysAdmittedStr(adm?.admittedAt || "")}</span>
                                <span className="uppercase text-[8px] px-1 rounded bg-ink-200/50 text-ink-600 font-bold tracking-wider">
                                  {adm?.status}
                                </span>
                              </div>
                            </div>
                          ) : bed.status === "available" ? (
                            <div className="text-ink-400 text-[11.5px] flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-sage" />
                              <span>Ready for patient intake</span>
                            </div>
                          ) : (
                            <div className="text-mustard text-[11.5px] flex items-center gap-1.5 font-medium">
                              <AlertTriangle className="w-4 h-4 text-mustard animate-pulse" />
                              <span>Sanitization cleaning</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Section: Amenities mini chips */}
                        <div className="w-full border-t border-ink-100/50 pt-2.5">
                          <BedAmenities category={bed.wardCategory} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT PANEL: ADT DETAIL & ACTION PANEL ────────────────────── */}
      <div className="bg-white border border-ink-200 rounded-xl shadow-sm p-5 lg:col-span-4 flex flex-col gap-4 min-h-[480px]">
        {/* Header info */}
        <div className="pb-3 border-b border-ink-200">
          <div className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-ink-400 font-medium">
            <BedIcon className="w-3.5 h-3.5" />
            ADT Panel & Bed Stay
          </div>
          <h3 className="font-heading text-[17px] font-semibold text-ink-900 mt-1 flex justify-between items-baseline">
            <span>{selectedBed.name}</span>
            <span className="text-[12px] font-mono font-normal text-ink-400">
              {getWardName(selectedBed.wardCategory)}
            </span>
          </h3>
          <div className="mt-2 flex justify-between items-center">
            {getBedStatusBadge(selectedBed.status)}
            <span className="font-mono text-[12.5px] font-semibold text-ink-700">
              ₹{WARD_CATEGORIES.find((w) => w.id === selectedBed.wardCategory)?.ratePerDay || 0}/day
            </span>
          </div>
        </div>

        {/* 1. ADMIT FORM (AVALABLE STATUS) */}
        {selectedBed.status === "available" && (
          <form onSubmit={handleAdmit} className="flex flex-col gap-3.5">
            <h4 className="font-heading text-[13px] font-semibold text-ink-900">
              New Inpatient Admission
            </h4>

            {/* Patient Search Registry */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium text-ink-500">
                Select Patient (Registry)
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search patient, MRN, phone…"
                  className="w-full h-9 pl-8 pr-3 text-[13px] bg-bone border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors"
                  value={patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value);
                    if (!e.target.value) setAdmitPatientId("");
                  }}
                />
              </div>

              {filteredPatients.length > 0 && !admitPatientId && (
                <div className="bg-bone border border-ink-200 rounded-lg max-h-[150px] overflow-y-auto flex flex-col p-1.5 gap-1 shadow-inner mt-1">
                  {filteredPatients.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAdmitPatientId(p.id);
                        setPatientSearchQuery(p.name);
                      }}
                      className="text-left px-2 py-1.5 hover:bg-white rounded text-[12px] flex justify-between transition-colors border border-transparent hover:border-ink-150"
                    >
                      <span className="font-medium text-ink-900">{p.name}</span>
                      <span className="font-mono text-ink-400 text-[11px]">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}

              {admitPatientId && (
                <div className="flex items-center justify-between bg-sage-soft/50 border border-sage/20 rounded-lg px-2.5 py-1.5 mt-1">
                  <span className="text-[12.5px] font-medium text-sage">Selected: {patientSearchQuery}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdmitPatientId("");
                      setPatientSearchQuery("");
                    }}
                    className="text-sage hover:text-sage-hover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Doctor */}
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-medium text-ink-500">Admitting Doctor</label>
              <select
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors"
                value={admitDoctorId}
                onChange={(e) => setAdmitDoctorId(e.target.value)}
              >
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* Tariff selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-medium text-ink-500">Tariff Plan</label>
              <select
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors"
                value={admitTariff}
                onChange={(e: any) => setAdmitTariff(e.target.value)}
              >
                <option value="standard">Standard Tariff Rates</option>
                <option value="star-corporate">Star Health Corporate (15% Procedures Disc)</option>
                <option value="cghs">CGHS Government Scheme (Capped Rate)</option>
                <option value="staff">Staff Welfare Discount (50% Disc)</option>
              </select>
            </div>

            {/* Deposit */}
            <div className="flex flex-col gap-1">
              <label className="text-[11.5px] font-medium text-ink-500">Advance Deposit Paid</label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  type="number"
                  className="w-full h-9 pl-8 pr-3 text-[13px] bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-sage transition-colors"
                  value={admitDeposit}
                  onChange={(e) => setAdmitDeposit(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 mt-2 bg-sage hover:bg-sage-hover text-white rounded-lg font-medium text-[13px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              Admit Patient to Bed
            </button>
          </form>
        )}

        {/* 2. DISCHARGE / TRANSFER PORTLET (OCCUPIED STATUS) */}
        {selectedBed.status === "occupied" && activeAdmissionForSelectedBed && stayStats && (
          <div className="flex flex-col gap-4">
            {/* Patient Header Details */}
            <div className="bg-bone border border-ink-150 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11.5px] font-mono text-ink-400">
                <span>Admission: {activeAdmissionForSelectedBed.id}</span>
                <span className="uppercase text-teal font-semibold">{activeAdmissionForSelectedBed.status}</span>
              </div>
              <div className="text-[14.5px] font-bold text-ink-900">
                {patients.find((p: any) => p.id === activeAdmissionForSelectedBed.patientId)?.name || activeAdmissionForSelectedBed.patientId}
              </div>
              <div className="text-[12px] text-ink-600 flex flex-col gap-1 font-medium mt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-ink-400" />
                  <span>
                    MRN: {patients.find((p: any) => p.id === activeAdmissionForSelectedBed.patientId)?.mrn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-ink-400" />
                  <span>
                    Doctor: Dr. {doctors.find((d: any) => d.id === activeAdmissionForSelectedBed.doctorId)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-ink-400" />
                  <span>
                    Admitted: {new Date(activeAdmissionForSelectedBed.admittedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill computation summary */}
            <div className="border border-ink-150 rounded-xl p-3 flex flex-col gap-2">
              <div className="text-[12px] font-semibold text-ink-800 border-b border-ink-100 pb-1.5">
                Bed Tariff & Stay Cost
              </div>
              <div className="flex flex-col gap-1.5 text-[12px] text-ink-600">
                <div className="flex justify-between">
                  <span>Stay Duration:</span>
                  <span className="font-semibold text-ink-900">{stayStats.days} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Rate:</span>
                  <span>{fmt(stayStats.rate)} / day</span>
                </div>
                <div className="flex justify-between">
                  <span>Tariff Rule:</span>
                  <span className="font-mono text-[11px] text-plum font-semibold">{stayStats.tariffName}</span>
                </div>
                {stayStats.discount > 0 && (
                  <div className="flex justify-between text-clay font-medium">
                    <span>Scheme Discount:</span>
                    <span>-{fmt(stayStats.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-ink-100 pt-1.5 font-bold text-ink-900">
                  <span>Net Cost:</span>
                  <span>{fmt(stayStats.netCost)}</span>
                </div>
                <div className="flex justify-between text-money font-medium">
                  <span>Advance Deposit Paid:</span>
                  <span>{fmt(stayStats.deposit)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-ink-200 pt-1.5 font-bold text-[13px] text-ink-900">
                  <span>{stayStats.balanceDue < 0 ? "Refund Due:" : "Outstanding Due:"}</span>
                  <span className={stayStats.balanceDue > 0 ? "text-clay" : "text-money"}>
                    {fmt(Math.abs(stayStats.balanceDue))}
                  </span>
                </div>
              </div>
            </div>

            {/* ADT WORKFLOW CONTROLS */}
            <div className="flex flex-col gap-3">
              <div className="font-heading text-[12.5px] font-semibold text-ink-800 border-b border-ink-100 pb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sage" />
                ADT Interventions
              </div>

              {/* A. Transfer Patient Form */}
              <form onSubmit={handleTransfer} className="bg-bone border border-ink-100 rounded-lg p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-1 text-[11.5px] font-semibold text-ink-700">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Room/Bed Transfer
                </div>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-8 px-2 text-[12.5px] bg-white border border-ink-200 rounded focus:outline-none focus:border-sage"
                    value={transferTargetBedId}
                    onChange={(e) => setTransferTargetBedId(e.target.value)}
                    required
                  >
                    <option value="">Select empty bed...</option>
                    {beds
                      .filter((b: Bed) => b.status === "available")
                      .map((b: Bed) => (
                        <option key={b.id} value={b.id}>
                          {b.id} - {getWardName(b.wardCategory)} (₹{WARD_CATEGORIES.find((w) => w.id === b.wardCategory)?.ratePerDay})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="h-8 px-3 text-[12px] bg-sage hover:bg-sage-hover text-white rounded font-medium transition-colors"
                  >
                    Transfer
                  </button>
                </div>
              </form>

              {/* B. Discharge actions */}
              {activeAdmissionForSelectedBed.status === "active" ? (
                <div className="flex flex-col gap-2.5">
                  <div className="bg-bone border border-ink-100 rounded-lg p-2.5">
                    <div className="text-[11.5px] font-semibold text-ink-700 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-ink-400" />
                      Discharge Prerequisites
                    </div>
                    <div className="flex flex-col gap-1.5 text-[11.5px] text-ink-600 font-medium">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-ink-200 text-sage focus:ring-sage"
                          checked={dischargeChecklist.clinicalClearance}
                          onChange={(e) => setDischargeChecklist({ ...dischargeChecklist, clinicalClearance: e.target.checked })}
                        />
                        Clinical discharge approved by doctor
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-ink-200 text-sage focus:ring-sage"
                          checked={dischargeChecklist.medsDispensed}
                          onChange={(e) => setDischargeChecklist({ ...dischargeChecklist, medsDispensed: e.target.checked })}
                        />
                        Take-home medications dispensed
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-ink-200 text-sage focus:ring-sage"
                          checked={dischargeChecklist.interimBillGenerated}
                          onChange={(e) => setDischargeChecklist({ ...dischargeChecklist, interimBillGenerated: e.target.checked })}
                        />
                        Interim stay billing processed
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInitiateDischarge}
                    disabled={!dischargeChecklist.clinicalClearance || !dischargeChecklist.medsDispensed || !dischargeChecklist.interimBillGenerated}
                    className="w-full h-9 bg-clay hover:bg-clay-hover text-white rounded-lg font-medium text-[12.5px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    Initiate Discharge
                  </button>
                </div>
              ) : (
                <div className="bg-mustard-soft/40 border border-mustard/20 rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-[12.5px] font-semibold text-mustard flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Final Clearance Billing Check
                  </div>
                  <div className="text-[12px] text-ink-600">
                    Admission is in pending clearance status. Please complete the final billing payment.
                  </div>
                  <div className="flex flex-col gap-1.5 text-[11.5px] text-ink-600 font-medium">
                    <label className="flex items-center gap-2 cursor-pointer text-ink-800">
                      <input
                        type="checkbox"
                        className="rounded border-ink-200 text-sage focus:ring-sage"
                        checked={dischargeChecklist.duesCleared}
                        onChange={(e) => setDischargeChecklist({ ...dischargeChecklist, duesCleared: e.target.checked })}
                      />
                      Billing Cleared (Dues paid: {fmt(Math.max(0, stayStats.balanceDue))})
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizeDischarge}
                    className="w-full h-9 bg-teal hover:bg-teal-hover text-white rounded font-medium text-[12.5px] transition-colors flex items-center justify-center gap-1"
                  >
                    Finalize & Release Bed
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. MAINTENANCE (CLEANING RESET) */}
        {selectedBed.status === "maintenance" && (
          <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center py-10 bg-mustard-soft/20 border border-dashed border-mustard/30 rounded-xl p-5">
            <AlertTriangle className="w-12 h-12 text-mustard animate-bounce" />
            <div>
              <h4 className="font-heading text-[15.5px] font-bold text-ink-900">Bed Under Sanitation</h4>
              <p className="text-[12px] text-ink-500 mt-1 max-w-[220px]">
                This bed is undergoing sanitization following patient discharge.
              </p>
            </div>
            <button
              onClick={handleClearMaintenance}
              className="w-full max-w-[200px] h-9 bg-mustard hover:bg-mustard-soft hover:text-mustard text-white rounded font-medium text-[12.5px] transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Mark Available
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
