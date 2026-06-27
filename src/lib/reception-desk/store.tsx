/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { PATIENTS, APPOINTMENTS, DOCTORS, TODAY_STR } from "./mockData";
import { SEED_INVOICES, nextInvoiceId, computeTotals } from "./billingData";
import { SEED_SHIFTS, SEED_CLAIMS, STAFF, nextShiftId, nextClaimId } from "./opsData";
import { drainReceptionInvoices, RECEPTION_INVOICE_EVENT } from "@/lib/shared/billing-bridge";
import { loadServiceFees, feesByDoctor } from "@/lib/shared/services";
import { loadLabCatalog } from "@/lib/shared/lab-catalog";
import { pushLabOrder, type DoctorLabPayload } from "@/lib/lab-desk/order-bridge";
import { getSharedPatient, resolvePatientId, calcAge } from "@/lib/shared/patients";
import {
  loadPatientRegistry,
  registerPatient,
  updatePatientRegistry,
  PATIENT_REGISTRY_EVENT,
} from "@/lib/shared/patient-registry";
import {
  enqueueFromCheckIn,
  listClinicQueue,
  updateQueueByAppointment,
  CLINIC_QUEUE_EVENT,
} from "@/lib/shared/clinic-queue";
import {
  ENCOUNTERS_EVENT,
  findOpenEncounterForPatient as findOpenEncounterForPatientShared,
  linkToEncounter,
  listEncounters,
  openEncounterForCheckIn,
} from "@/lib/shared/encounters";
import {
  ensureLedgerHydrated,
  mirrorToLedger,
  receptionInvoiceToLedger,
} from "@/lib/billing-desk/store";
import { LEDGER_EVENT, loadLedgerInvoices, type LedgerInvoice } from "@/lib/shared/billing-ledger";
import { pushPatientNotification } from "@/lib/patient-notifications-store";

export interface PreAuthRecord {
  id: string;
  patientId: string;
  provider: string;
  policyId: string;
  procedureType: string;
  diagnosis: string;
  estimatedCost: number;
  notes?: string;
  documentName?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "expired";
  createdAt: string;
  submittedAt?: string;
  decisionAt?: string;
  approvedAmount?: number;
}

const SEED_PREAUTHS: PreAuthRecord[] = [
  {
    id: "PA-8001",
    patientId: "MRN-100231",
    provider: "Star Health",
    policyId: "SH-882-3341",
    procedureType: "OPD Consultation",
    diagnosis: "Severe lumbar radiculopathy (ICD M54.16)",
    estimatedCost: 12000,
    notes: "Requires urgent MRI of lumbar spine",
    documentName: "mri_req.pdf",
    status: "approved",
    approvedAmount: 12000,
    createdAt: `${TODAY_STR}T08:10:00`,
    submittedAt: `${TODAY_STR}T08:15:00`,
    decisionAt: `${TODAY_STR}T09:00:00`,
  },
  {
    id: "PA-8002",
    patientId: "MRN-100233",
    provider: "ICICI Lombard",
    policyId: "IL-664-2210",
    procedureType: "Orthopedic consult + X-ray",
    diagnosis: "ACL Tear Left Knee",
    estimatedCost: 45000,
    notes: "Patient scheduled for arthroscopic repair next week",
    documentName: "clinical_brief.pdf",
    status: "submitted",
    createdAt: `${TODAY_STR}T09:30:00`,
    submittedAt: `${TODAY_STR}T09:45:00`,
  },
  {
    id: "PA-8003",
    patientId: "MRN-100235",
    provider: "Niva Bupa",
    policyId: "NB-441-5523",
    procedureType: "Pediatric consult + Vaccine",
    diagnosis: "Routine pediatric review",
    estimatedCost: 2500,
    status: "draft",
    createdAt: `${TODAY_STR}T10:00:00`,
  },
];

const PREAUTHS_KEY = "medora-reception-preauths-v1";

function loadPreAuths(): PreAuthRecord[] {
  if (typeof window === "undefined") return SEED_PREAUTHS;
  try {
    const raw = localStorage.getItem(PREAUTHS_KEY);
    return raw ? JSON.parse(raw) : SEED_PREAUTHS;
  } catch {
    return SEED_PREAUTHS;
  }
}

