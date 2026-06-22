// Backend-driven lab data store (replaces the prior localStorage mock).
// Components consume orders/patients/catalog via useLab() and mutate via API helpers.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  listOrders, listPatients, fetchCatalog, listStaff,
  collectOrder, rejectCollection, startProcess, saveOrderResults,
  validateOrderApi, rejectValidationApi, cancelOrderApi, seedDemo,
} from "@/lab/api";
import { useAuth } from "@/lab/auth";

const LabCtx = createContext(null);

const HOSPITAL = {
  name: "Medora Health Sciences",
  tagline: "Integrated diagnostic care",
  address: "412 Linden Way · Suite 2200 · Auckland 1010",
  phone: "+64 9 555 0188",
  email: "lab@medora.health",
  lab_director: "Dr. Sasha Pereira, MD · Lab Director",
  clia: "CLIA #74D2204918",
};

export function LabProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [o, p, c, s] = await Promise.all([
        listOrders().catch(() => []),
        listPatients().catch(() => []),
        fetchCatalog().catch(() => []),
        listStaff().catch(() => []),
      ]);
      setOrders(o);
      setPatients(p);
      setCatalog(c);
      setStaff(s);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  // Quiet refresh every 30s so multi-actor flows feel live
  useEffect(() => {
    if (!user) return undefined;
    const t = setInterval(() => {
      listOrders().then(setOrders).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [user]);

  const findCatalog = useCallback(
    (code) => catalog.find((c) => c.code === code),
    [catalog],
  );

  const refreshOne = (updated) => {
    setOrders((prev) => {
      const exists = prev.find((p) => p.id === updated.id);
      if (exists) return prev.map((p) => (p.id === updated.id ? updated : p));
      return [updated, ...prev];
    });
  };

  const collect = useCallback(async (id, note) => {
    const u = await collectOrder(id, note);
    refreshOne(u);
    toast.success(`Sample collected for ${id}`);
  }, []);

  const rejectCollect = useCallback(async (id, reason) => {
    const u = await rejectCollection(id, reason);
    refreshOne(u);
    toast(`${id} returned for re-collection`);
  }, []);

  const startProcessing = useCallback(async (id) => {
    const u = await startProcess(id);
    refreshOne(u);
  }, []);

  const saveResults = useCallback(async (id, results, complete) => {
    const u = await saveOrderResults(id, results, complete);
    refreshOne(u);
    if (complete) toast.success(`${id} submitted for validation`);
    else toast(`Draft saved · ${id}`);
  }, []);

  const validate = useCallback(async (id, comment) => {
    const u = await validateOrderApi(id, comment);
    refreshOne(u);
    toast.success(`${id} validated & released`);
  }, []);

  const rejectValid = useCallback(async (id, reason) => {
    const u = await rejectValidationApi(id, reason);
    refreshOne(u);
    toast(`${id} returned to processing`);
  }, []);

  const cancel = useCallback(async (id, reason) => {
    const u = await cancelOrderApi(id, reason);
    refreshOne(u);
    toast(`${id} cancelled`);
  }, []);

  const seedSample = useCallback(async () => {
    try {
      await seedDemo();
      await reload();
      toast.success("Sample patients seeded");
    } catch (e) {
      toast.error("Seed failed (supervisor role required)");
    }
  }, [reload]);

  const value = useMemo(
    () => ({
      orders, patients, catalog, staff, loading,
      hospital: HOSPITAL,
      findCatalog,
      reload, refreshOne,
      collect, rejectCollect, startProcessing,
      saveResults, validate, rejectValid, cancel, seedSample,
    }),
    [orders, patients, catalog, staff, loading, findCatalog, reload, collect, rejectCollect, startProcessing, saveResults, validate, rejectValid, cancel, seedSample],
  );

  return <LabCtx.Provider value={value}>{children}</LabCtx.Provider>;
}

export function useLab() {
  const ctx = useContext(LabCtx);
  if (!ctx) throw new Error("useLab must be used inside LabProvider");
  return ctx;
}

// helpers
export const getPatient = (o, patients) =>
  patients.find((p) => p.id === (typeof o === "string" ? o : o?.patient_id));

export function flagValue(param, value) {
  if (value === "" || value === null || value === undefined) return { level: "empty", label: "" };
  if (param.ref_text !== undefined) {
    return String(value).toLowerCase() === String(param.ref_text).toLowerCase()
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

export const formatRelative = (iso) => {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
