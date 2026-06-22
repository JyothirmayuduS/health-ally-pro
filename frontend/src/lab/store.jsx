// Lab portal store — React Context + localStorage persistence
// Mirrors a zustand-like API for components to consume.

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { SEED_ORDERS, PATIENTS, DOCTORS, LAB_CATALOG, findCatalog, STAFF, HOSPITAL } from "@/lab/mockData";

const STORAGE_KEY = "medora_lab_store_v1";

const initialState = {
  orders: SEED_ORDERS,
  role: "lab_supervisor", // lab_technician | lab_supervisor
  activeStaff: "Dr. Sasha Pereira",
};

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

const LabCtx = createContext(null);

export function LabProvider({ children }) {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const setRole = useCallback((role) => {
    const staffMember = STAFF.find((s) => s.role === role);
    setState((s) => ({
      ...s,
      role,
      activeStaff: staffMember ? staffMember.name : s.activeStaff,
    }));
  }, []);

  const updateOrder = useCallback((id, patch, historyEntry) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              ...patch,
              history: historyEntry ? [...(o.history || []), historyEntry] : o.history,
            }
          : o,
      ),
    }));
  }, []);

  const cancelOrder = useCallback(
    (id, reason) => {
      updateOrder(
        id,
        {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        },
        {
          at: new Date().toISOString(),
          actor: state.activeStaff,
          action: "Cancelled",
          note: reason,
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const collectSample = useCallback(
    (id, { collector, note }) => {
      updateOrder(
        id,
        {
          status: "collected",
          collected_at: new Date().toISOString(),
          collector: collector || state.activeStaff,
        },
        {
          at: new Date().toISOString(),
          actor: collector || state.activeStaff,
          action: "Sample collected",
          note: note || "",
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const rejectAtCollection = useCallback(
    (id, reason) => {
      updateOrder(
        id,
        {
          status: "ordered", // bounce back to ordered for re-collection
          collected_at: null,
          collector: null,
        },
        {
          at: new Date().toISOString(),
          actor: state.activeStaff,
          action: "Rejected at collection",
          note: reason,
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const startProcessing = useCallback(
    (id) => {
      updateOrder(
        id,
        {
          status: "processing",
          assigned_to: `Tech: ${state.activeStaff}`,
        },
        {
          at: new Date().toISOString(),
          actor: state.activeStaff,
          action: "Processing started",
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const saveResults = useCallback(
    (id, results, { complete }) => {
      updateOrder(
        id,
        {
          results,
          status: complete ? "validation" : "processing",
          completed_at: complete ? new Date().toISOString() : null,
        },
        complete
          ? {
              at: new Date().toISOString(),
              actor: state.activeStaff,
              action: "Results entered",
              note: "Submitted for validation",
            }
          : null,
      );
    },
    [updateOrder, state.activeStaff],
  );

  const validateOrder = useCallback(
    (id, comment) => {
      updateOrder(
        id,
        {
          status: "validated",
          validated_at: new Date().toISOString(),
          released_at: new Date().toISOString(),
          validated_by: state.activeStaff,
        },
        {
          at: new Date().toISOString(),
          actor: state.activeStaff,
          action: "Validated & released",
          note: comment || "Released to doctor + patient",
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const rejectValidation = useCallback(
    (id, comment) => {
      updateOrder(
        id,
        {
          status: "processing",
          completed_at: null,
        },
        {
          at: new Date().toISOString(),
          actor: state.activeStaff,
          action: "Rejected for re-processing",
          note: comment,
        },
      );
    },
    [updateOrder, state.activeStaff],
  );

  const resetSeed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      patients: PATIENTS,
      doctors: DOCTORS,
      catalog: LAB_CATALOG,
      staff: STAFF,
      hospital: HOSPITAL,
      findCatalog,
      setRole,
      updateOrder,
      cancelOrder,
      collectSample,
      rejectAtCollection,
      startProcessing,
      saveResults,
      validateOrder,
      rejectValidation,
      resetSeed,
    }),
    [state, setRole, updateOrder, cancelOrder, collectSample, rejectAtCollection, startProcessing, saveResults, validateOrder, rejectValidation, resetSeed],
  );

  return <LabCtx.Provider value={value}>{children}</LabCtx.Provider>;
}

export function useLab() {
  const ctx = useContext(LabCtx);
  if (!ctx) throw new Error("useLab must be used within LabProvider");
  return ctx;
}

// Helpers
export function getPatient(orders_or_id, patients) {
  // overloaded: pass either order or patient_id
  const pid = typeof orders_or_id === "string" ? orders_or_id : orders_or_id?.patient_id;
  return patients.find((p) => p.id === pid);
}

export function getDoctor(orders_or_id, doctors) {
  const did = typeof orders_or_id === "string" ? orders_or_id : orders_or_id?.doctor_id;
  return doctors.find((d) => d.id === did);
}

export function flagValue(param, value) {
  // returns { level: 'normal'|'low'|'high'|'critical', label }
  if (value === "" || value === null || value === undefined) return { level: "empty", label: "" };
  if (param.ref_text !== undefined) {
    const expected = String(param.ref_text).toLowerCase();
    return String(value).toLowerCase() === expected
      ? { level: "normal", label: "Normal" }
      : { level: "high", label: "Abnormal" };
  }
  const num = Number(value);
  if (Number.isNaN(num)) return { level: "empty", label: "" };
  if (param.critical_low !== undefined && num <= param.critical_low) return { level: "critical", label: "Critical Low" };
  if (param.critical_high !== undefined && num >= param.critical_high) return { level: "critical", label: "Critical High" };
  if (param.ref_low !== undefined && num < param.ref_low) return { level: "low", label: "Low" };
  if (param.ref_high !== undefined && num > param.ref_high) return { level: "high", label: "High" };
  return { level: "normal", label: "Normal" };
}

export function formatRelative(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function formatClock(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