export interface Bed {
  id: string;
  name: string;
  wardCategory: "general" | "semi-private" | "private-deluxe" | "icu";
  status: "available" | "occupied" | "maintenance";
}

export interface AdmissionRecord {
  id: string;
  patientId: string;
  bedId: string;
  doctorId: string;
  admittedAt: string;
  dischargedAt?: string;
  depositAmount: number;
  status: "active" | "pending-clearance" | "discharged";
  tariffPlan: "standard" | "star-corporate" | "cghs" | "staff";
  transfers?: {
    fromBedId: string;
    toBedId: string;
    transferredAt: string;
  }[];
}

export interface WardCategory {
  id: "general" | "semi-private" | "private-deluxe" | "icu";
  name: string;
  ratePerDay: number;
}

export const WARD_CATEGORIES: WardCategory[] = [
  { id: "general", name: "General Ward", ratePerDay: 1500 },
  { id: "semi-private", name: "Semi-Private Ward", ratePerDay: 3000 },
  { id: "private-deluxe", name: "Private Deluxe Room", ratePerDay: 6000 },
  { id: "icu", name: "Intensive Care Unit (ICU)", ratePerDay: 12000 },
];

const SEED_BEDS: Bed[] = [
  { id: "B-101", name: "Bed 101", wardCategory: "general", status: "occupied" },
  { id: "B-102", name: "Bed 102", wardCategory: "general", status: "available" },
  { id: "B-103", name: "Bed 103", wardCategory: "general", status: "available" },
  { id: "B-104", name: "Bed 104", wardCategory: "general", status: "maintenance" },
  { id: "B-105", name: "Bed 105", wardCategory: "general", status: "available" },
  { id: "B-201", name: "Bed 201", wardCategory: "semi-private", status: "occupied" },
  { id: "B-202", name: "Bed 202", wardCategory: "semi-private", status: "available" },
  { id: "B-203", name: "Bed 203", wardCategory: "semi-private", status: "maintenance" },
  { id: "B-204", name: "Bed 204", wardCategory: "semi-private", status: "available" },
  { id: "B-301", name: "Bed 301", wardCategory: "private-deluxe", status: "occupied" },
  { id: "B-302", name: "Bed 302", wardCategory: "private-deluxe", status: "available" },
  { id: "B-303", name: "Bed 303", wardCategory: "private-deluxe", status: "available" },
  { id: "B-304", name: "Bed 304", wardCategory: "private-deluxe", status: "available" },
  { id: "B-401", name: "Bed 401", wardCategory: "icu", status: "available" },
  { id: "B-402", name: "Bed 402", wardCategory: "icu", status: "available" },
];

const SEED_ADMISSIONS: AdmissionRecord[] = [
  {
    id: "ADM-1001",
    patientId: "MRN-100231",
    bedId: "B-101",
    doctorId: "DOC-001",
    admittedAt: `${TODAY_STR}T08:00:00`,
    depositAmount: 5000,
    status: "active",
    tariffPlan: "standard",
    transfers: [],
  },
  {
    id: "ADM-1002",
    patientId: "MRN-100232",
    bedId: "B-201",
    doctorId: "DOC-002",
    admittedAt: `${TODAY_STR}T07:30:00`,
    depositAmount: 10000,
    status: "active",
    tariffPlan: "star-corporate",
    transfers: [],
  },
  {
    id: "ADM-1003",
    patientId: "MRN-100233",
    bedId: "B-301",
    doctorId: "DOC-003",
    admittedAt: `${TODAY_STR}T09:00:00`,
    depositAmount: 15000,
    status: "active",
    tariffPlan: "cghs",
    transfers: [],
  },
];

const BEDS_KEY = "medora-reception-beds-v1";
const ADMISSIONS_KEY = "medora-reception-admissions-v1";

function loadBeds(): Bed[] {
  if (typeof window === "undefined") return SEED_BEDS;
  try {
    const raw = localStorage.getItem(BEDS_KEY);
    return raw ? JSON.parse(raw) : SEED_BEDS;
  } catch {
    return SEED_BEDS;
  }
}

