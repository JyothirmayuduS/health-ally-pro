import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { PATIENTS, APPOINTMENTS, DOCTORS, TODAY_STR } from "./mockData";
import { SEED_INVOICES, nextInvoiceId } from "./billingData";
import { SEED_SHIFTS, SEED_CLAIMS, STAFF, nextShiftId, nextClaimId } from "./opsData";
import {
  drainReceptionInvoices,
  RECEPTION_INVOICE_EVENT,
} from "@/lib/shared/billing-bridge";
import { loadServiceFees, feesByDoctor } from "@/lib/shared/services";
import { loadLabCatalog } from "@/lib/shared/lab-catalog";
import { pushLabOrder, type DoctorLabPayload } from "@/lib/lab-desk/order-bridge";
import { getSharedPatient, resolvePatientId, calcAge } from "@/lib/shared/patients";
import {
  loadPatientRegistry,
  registerPatient,
  PATIENT_REGISTRY_EVENT,
} from "@/lib/shared/patient-registry";
import {
  enqueueFromCheckIn,
  listClinicQueue,
  updateQueueByAppointment,
  CLINIC_QUEUE_EVENT,
} from "@/lib/shared/clinic-queue";
import { openEncounterForCheckIn } from "@/lib/shared/encounters";
import {
  ensureLedgerHydrated,
  mirrorToLedger,
  receptionInvoiceToLedger,
} from "@/lib/billing-desk/store";
import {
  LEDGER_EVENT,
  loadLedgerInvoices,
  type LedgerInvoice,
} from "@/lib/shared/billing-ledger";

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
  const [doctors] = useState(DOCTORS);
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [shifts, setShifts] = useState(SEED_SHIFTS);
  const [claims, setClaims] = useState(SEED_CLAIMS);
  const [staff] = useState(STAFF);
  const [serviceFees, setServiceFees] = useState(() => loadServiceFees());
  const [labCatalog] = useState(() => loadLabCatalog());

  const ingestBridgeInvoices = useCallback(() => {
    const payloads = drainReceptionInvoices();
    if (!payloads.length) return;
    setInvoices((list) => {
      const next = [...list];
      for (const p of payloads) {
        const exists = next.some((i) => i.note?.includes(p.labOrderId));
        if (exists) continue;
        next.unshift({
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
        });
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
  }, []);

  useEffect(() => {
    const refreshPatients = () => setPatients(loadPatientRegistry());
    window.addEventListener(PATIENT_REGISTRY_EVENT, refreshPatients);
    return () => window.removeEventListener(PATIENT_REGISTRY_EVENT, refreshPatients);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch {
      /* ignore quota */
    }
  }, [appointments]);

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
      return true;
    },
    [labCatalog],
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
      list.map((s) =>
        s.id === id ? { ...s, ...patch, closedAt: ts, status: "closed" } : s,
      ),
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


  const addInvoice = useCallback((data) => {
    const inv = {
      id: nextInvoiceId(),
      date: TODAY_STR,
      discount: 0,
      method: null,
      status: "unpaid",
      ...data,
    };
    setInvoices((list) => [inv, ...list]);
    mirrorToLedger(receptionInvoiceToLedger(inv));
    return inv;
  }, []);

  const updateInvoice = useCallback((id, patch) => {
    setInvoices((list) => {
      const next = list.map((i) => (i.id === id ? { ...i, ...patch } : i));
      const updated = next.find((i) => i.id === id);
      if (updated) mirrorToLedger(receptionInvoiceToLedger(updated));
      return next;
    });
  }, []);

  const collectPayment = useCallback((id, method) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    setInvoices((list) => {
      const next = list.map((i) =>
        i.id === id ? { ...i, status: "paid", method, paidAt: ts } : i,
      );
      const paid = next.find((i) => i.id === id);
      if (paid) mirrorToLedger(receptionInvoiceToLedger(paid));
      return next;
    });
  }, []);

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
        ? { name: data.emergencyName, phone: data.emergencyPhone ?? "", relation: data.emergencyRelation ?? "" }
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

  const checkInAppointment = useCallback(
    (apptId) => {
      let issuedToken = null;
      let aptSnapshot = null;
      setAppointments((apts) => {
        const apt = apts.find((a) => a.id === apptId);
        if (!apt) return apts;
        aptSnapshot = apt;
        const docApts = apts.filter(
          (a) => a.doctorId === apt.doctorId && a.tokenNumber !== null,
        );
        const base = docTokenBase(apt.doctorId);
        const used = docApts.map((a) => a.tokenNumber).filter((n) => n >= base && n < base + 100);
        const nextNum = used.length ? Math.max(...used) + 1 : base + 1;
        issuedToken = nextNum;
        return apts.map((a) =>
          a.id === apptId ? { ...a, status: "checked-in", tokenNumber: nextNum } : a,
        );
      });
      if (aptSnapshot && issuedToken != null) {
        const apt = aptSnapshot;
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
      }
      return issuedToken;
    },
    [],
  );

  const updateAppointmentStatus = useCallback((apptId, status) => {
    setAppointments((apts) =>
      apts.map((a) => (a.id === apptId ? { ...a, status } : a)),
    );
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

  const value = useMemo(
    () => ({
      patients,
      appointments,
      doctors,
      invoices,
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
      getConsultFee,
      serviceFees,
      labCatalog,
      refreshServiceFees,
    }),
    [
      patients,
      appointments,
      doctors,
      invoices,
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
      getConsultFee,
      serviceFees,
      labCatalog,
      refreshServiceFees,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function getPatient(patients, id) {
  return patients.find((p) => p.id === id);
}

export function getDoctor(doctors, id) {
  return doctors.find((d) => d.id === id);
}
