import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  HOSPITAL,
  SEED_ORDERS,
  STAFF,
  DOCTORS,
  type LabOrder,
  type LabPatient,
  type LabCatalogItem,
} from "./mockData";
import { pushHistory } from "./utils";
import { DEMO_TECH_EMAIL } from "./technician";
import { buildSpecimenMeta } from "./specimen";
import { LAB_PATIENTS, getSharedPatient, resolvePatientId } from "@/lib/shared/patients";
import {
  loadLabCatalog,
  saveLabCatalog,
  findCatalogItem,
  updateCatalogItem as patchCatalogItem,
  addCatalogItem,
} from "@/lib/shared/lab-catalog";
import {
  drainLabOrders,
  LAB_ORDER_EVENT,
  nextAccession,
  nextLabOrderId,
  type DoctorLabPayload,
} from "./order-bridge";
import {
  pushReceptionInvoice,
  nextBridgeInvoiceId,
} from "@/lib/shared/billing-bridge";
import { publishLabResult } from "@/lib/shared/lab-results";
import { mirrorToLedger } from "@/lib/billing-desk/store";
import { linkToEncounter, findOpenEncounterForPatient } from "@/lib/shared/encounters";
import {
  invoiceFromOrder,
  type LabInvoice,
  type LabPaymentMethod,
} from "./billing";

const ACTOR_TECH = "J. Mensah";
const ACTOR_SUP = "Dr. Rajan";

type StoreValue = {
  orders: LabOrder[];
  patients: LabPatient[];
  catalog: LabCatalogItem[];
  invoices: LabInvoice[];
  staff: typeof STAFF;
  hospital: typeof HOSPITAL;
  findCatalog: (code: string) => LabCatalogItem | undefined;
  updateCatalogPrice: (code: string, price: number) => void;
  addCatalogTest: (item: LabCatalogItem) => void;
  collect: (id: string, note?: string) => void;
  rejectCollect: (id: string, reason: string) => void;
  startProcessing: (id: string) => void;
  saveResults: (id: string, results: Record<string, string>, complete: boolean) => void;
  validate: (id: string, comment?: string, actor?: string) => void;
  rejectValid: (id: string, reason: string) => void;
  cancel: (id: string, reason: string) => void;
  addWalkIn: (input: {
    name: string;
    age: number;
    sex: string;
    phone: string;
    mrn?: string;
    testCode: string;
    priority: LabOrder["priority"];
    fasting: boolean;
    notes?: string;
  }) => { order: LabOrder; invoice: LabInvoice };
  collectLabPayment: (invoiceId: string, method: LabPaymentMethod) => void;
  flagInvoiceForReception: (invoiceId: string) => void;
  placeReceptionOrder: (input: {
    patientId: string;
    testCode: string;
    priority?: LabOrder["priority"];
    notes?: string;
  }) => LabOrder | null;
};

const StoreCtx = createContext<StoreValue | null>(null);

let walkInPatientSeq = 3000;

function enrichOrder(o: LabOrder): LabOrder {
  if (!o.collected_at) return o;
  const cat = findCatalogItem(o.test_code);
  return {
    ...o,
    specimen: o.specimen ?? buildSpecimenMeta(o, cat),
  };
}