function loadAdmissions(): AdmissionRecord[] {
  if (typeof window === "undefined") return SEED_ADMISSIONS;
  try {
    const raw = localStorage.getItem(ADMISSIONS_KEY);
    return raw ? JSON.parse(raw) : SEED_ADMISSIONS;
  } catch {
    return SEED_ADMISSIONS;
  }
}

const APPOINTMENTS_KEY = "medora-reception-appointments-v1";

function loadAppointments() {
  if (typeof window === "undefined") return APPOINTMENTS;
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : APPOINTMENTS;
  } catch {
    return APPOINTMENTS;
  }
}

function ledgerToReceptionInvoice(li: LedgerInvoice) {
  return {
    id: li.id,
    date: li.date,
    patientId: li.patientId,
    doctorId: null,
    appointmentId: li.referenceId ?? null,
    items: li.items,
    discount: 0,
    method: li.method ?? null,
    status: li.status === "paid" ? "paid" : li.status === "partial" ? "partial" : "unpaid",
    note: li.referenceId ? `Ledger ref ${li.referenceId}` : undefined,
    paidAt: li.paidAt,
  };
}

const StoreCtx = createContext(null);

let mrnCounter = 100239;
let aptCounter = 50020;

const nextMrn = () => `MRN-${mrnCounter++}`;
const nextApt = () => `APT-${aptCounter++}`;

// Token numbering is per-doctor: DOC-001 -> 1xx, DOC-002 -> 2xx, etc.
const docTokenBase = (doctorId) => {
  const idx = DOCTORS.findIndex((d) => d.id === doctorId);
  return (idx + 1) * 100;
};

