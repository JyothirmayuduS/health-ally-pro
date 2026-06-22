import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { PATIENTS, APPOINTMENTS, DOCTORS, TODAY_STR } from "./mockData";
import { SEED_INVOICES, nextInvoiceId } from "./billingData";
import { SEED_SHIFTS, SEED_CLAIMS, STAFF, nextShiftId, nextClaimId } from "./opsData";

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
  const [patients, setPatients] = useState(PATIENTS);
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [doctors] = useState(DOCTORS);
  const [invoices, setInvoices] = useState(SEED_INVOICES);
  const [shifts, setShifts] = useState(SEED_SHIFTS);
  const [claims, setClaims] = useState(SEED_CLAIMS);
  const [staff] = useState(STAFF);

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
    return inv;
  }, []);

  const updateInvoice = useCallback((id, patch) => {
    setInvoices((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const collectPayment = useCallback((id, method) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    setInvoices((list) =>
      list.map((i) =>
        i.id === id ? { ...i, status: "paid", method, paidAt: ts } : i,
      ),
    );
  }, []);

  const addPatient = useCallback((data) => {
    const newP = {
      id: nextMrn(),
      balance: 0,
      createdAt: TODAY_STR,
      ...data,
    };
    setPatients((p) => [newP, ...p]);
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
      setAppointments((apts) => {
        const apt = apts.find((a) => a.id === apptId);
        if (!apt) return apts;
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
      return issuedToken;
    },
    [],
  );

  const updateAppointmentStatus = useCallback((apptId, status) => {
    setAppointments((apts) =>
      apts.map((a) => (a.id === apptId ? { ...a, status } : a)),
    );
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