function attachBilling(order: LabOrder, patientName: string, mrn: string): { order: LabOrder; invoice: LabInvoice } {
  const cat = findCatalogItem(order.test_code);
  const price = cat?.price ?? 0;
  const inv = invoiceFromOrder({ ...order, price }, patientName, mrn, price);
  return {
    order: {
      ...order,
      price,
      payment_status: "unpaid",
      lab_invoice_id: inv.id,
    },
    invoice: inv,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<LabOrder[]>(() => SEED_ORDERS.map(enrichOrder));
  const [patients, setPatients] = useState<LabPatient[]>(LAB_PATIENTS);
  const [catalog, setCatalog] = useState<LabCatalogItem[]>(() => loadLabCatalog());
  const [invoices, setInvoices] = useState<LabInvoice[]>([]);

  const findCatalog = useCallback(
    (code: string) => findCatalogItem(code, catalog),
    [catalog],
  );

  const ingestPayload = useCallback(
    (payload: DoctorLabPayload) => {
      const patientId = resolvePatientId(payload.patient.id);
      const shared = getSharedPatient(patientId);
      const labPatient: LabPatient = shared
        ? {
            id: shared.id,
            name: shared.name,
            mrn: shared.mrn,
            age: payload.patient.age,
            sex: payload.patient.sex,
            phone: shared.phone,
          }
        : {
            id: patientId,
            name: payload.patient.name,
            mrn: payload.patient.mrn,
            age: payload.patient.age,
            sex: payload.patient.sex,
            phone: payload.patient.phone,
          };

      setPatients((list) => {
        if (list.some((p) => p.id === labPatient.id)) return list;
        return [...list, labPatient];
      });

      const created: { order: LabOrder; invoice: LabInvoice }[] = [];
      for (const line of payload.lines) {
        const cat = findCatalogItem(line.test_code, catalog);
        const now = payload.sent_at;
        const orderId = nextLabOrderId();
        const base: LabOrder = {
          id: orderId,
          accession: nextAccession(),
          patient_id: labPatient.id,
          doctor_id: payload.doctor_id,
          doctor_name: payload.doctor_name,
          test_code: line.test_code,
          test_name: line.test_name || cat?.name || line.test_code,
          status: "ordered",
          priority: payload.priority,
          source: payload.source === "reception" ? "reception" : "doctor",
          notes: payload.notes,
          fasting: line.fasting,
          ordered_at: now,
          collected_at: null,
          completed_at: null,
          validated_at: null,
          released_at: null,
          cancelled_at: null,
          cancel_reason: null,
          assigned_to: null,
          collector: null,
          history: [
            {
              at: now,
              actor: payload.doctor_name,
              action: "Order placed",
              note: payload.source === "reception" ? "From reception desk" : undefined,
            },
          ],
        };
        created.push(attachBilling(base, labPatient.name, labPatient.mrn));
      }

      if (created.length) {
        setOrders((list) => [...created.map((c) => c.order), ...list]);
        setInvoices((list) => [...created.map((c) => c.invoice), ...list]);
        for (const { order, invoice } of created) {
          const enc = findOpenEncounterForPatient(order.patient_id);
          if (enc) linkToEncounter(enc.id, { labOrderId: order.id, invoiceId: invoice.id });
          mirrorToLedger({
            id: invoice.id,
            source: "lab",
            patientId: order.patient_id,
            patientName: invoice.patient_name,
            mrn: invoice.mrn,
            date: order.ordered_at.slice(0, 10),
            items: [{ label: `Lab — ${order.test_name}`, qty: 1, unit: invoice.amount, amount: invoice.amount }],
            subtotal: invoice.amount,
            tax: 0,
            total: invoice.amount,
            amountPaid: 0,
            status: "unpaid",
            referenceId: order.id,
            encounterId: enc?.id,
          });
          pushReceptionInvoice({
            id: nextBridgeInvoiceId(),
            patientId: order.patient_id,
            patientName: invoice.patient_name,
            doctorId: order.doctor_id,
            labOrderId: order.id,
            items: [
              {
                label: `Lab — ${order.test_name}`,
                qty: 1,
                unit: invoice.amount,
                amount: invoice.amount,
              },
            ],
            note: `Lab order ${order.id}`,
            createdAt: order.ordered_at,
          });
        }
        toast.success(`${created.length} lab order(s) received`);
      }
    },
    [catalog],
  );

  const syncInbox = useCallback(() => {
    const payloads = drainLabOrders();
    payloads.forEach(ingestPayload);
  }, [ingestPayload]);

  useEffect(() => {
    syncInbox();
    const onIncoming = () => syncInbox();
    window.addEventListener(LAB_ORDER_EVENT, onIncoming);
    return () => window.removeEventListener(LAB_ORDER_EVENT, onIncoming);
  }, [syncInbox]);

  const patchOrder = useCallback((id: string, patch: Partial<LabOrder>) => {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const collect = useCallback(
    (id: string, note?: string) => {
      const now = new Date().toISOString();
      setOrders((list) =>
        list.map((o) => {
          if (o.id !== id) return o;
          const cat = findCatalogItem(o.test_code, catalog);
          const specimen = buildSpecimenMeta(o, cat);
          return {
            ...o,
            status: "collected" as const,
            collected_at: now,
            collector: ACTOR_TECH,
            bench_tech_email: DEMO_TECH_EMAIL,
            specimen,
            history: pushHistory(o, ACTOR_TECH, "Sample collected", note),
          };
        }),
      );
      toast.success(`Specimen collected — see My samples`);
    },
    [catalog],
  );

  const rejectCollect = useCallback((id: string, reason: string) => {
    setOrders((list) =>
      list.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "ordered" as const,
              collected_at: null,
              collector: null,
              history: pushHistory(o, ACTOR_TECH, "Rejected at collection", reason),
            }
          : o,
      ),
    );
    toast(`${id} returned for re-collection`);
  }, []);

  const startProcessing = useCallback((id: string) => {
    setOrders((list) =>
      list.map((o) => {
        if (o.id !== id || o.status !== "collected") return o;
        return {
          ...o,
          status: "processing" as const,
          assigned_to: `Tech: ${ACTOR_TECH}`,
          bench_tech_email: DEMO_TECH_EMAIL,
          history: pushHistory(o, ACTOR_TECH, "Processing started"),
        };
      }),
    );
  }, []);

  const saveResults = useCallback(
    (id: string, results: Record<string, string>, complete: boolean) => {
      setOrders((list) =>
        list.map((o) => {
          if (o.id !== id) return o;
          if (complete) {
            return {
              ...o,
              results,
              status: "validation" as const,
              completed_at: new Date().toISOString(),
              bench_tech_email: o.bench_tech_email ?? DEMO_TECH_EMAIL,
              history: pushHistory(o, ACTOR_TECH, "Results entered", "Submitted for validation"),
            };
          }
          return { ...o, results };
        }),
      );
      if (complete) toast.success(`${id} submitted for validation`);
      else toast(`Draft saved · ${id}`);
    },
    [],
  );

  const validate = useCallback((id: string, comment?: string, actor = ACTOR_SUP) => {
    const now = new Date().toISOString();
    setOrders((list) => {
      const order = list.find((o) => o.id === id);
      const next = list.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "validated" as const,
              validated_at: now,
              released_at: now,
              validated_by: actor,
              history: pushHistory(o, actor, "Validated & released", comment || "Released"),
            }
          : o,
      );
      if (order) {
        const patient = patients.find((p) => p.id === order.patient_id);
        publishLabResult({
          orderId: order.id,
          patientId: order.patient_id,
          testName: order.test_name,
          testCode: order.test_code,
          results: order.results,
          abnormal: Object.values(order.results ?? {}).some((v) =>
            String(v).toLowerCase().includes("high") || String(v).toLowerCase().includes("low"),
          ),
        });
      }
      return next;
    });
    toast.success(`${id} validated & released`);
  }, [patients]);

  const rejectValid = useCallback((id: string, reason: string) => {
    setOrders((list) =>
      list.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "processing" as const,
              completed_at: null,
              history: pushHistory(o, ACTOR_SUP, "Rejected for re-processing", reason),
            }
          : o,
      ),
    );
    toast(`${id} returned to processing`);
  }, []);

  const cancel = useCallback((id: string, reason: string) => {
    const now = new Date().toISOString();
    setOrders((list) =>
      list.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "cancelled" as const,
              cancelled_at: now,
              cancel_reason: reason,
              history: pushHistory(o, ACTOR_TECH, "Cancelled", reason),
            }
          : o,
      ),
    );
    toast(`${id} cancelled`);
  }, []);

  const addWalkIn = useCallback(
    (input: {
      name: string;
      age: number;
      sex: string;
      phone: string;
      mrn?: string;
      testCode: string;
      priority: LabOrder["priority"];
      fasting: boolean;
      notes?: string;
    }) => {
      walkInPatientSeq += 1;
      const existingMrn = input.mrn ? resolvePatientId(input.mrn) : null;
      const shared = existingMrn ? getSharedPatient(existingMrn) : undefined;
      const patientId = shared?.id ?? `MRN-WI-${walkInPatientSeq}`;
      const patient: LabPatient = shared
        ? {
            id: shared.id,
            name: shared.name,
            mrn: shared.mrn,
            age: input.age,
            sex: input.sex,
            phone: shared.phone,
          }
        : {
            id: patientId,
            name: input.name,
            mrn: input.mrn || `MRN-WI-${walkInPatientSeq}`,
            age: input.age,
            sex: input.sex,
            phone: input.phone,
          };
      const cat = findCatalogItem(input.testCode, catalog);
      const doctor = DOCTORS[3];
      const now = new Date().toISOString();
      const base: LabOrder = {
        id: nextLabOrderId(),
        accession: nextAccession(),
        patient_id: patient.id,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        test_code: input.testCode,
        test_name: cat?.name || input.testCode,
        status: "ordered",
        priority: input.priority,
        source: "walk-in",
        notes: input.notes || "Walk-in lab",
        fasting: input.fasting,
        ordered_at: now,
        collected_at: null,
        completed_at: null,
        validated_at: null,
        released_at: null,
        cancelled_at: null,
        cancel_reason: null,
        assigned_to: null,
        collector: null,
        history: [{ at: now, actor: "Lab walk-in", action: "Order placed" }],
      };
      const { order, invoice } = attachBilling(base, patient.name, patient.mrn);
      if (!shared) setPatients((list) => [...list, patient]);
      setOrders((list) => [order, ...list]);
      setInvoices((list) => [invoice, ...list]);
      mirrorToLedger({
        id: invoice.id,
        source: "lab",
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        date: now.slice(0, 10),
        items: [{ label: `Lab — ${invoice.test_name}`, qty: 1, unit: invoice.amount, amount: invoice.amount }],
        subtotal: invoice.amount,
        tax: 0,
        total: invoice.amount,
        amountPaid: 0,
        status: "unpaid",
        referenceId: order.id,
      });
      return { order, invoice };
    },
    [catalog],
  );

  const placeReceptionOrder = useCallback(
    (input: {
      patientId: string;
      testCode: string;
      priority?: LabOrder["priority"];
      notes?: string;
    }) => {
      const pid = resolvePatientId(input.patientId);
      const shared = getSharedPatient(pid);
      if (!shared) return null;
      const labPatient = {
        id: shared.id,
        name: shared.name,
        mrn: shared.mrn,
        age: 0,
        sex: shared.gender.startsWith("M") ? "M" : "F",
        phone: shared.phone,
      };
      const cat = findCatalogItem(input.testCode, catalog);
      const now = new Date().toISOString();
      const base: LabOrder = {
        id: nextLabOrderId(),
        accession: nextAccession(),
        patient_id: labPatient.id,
        doctor_id: "reception",
        doctor_name: "Reception Desk",
        test_code: input.testCode,
        test_name: cat?.name || input.testCode,
        status: "ordered",
        priority: input.priority ?? "routine",
        source: "reception",
        notes: input.notes || "Ordered at reception",
        fasting: Boolean(cat?.fasting),
        ordered_at: now,
        collected_at: null,
        completed_at: null,
        validated_at: null,
        released_at: null,
        cancelled_at: null,
        cancel_reason: null,
        assigned_to: null,
        collector: null,
        history: [{ at: now, actor: "Reception", action: "Order placed" }],
      };
      const { order, invoice } = attachBilling(base, labPatient.name, labPatient.mrn);
      setOrders((list) => [order, ...list]);
      setInvoices((list) => [invoice, ...list]);
      pushReceptionInvoice({
        id: nextBridgeInvoiceId(),
        patientId: order.patient_id,
        patientName: labPatient.name,
        labOrderId: order.id,
        items: [{ label: `Lab — ${order.test_name}`, qty: 1, unit: invoice.amount, amount: invoice.amount }],
        note: `Lab order ${order.id}`,
        createdAt: now,
      });
      return order;
    },
    [catalog],
  );

  const collectLabPayment = useCallback((invoiceId: string, method: LabPaymentMethod) => {
    const now = new Date().toISOString();
    setInvoices((list) => {
      const inv = list.find((i) => i.id === invoiceId);
      const next = list.map((i) =>
        i.id === invoiceId
          ? { ...i, status: "paid" as const, method, paid_at: now }
          : i,
      );
      if (inv) {
        mirrorToLedger({
          id: inv.id,
          source: "lab",
          patientId: inv.patient_id,
          patientName: inv.patient_name,
          mrn: inv.mrn,
          date: inv.created_at.slice(0, 10),
          items: [{ label: `Lab — ${inv.test_name}`, qty: 1, unit: inv.amount, amount: inv.amount }],
          subtotal: inv.amount,
          tax: 0,
          total: inv.amount,
          amountPaid: inv.amount,
          status: "paid",
          method,
          paidAt: now,
          referenceId: inv.order_id,
        });
      }
      return next;
    });
    setOrders((list) =>
      list.map((o) =>
        o.lab_invoice_id === invoiceId ? { ...o, payment_status: "paid" } : o,
      ),
    );
    toast.success("Lab payment collected");
  }, []);

  const flagInvoiceForReception = useCallback((invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    setInvoices((list) =>
      list.map((i) => (i.id === invoiceId ? { ...i, status: "reception" } : i)),
    );
    setOrders((list) =>
      list.map((o) =>
        o.lab_invoice_id === invoiceId ? { ...o, payment_status: "reception" } : o,
      ),
    );
    pushReceptionInvoice({
      id: nextBridgeInvoiceId(),
      patientId: inv.patient_id,
      patientName: inv.patient_name,
      labOrderId: inv.order_id,
      items: [{ label: `Lab — ${inv.test_name}`, qty: 1, unit: inv.amount, amount: inv.amount }],
      note: `Collect at reception · ${inv.order_id}`,
      createdAt: new Date().toISOString(),
    });
    toast.success("Flagged for reception collection");
  }, [invoices]);

  const updateCatalogPrice = useCallback((code: string, price: number) => {
    const next = patchCatalogItem(code, { price }, catalog);
    setCatalog(next);
    toast.success(`Updated ${code} price`);
  }, [catalog]);

  const addCatalogTest = useCallback((item: LabCatalogItem) => {
    const next = addCatalogItem(item, catalog);
    setCatalog(next);
    toast.success(`Added ${item.code} to catalog`);
  }, [catalog]);

  const value = useMemo(
    () => ({
      orders,
      patients,
      catalog,
      invoices,
      staff: STAFF,
      hospital: HOSPITAL,
      findCatalog,
      updateCatalogPrice,
      addCatalogTest,
      collect,
      rejectCollect,
      startProcessing,
      saveResults,
      validate,
      rejectValid,
      cancel,
      addWalkIn,
      collectLabPayment,
      flagInvoiceForReception,
      placeReceptionOrder,
    }),
    [
      orders,
      patients,
      catalog,
      invoices,
      findCatalog,
      updateCatalogPrice,
      addCatalogTest,
      collect,
      rejectCollect,
      startProcessing,
      saveResults,
      validate,
      rejectValid,
      cancel,
      addWalkIn,
      collectLabPayment,
      flagInvoiceForReception,
      placeReceptionOrder,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useLabStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useLabStore must be used within StoreProvider");
  return ctx;
}

export { getPatient, flagValue, formatRelative, formatDateTime } from "./utils";