export function StoreProvider({ children }) {
  const [patients, setPatients] = useState(() => loadPatientRegistry());
  const [appointments, setAppointments] = useState(() => loadAppointments());
  const [doctors, setDoctors] = useState(DOCTORS);
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [shifts, setShifts] = useState(SEED_SHIFTS);
  const [claims, setClaims] = useState(SEED_CLAIMS);
  const [staff] = useState(STAFF);
  const [serviceFees, setServiceFees] = useState(() => loadServiceFees());
  const [labCatalog] = useState(() => loadLabCatalog());
  const [encounters, setEncounters] = useState(() => listEncounters());
  const [preAuths, setPreAuths] = useState<PreAuthRecord[]>(() => loadPreAuths());
  const [beds, setBeds] = useState<Bed[]>(() => loadBeds());
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>(() => loadAdmissions());

  const notifyPatientBillingEvent = useCallback((patientId, title, body) => {
    const patient = getSharedPatient(resolvePatientId(patientId));
    const patientName = patient?.name ?? patientId;
    pushPatientNotification({
      title,
      body: body.replace(/\{patient\}/g, patientName),
      at: "Just now",
      type: "general",
      to: "/profile/notifications",
    });
  }, []);

  const ingestBridgeInvoices = useCallback(() => {
    const payloads = drainReceptionInvoices();
    if (!payloads.length) return;
    const addedInvoices = [];
    setInvoices((list) => {
      const next = [...list];
      for (const p of payloads) {
        const exists = next.some((i) => i.note?.includes(p.labOrderId));
        if (exists) continue;
        const inv = {
          id: p.id,
          date: TODAY_STR,
          patientId: resolvePatientId(p.patientId),
          doctorId: p.doctorId ?? null,
          appointmentId: null,
          items: p.items,
          discount: 0,
          method: null,
          status: "unpaid",
          note: p.note,
        };
        next.unshift(inv);
        addedInvoices.push(inv);
        mirrorToLedger({
          ...receptionInvoiceToLedger({
            id: p.id,
            date: TODAY_STR,
            patientId: resolvePatientId(p.patientId),
            doctorId: p.doctorId,
            appointmentId: null,
            items: p.items,
            discount: 0,
            method: null,
            status: "unpaid",
          }),
          source: "lab",
          referenceId: p.labOrderId,
        });
      }
      return next;
    });
    for (const inv of addedInvoices) {
      const totals = computeTotals(inv.items, inv.discount);
      notifyPatientBillingEvent(
        inv.patientId,
        "New lab invoice ready",
        `A new bill ${inv.id} for ₹${totals.total} is ready to pay.`,
      );
    }
  }, [notifyPatientBillingEvent]);

  useEffect(() => {
    const refreshPatients = () => setPatients(loadPatientRegistry());
    window.addEventListener(PATIENT_REGISTRY_EVENT, refreshPatients);
    return () => window.removeEventListener(PATIENT_REGISTRY_EVENT, refreshPatients);
  }, []);

  useEffect(() => {
    const refreshEncounters = () => setEncounters(listEncounters());
    window.addEventListener(ENCOUNTERS_EVENT, refreshEncounters);
    return () => window.removeEventListener(ENCOUNTERS_EVENT, refreshEncounters);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch {
      /* ignore quota */
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(PREAUTHS_KEY, JSON.stringify(preAuths));
    } catch {
      /* ignore quota */
    }
  }, [preAuths]);

  useEffect(() => {
    try {
      localStorage.setItem(BEDS_KEY, JSON.stringify(beds));
    } catch {
      /* ignore quota */
    }
  }, [beds]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMISSIONS_KEY, JSON.stringify(admissions));
    } catch {
      /* ignore quota */
    }
  }, [admissions]);

  useEffect(() => {
    ensureLedgerHydrated();
    const syncInvoicesFromLedger = () => {
      const ledger = loadLedgerInvoices().filter((i) => i.source === "reception");
      setInvoices((prev) => {
        const map = new Map(prev.map((i) => [i.id, i]));
        for (const li of ledger) map.set(li.id, ledgerToReceptionInvoice(li));
        return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      });
    };
    syncInvoicesFromLedger();
    window.addEventListener(LEDGER_EVENT, syncInvoicesFromLedger);
    return () => window.removeEventListener(LEDGER_EVENT, syncInvoicesFromLedger);
  }, []);

  useEffect(() => {
    const syncFromQueue = () => {
      const entries = listClinicQueue();
      setAppointments((apts) =>
        apts.map((a) => {
          const q = entries.find((e) => e.appointmentId === a.id);
          if (!q) return a;
          if (q.status === "in-consultation" && a.status === "checked-in") {
            return { ...a, status: "in-progress" };
          }
          if (
            q.status === "completed" &&
            (a.status === "checked-in" || a.status === "in-progress")
          ) {
            return { ...a, status: "completed" };
          }
          return a;
        }),
      );
    };
    syncFromQueue();
    window.addEventListener(CLINIC_QUEUE_EVENT, syncFromQueue);
    return () => window.removeEventListener(CLINIC_QUEUE_EVENT, syncFromQueue);
  }, []);

  useEffect(() => {
    ingestBridgeInvoices();
    const onIncoming = () => ingestBridgeInvoices();
    window.addEventListener(RECEPTION_INVOICE_EVENT, onIncoming);
    return () => window.removeEventListener(RECEPTION_INVOICE_EVENT, onIncoming);
  }, [ingestBridgeInvoices]);

  useEffect(() => {
    const syncDoctorDuty = () => {
      try {
        const raw = localStorage.getItem("medora-admin-doctor-onduty-v1");
        if (raw) {
          const statuses = JSON.parse(raw) as { id: string; onDuty: boolean; shift: string }[];
          setDoctors((prev) =>
            prev.map((d) => {
              const match = statuses.find((s) => s.id === d.id);
              if (match) {
                return {
                  ...d,
                  onDuty: match.onDuty,
                  shift: match.shift === "off" ? "Off today" : match.shift === "leave" ? "On leave" : match.shift
                };
              }
              return d;
            })
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    syncDoctorDuty();
    window.addEventListener("storage", syncDoctorDuty);
    window.addEventListener("medora-roster-updated", syncDoctorDuty);
    return () => {
      window.removeEventListener("storage", syncDoctorDuty);
      window.removeEventListener("medora-roster-updated", syncDoctorDuty);
    };
  }, []);

  const findOpenEncounterForPatient = useCallback(
    (patientId: string) => findOpenEncounterForPatientShared(patientId),
    [],
  );

  const linkLabOrderToEncounter = useCallback(
    (patientId: string, labOrderId: string) => {
      const enc = findOpenEncounterForPatient(patientId);
      if (enc) {
        linkToEncounter(enc.id, { labOrderId });
      }
    },
    [findOpenEncounterForPatient],
  );

  const orderLabForPatient = useCallback(
    (patientId: string, testCode: string, notes?: string) => {
      const pid = resolvePatientId(patientId);
      const shared = getSharedPatient(pid);
      if (!shared) return false;
      const cat = labCatalog.find((t) => t.code === testCode);
      const payload: DoctorLabPayload = {
        id: `rx-lab-${Date.now()}`,
        patient: {
          id: shared.id,
          name: shared.name,
          mrn: shared.mrn,
          age: calcAge(shared.dob),
          sex: shared.gender.startsWith("M") ? "M" : "F",
          phone: shared.phone,
        },
        doctor_id: "reception",
        doctor_name: "Reception Desk",
        doctor_specialty: "Front desk",
        priority: "routine",
        lines: [
          {
            test_code: testCode,
            test_name: cat?.name ?? testCode,
            fasting: Boolean(cat?.fasting),
          },
        ],
        notes: notes ?? "Ordered at reception",
        sent_at: new Date().toISOString(),
        source: "reception",
      };
      pushLabOrder(payload);
      linkLabOrderToEncounter(pid, payload.id);
      return true;
    },
    [labCatalog, linkLabOrderToEncounter],
  );

  const getConsultFee = useCallback(
    (doctorId: string) => {
      const fees = feesByDoctor(serviceFees);
      return fees[doctorId] ?? 600;
    },
    [serviceFees],
  );

  const refreshServiceFees = useCallback(() => {
    setServiceFees(loadServiceFees());
  }, []);

  const openShift = useCallback((data) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    const s = {
      id: nextShiftId(),
      date: TODAY_STR,
      openedAt: ts,
      closedAt: null,
      closingDenom: null,
      cashCollected: 0,
      variance: null,
      status: "open",
      handover: null,
      ...data,
    };
    setShifts((list) => [...list, s]);
    return s;
  }, []);

  const closeShift = useCallback((id, patch) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    setShifts((list) =>
      list.map((s) => (s.id === id ? { ...s, ...patch, closedAt: ts, status: "closed" } : s)),
    );
  }, []);

  const updateClaim = useCallback((id, patch) => {
    setClaims((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const addClaim = useCallback((data) => {
    const c = {
      id: nextClaimId(),
      status: "pending",
      submittedAt: null,
      decisionAt: null,
      approvedAmount: null,
      documents: [],
      ...data,
    };
    setClaims((list) => [c, ...list]);
    return c;
  }, []);

  const addInvoice = useCallback(
    (data) => {
      const inv = {
        id: nextInvoiceId(),
        date: TODAY_STR,
        discount: 0,
        method: null,
        status: "unpaid",
        ...data,
      };
      setInvoices((list) => [inv, ...list]);
      const enc = findOpenEncounterForPatient(data.patientId);
      if (enc) {
        linkToEncounter(enc.id, { invoiceId: inv.id });
      }
      mirrorToLedger(receptionInvoiceToLedger(inv));
      const totals = computeTotals(inv.items, inv.discount);
      notifyPatientBillingEvent(
        inv.patientId,
        "New invoice ready",
        `A new bill ${inv.id} for ₹${totals.total} is ready to pay.`,
      );
      return inv;
    },
    [findOpenEncounterForPatient, notifyPatientBillingEvent],
  );

  const updateInvoice = useCallback((id, patch) => {
    setInvoices((list) => {
      const next = list.map((i) => (i.id === id ? { ...i, ...patch } : i));
      const updated = next.find((i) => i.id === id);
      if (updated) mirrorToLedger(receptionInvoiceToLedger(updated));
      return next;
    });
  }, []);

  const collectPayment = useCallback(
    (id, method) => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
      let paidInvoice = null;
      setInvoices((list) => {
        const next = list.map((i) =>
          i.id === id ? { ...i, status: "paid", method, paidAt: ts } : i,
        );
        paidInvoice = next.find((i) => i.id === id);
        if (paidInvoice) mirrorToLedger(receptionInvoiceToLedger(paidInvoice));
        return next;
      });
      if (paidInvoice) {
        notifyPatientBillingEvent(
          paidInvoice.patientId,
          "Payment received",
          `Your payment for invoice ${paidInvoice.id} has been recorded.`,
        );
      }
    },
    [notifyPatientBillingEvent],
  );

  const addPreAuth = useCallback((data) => {
    const newPa = {
      id: `PA-${Date.now().toString().slice(-4)}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      ...data,
    };
    setPreAuths((list) => [newPa, ...list]);
    return newPa;
  }, []);

  const updatePreAuth = useCallback((id, patch) => {
    setPreAuths((list) =>
      list.map((pa) => (pa.id === id ? { ...pa, ...patch } : pa)),
    );
  }, []);

  const convertPreAuthToClaim = useCallback((id) => {
    let createdClaim = null;
    setPreAuths((list) => {
      const pa = list.find((x) => x.id === id);
      if (pa && pa.status === "approved") {
        createdClaim = addClaim({
          patientId: pa.patientId,
          appointmentId: null,
          doctorId: "DOC-001",
          provider: pa.provider,
          policyId: pa.policyId,
          diagnosis: pa.diagnosis,
          serviceType: pa.procedureType,
          estimatedCost: pa.estimatedCost,
          requestedAmount: pa.estimatedCost,
          approvedAmount: pa.approvedAmount ?? pa.estimatedCost,
          status: "pending",
        });
        return list.map((x) => (x.id === id ? { ...x, status: "submitted" } : x));
      }
      return list;
    });
    return createdClaim;
  }, [addClaim]);

  const addRefund = useCallback(
    (invoiceId, amount, type, reason, notes, method = "cash") => {
      let updatedInvoice = null;
      setInvoices((list) => {
        const next = list.map((i) => {
          if (i.id === invoiceId) {
            const currentRefunds = i.refunds || [];
            const newRefund = {
              type,
              amount: Number(amount),
              reason,
              notes,
              processedAt: new Date().toISOString(),
              processedBy: "reception",
              method,
            };
            const updatedRefunds = [...currentRefunds, newRefund];
            const totalRefunded = updatedRefunds.reduce((sum, r) => sum + r.amount, 0);
            const invoiceTotal = computeTotals(i.items, i.discount).total;
            const status = totalRefunded >= invoiceTotal ? "refunded" : "partial-refund";
            const updated = {
              ...i,
              status,
              refunds: updatedRefunds,
            };
            updatedInvoice = updated;
            return updated;
          }
          return i;
        });

        if (updatedInvoice) {
          mirrorToLedger(receptionInvoiceToLedger(updatedInvoice));

          if (type === "credit") {
            const currentPatient = getSharedPatient(updatedInvoice.patientId);
            if (currentPatient) {
              const currentBalance = currentPatient.balance || 0;
              const newBalance = currentBalance - Number(amount);
              updatePatientRegistry(updatedInvoice.patientId, { balance: newBalance });
              setPatients(loadPatientRegistry());
            }
          }
        }

        return next;
      });

      if (updatedInvoice) {
        notifyPatientBillingEvent(
          updatedInvoice.patientId,
          "Refund processed",
          `A refund of ₹${amount} (${type}) has been issued for invoice ${invoiceId}.`,
        );
      }
      return updatedInvoice;
    },
    [notifyPatientBillingEvent, patients],
  );

  const addPatient = useCallback((data) => {
    const newP = registerPatient({
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      bloodGroup: data.bloodGroup,
      allergies: data.allergies ?? "—",
      insurance: data.insuranceProvider
        ? { provider: data.insuranceProvider, policyId: data.policyId ?? "—" }
        : undefined,
      emergency: data.emergencyName
        ? {
            name: data.emergencyName,
            phone: data.emergencyPhone ?? "",
            relation: data.emergencyRelation ?? "",
          }
        : undefined,
      balance: 0,
      createdAt: TODAY_STR,
    });
    setPatients(loadPatientRegistry());
    return newP;
  }, []);

  const findDuplicate = useCallback(
    (phone, name, dob) => {
      return patients.find(
        (p) =>
          (phone && p.phone.replace(/\s+/g, "") === phone.replace(/\s+/g, "")) ||
          (name && dob && p.name.toLowerCase() === name.toLowerCase() && p.dob === dob),
      );
    },
    [patients],
  );

  const addAppointment = useCallback((data) => {
    const newA = {
      id: nextApt(),
      status: "scheduled",
      tokenNumber: null,
      ...data,
    };
    setAppointments((a) => [...a, newA]);
    return newA;
  }, []);

  const checkInAppointment = useCallback((apptId) => {
    // Read current state synchronously to compute token before any async updates
    const apt = appointments.find((a) => a.id === apptId);
    if (!apt) return null;

    const docApts = appointments.filter((a) => a.doctorId === apt.doctorId && a.tokenNumber !== null);
    const base = docTokenBase(apt.doctorId);
    const used = docApts.map((a) => a.tokenNumber).filter((n) => n >= base && n < base + 100);
    const issuedToken = used.length ? Math.max(...used) + 1 : base + 1;

    setAppointments((apts) =>
      apts.map((a) =>
        a.id === apptId ? { ...a, status: "checked-in", tokenNumber: issuedToken } : a,
      ),
    );

    const doctor = DOCTORS.find((d) => d.id === apt.doctorId);
    const enc = openEncounterForCheckIn({
      patientId: apt.patientId,
      appointmentId: apt.id,
      doctorName: doctor?.name,
      chiefComplaint: apt.notes,
    });
    enqueueFromCheckIn({
      appointmentId: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      tokenNumber: issuedToken,
      encounterId: enc.id,
    });

    return issuedToken;
  }, [appointments]);

  const updateAppointmentStatus = useCallback((apptId, status) => {
    setAppointments((apts) => apts.map((a) => (a.id === apptId ? { ...a, status } : a)));
    if (status === "in-progress") {
      updateQueueByAppointment(apptId, { status: "in-consultation" });
    }
    if (status === "completed") {
      updateQueueByAppointment(apptId, { status: "completed" });
    }
  }, []);

  const transferAppointment = useCallback((apptId, newDoctorId) => {
    setAppointments((apts) => {
      const apt = apts.find((a) => a.id === apptId);
      if (!apt) return apts;
      const base = docTokenBase(newDoctorId);
      const used = apts
        .filter((a) => a.doctorId === newDoctorId && a.tokenNumber !== null)
        .map((a) => a.tokenNumber);
      const nextNum = used.length ? Math.max(...used) + 1 : base + 1;
      return apts.map((a) =>
        a.id === apptId ? { ...a, doctorId: newDoctorId, tokenNumber: nextNum } : a,
      );
    });
  }, []);

  const cancelAppointment = useCallback((apptId, { reason, notes, reschedule } = {}) => {
    const orig = appointments.find((a) => a.id === apptId);
    if (!orig) return null;

    let createdRescheduled = null;
    if (reschedule) {
      createdRescheduled = {
        id: nextApt(),
        status: "scheduled",
        tokenNumber: null,
        patientId: orig.patientId,
        doctorId: reschedule.doctorId || orig.doctorId,
        date: reschedule.date,
        time: reschedule.time,
        type: reschedule.type || orig.type,
        rescheduledFromId: apptId,
      };
    }

    setAppointments((apts) => {
      const next = apts.map((a) =>
        a.id === apptId
          ? {
              ...a,
              status: "cancelled",
              cancellationReason: reason || "",
              cancellationNotes: notes || "",
            }
          : a
      );
      if (createdRescheduled) {
        return [...next, createdRescheduled];
      }
      return next;
    });

    pushPatientNotification({
      title: "Appointment cancelled",
      body: `Your appointment ${orig.id} has been cancelled. Reason: ${reason || "-"}`,
      at: "Just now",
      type: "appointment",
      to: "/book",
    });

    if (createdRescheduled) {
      pushPatientNotification({
        title: "New appointment scheduled",
        body: `A new appointment ${createdRescheduled.id} has been scheduled for ${reschedule.date} at ${reschedule.time}.`,
        at: "Just now",
        type: "appointment",
        to: "/book",
      });
    }

    return createdRescheduled;
  }, [appointments]);

  const admitPatient = useCallback((patientId: string, bedId: string, doctorId: string, tariffPlan: string, depositAmount: number) => {
    setBeds((prevBeds) =>
      prevBeds.map((b) => (b.id === bedId ? { ...b, status: "occupied" } : b))
    );

    const newAdm: AdmissionRecord = {
      id: `ADM-${Date.now().toString().slice(-4)}`,
      patientId,
      bedId,
      doctorId,
      admittedAt: new Date().toISOString(),
      depositAmount,
      status: "active",
      tariffPlan: tariffPlan as any,
      transfers: [],
    };
    setAdmissions((prev) => [newAdm, ...prev]);

    const patient = getSharedPatient(patientId);
    if (patient) {
      const currentBalance = patient.balance || 0;
      updatePatientRegistry(patientId, { balance: currentBalance - depositAmount });
      setPatients(loadPatientRegistry());
    }

    notifyPatientBillingEvent(
      patientId,
      "Admission Confirmed",
      `You have been admitted to bed ${bedId} under doctor ${doctorId}. Deposit of ₹${depositAmount} has been credited.`
    );

    return newAdm;
  }, [notifyPatientBillingEvent]);

  const transferPatient = useCallback((admissionId: string, toBedId: string) => {
    let fromBedId = "";
    setAdmissions((prev) =>
      prev.map((adm) => {
        if (adm.id === admissionId) {
          fromBedId = adm.bedId;
          const transferLog = {
            fromBedId: adm.bedId,
            toBedId,
            transferredAt: new Date().toISOString(),
          };
          return {
            ...adm,
            bedId: toBedId,
            transfers: [...(adm.transfers || []), transferLog],
          };
        }
        return adm;
      })
    );

    if (fromBedId) {
      setBeds((prevBeds) =>
        prevBeds.map((b) => {
          if (b.id === fromBedId) return { ...b, status: "available" };
          if (b.id === toBedId) return { ...b, status: "occupied" };
          return b;
        })
      );
    }
  }, []);

  const initiateDischarge = useCallback((admissionId: string) => {
    setAdmissions((prev) =>
      prev.map((adm) =>
        adm.id === admissionId ? { ...adm, status: "pending-clearance" } : adm
      )
    );
  }, []);

  const finalizeDischarge = useCallback((admissionId: string) => {
    let bedIdToRelease = "";
    setAdmissions((prev) =>
      prev.map((adm) => {
        if (adm.id === admissionId) {
          bedIdToRelease = adm.bedId;
          return {
            ...adm,
            status: "discharged",
            dischargedAt: new Date().toISOString(),
          };
        }
        return adm;
      })
    );

    if (bedIdToRelease) {
      setBeds((prevBeds) =>
        prevBeds.map((b) =>
          b.id === bedIdToRelease ? { ...b, status: "maintenance" } : b
        )
      );
    }
  }, []);

  const clearMaintenanceBed = useCallback((bedId: string) => {
    setBeds((prevBeds) =>
      prevBeds.map((b) => (b.id === bedId ? { ...b, status: "available" } : b))
    );
  }, []);

  const value = useMemo(
    () => ({
      patients,
      appointments,
      doctors,
      invoices,
      encounters,
      shifts,
      claims,
      staff,
      addPatient,
      addAppointment,
      checkInAppointment,
      updateAppointmentStatus,
      transferAppointment,
      findDuplicate,
      addInvoice,
      updateInvoice,
      collectPayment,
      openShift,
      closeShift,
      addClaim,
      updateClaim,
      orderLabForPatient,
      findOpenEncounterForPatient,
      getConsultFee,
      serviceFees,
      labCatalog,
      refreshServiceFees,
      addRefund,
      cancelAppointment,
      preAuths,
      addPreAuth,
      updatePreAuth,
      convertPreAuthToClaim,
      beds,
      admissions,
      admitPatient,
      transferPatient,
      initiateDischarge,
      finalizeDischarge,
      clearMaintenanceBed,
    }),
    [
      patients,
      appointments,
      doctors,
      invoices,
      encounters,
      shifts,
      claims,
      staff,
      addPatient,
      addAppointment,
      checkInAppointment,
      updateAppointmentStatus,
      transferAppointment,
      findDuplicate,
      addInvoice,
      updateInvoice,
      collectPayment,
      openShift,
      closeShift,
      addClaim,
      updateClaim,
      orderLabForPatient,
      findOpenEncounterForPatient,
      getConsultFee,
      serviceFees,
      labCatalog,
      refreshServiceFees,
      addRefund,
      cancelAppointment,
      preAuths,
      addPreAuth,
      updatePreAuth,
      convertPreAuthToClaim,
      beds,
      admissions,
      admitPatient,
      transferPatient,
      initiateDischarge,
      finalizeDischarge,
      clearMaintenanceBed,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
