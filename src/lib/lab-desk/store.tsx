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
import { checkCriticalValues, type CriticalAlert } from "./criticalValueUtils";
import { SEED_QC_RUNS, type QCRun } from "./qcData";
import { SEED_REAGENTS, type Reagent } from "./reagentData";
import { pushPatientNotification } from "@/lib/patient-notifications-store";
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

export interface CriticalValueNotification {
  id: string;
  orderId: string;
  patientId: string;
  doctorId: string;
  parameters: {
    parameterName: string;
    value: string;
    unit: string;
    threshold: string;
    direction: "low" | "high";
  }[];
  notifiedBy: string;
  notifiedPerson: string;
  method: string;
  notes?: string;
  notifiedAt: string;
  acknowledgedAt: string | null;
  status: "pending_ack" | "acknowledged";
}

export interface Aliquot {
  id: string;
  parentAccession: string;
  volume: number;
  containerType: string;
  destination: string;
  createdAt: string;
  status: "active" | "disposed";
}

export interface LabShiftReport {
  id: string;
  date: string;
  shift: "morning" | "afternoon" | "night";
  technicianName: string;
  supervisorName?: string;
  handoverNotes?: string;
  throughput: {
    received: number;
    stat: number;
    urgent: number;
    routine: number;
    completed: number;
    pending: number;
    tatComplianceRate: number;
  };
  quality: {
    qcPass: number;
    qcWarning: number;
    qcFail: number;
    criticalAlertsCount: number;
    deltaFailuresCount: number;
  };
  integrity: {
    rejectedCollection: number;
    rejectedReception: number;
    storedCount: number;
  };
  reagents: {
    lowOrExpiredCount: number;
    blockedTestsCount: number;
  };
  status: "draft" | "signed";
  signedAt?: string;
}

type StoreValue = {
  orders: LabOrder[];
  patients: LabPatient[];
  catalog: LabCatalogItem[];
  invoices: LabInvoice[];
  staff: typeof STAFF;
  hospital: typeof HOSPITAL;
  criticalNotifications: CriticalValueNotification[];
  qcRuns: QCRun[];
  reagents: Reagent[];
  aliquots: Aliquot[];
  labShiftReports: LabShiftReport[];
  qcLocks: string[]; // List of locked analytes/test codes
  findCatalog: (code: string) => LabCatalogItem | undefined;
  updateCatalogPrice: (code: string, price: number) => void;
  addCatalogTest: (item: LabCatalogItem) => void;
  collect: (id: string, note?: string, condition?: string) => void;
  rejectCollect: (id: string, reason: string) => void;
  startProcessing: (id: string) => void;
  saveResults: (id: string, results: Record<string, string>, complete: boolean) => void;
  validate: (id: string, comment?: string, actor?: string, criticalNotifData?: { notifiedPerson: string; method: string; notes?: string }) => void;
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
  // New actions:
  acknowledgeCriticalAlert: (id: string, actor?: string) => void;
  supervisorOverrideCondition: (id: string, reason: string, actor: string) => void;
  logQCRun: (run: Omit<QCRun, "id" | "date" | "status" | "rulesTriggered">) => void;
  logQCCorrectiveAction: (runId: string, action: string) => void;
  acceptSampleAtLab: (orderId: string, condition: string, reason?: string) => void;
  storeSample: (orderId: string, rack: string, box: string, position: string, retentionDays: number) => void;
  disposeSample: (orderId: string) => void;
  addReagentLot: (reagent: Omit<Reagent, "id">) => void;
  createAliquots: (orderId: string, list: Omit<Aliquot, "id" | "parentAccession" | "createdAt" | "status">[]) => void;
  saveShiftReport: (report: LabShiftReport) => void;
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
  const [criticalNotifications, setCriticalNotifications] = useState<CriticalValueNotification[]>(() => [
    {
      id: "CRIT-001",
      orderId: "ORD-101",
      patientId: "P-101",
      doctorId: "DOC-202",
      parameters: [
        { parameterName: "Potassium", value: "6.8", unit: "mmol/L", threshold: ">= 6.5", direction: "high" }
      ],
      notifiedBy: "J. Mensah",
      notifiedPerson: "Dr. Saanvi Reddy",
      method: "Phone call",
      notes: "Informed of critical K+ level. Doctor ordered urgent dialysis check.",
      notifiedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      acknowledgedAt: null,
      status: "pending_ack"
    },
    {
      id: "CRIT-002",
      orderId: "ORD-102",
      patientId: "P-102",
      doctorId: "DOC-203",
      parameters: [
        { parameterName: "Glucose", value: "32", unit: "mg/dL", threshold: "<= 40", direction: "low" }
      ],
      notifiedBy: "J. Mensah",
      notifiedPerson: "Nurse Anita",
      method: "In-person",
      notes: "Ward 3 nurse notified. Patient being administered IV dextrose.",
      notifiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      acknowledgedAt: null,
      status: "pending_ack"
    }
  ]);
  const [qcRuns, setQCRuns] = useState<QCRun[]>(() => SEED_QC_RUNS);
  const [qcLocks, setQcLocks] = useState<string[]>([]);
  const [reagents, setReagents] = useState<Reagent[]>(() => SEED_REAGENTS);
  const [aliquots, setAliquots] = useState<Aliquot[]>(() => [
    {
      id: "ACC-001-A",
      parentAccession: "ACC-001",
      volume: 1.5,
      containerType: "Microcentrifuge tube",
      destination: "Bench — Biochemistry",
      createdAt: new Date().toISOString(),
      status: "active"
    },
    {
      id: "ACC-001-B",
      parentAccession: "ACC-001",
      volume: 2.0,
      containerType: "Cryovial",
      destination: "Archive",
      createdAt: new Date().toISOString(),
      status: "active"
    }
  ]);
  const [labShiftReports, setLabShiftReports] = useState<LabShiftReport[]>(() => [
    {
      id: "REP-SHIFT-001",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10),
      shift: "morning",
      technicianName: "J. Mensah",
      supervisorName: "Dr. Rajan",
      handoverNotes: "All instruments functioning normally. Controls verified.",
      throughput: { received: 24, stat: 5, urgent: 8, routine: 11, completed: 22, pending: 2, tatComplianceRate: 95.8 },
      quality: { qcPass: 12, qcWarning: 2, qcFail: 0, criticalAlertsCount: 2, deltaFailuresCount: 0 },
      integrity: { rejectedCollection: 1, rejectedReception: 0, storedCount: 21 },
      reagents: { lowOrExpiredCount: 1, blockedTestsCount: 0 },
      status: "signed",
      signedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
    }
  ]);

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
    (id: string, note?: string, condition?: string) => {
      const now = new Date().toISOString();
      setOrders((list) =>
        list.map((o) => {
          if (o.id !== id) return o;
          const cat = findCatalogItem(o.test_code, catalog);
          const specimen = buildSpecimenMeta(o, cat);
          const finalCondition = (condition as LabOrder["specimen"] extends undefined ? never : NonNullable<LabOrder["specimen"]>["condition"]) ?? "Adequate";
          const coc = [
            {
              step: 'collected' as const,
              performedBy: ACTOR_TECH,
              performedAt: now,
              notes: note || "Blood sample drawn successfully.",
              location: "Phlebotomy Bay"
            }
          ];
          return {
            ...o,
            status: "collected" as const,
            collected_at: now,
            collector: ACTOR_TECH,
            bench_tech_email: DEMO_TECH_EMAIL,
            specimen: { ...specimen, condition: finalCondition as any },
            chainOfCustody: coc,
            history: pushHistory(o, ACTOR_TECH, `Sample collected — Condition: ${finalCondition}`, note),
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
      let orderToSave: LabOrder | undefined;
      setOrders((list) => {
        orderToSave = list.find((o) => o.id === id);
        return list;
      });

      if (!orderToSave) {
        toast.error("Order not found");
        return;
      }

      const testCode = orderToSave.test_code;
      let blocked = false;
      let lowReagents: string[] = [];

      setReagents((list) => {
        const linked = list.filter((r) => r.testCodes.includes(testCode.toLowerCase()));
        for (const r of linked) {
          const isExpired = new Date(r.expiryDate).getTime() < Date.now();
          const isOutOfStock = r.testsRemaining <= 0;
          if (isExpired || isOutOfStock) {
            blocked = true;
          } else if (r.testsRemaining / r.maxTests < 0.2) {
            lowReagents.push(r.name);
          }
        }
        return list;
      });

      if (blocked) {
        toast.error("Reagent expired/exhausted. Cannot save results. Contact supervisor.");
        return;
      }

      if (lowReagents.length > 0) {
        toast.warning(`Low reagent warning: ${lowReagents.join(", ")}`);
      }

      setReagents((list) =>
        list.map((r) => {
          if (r.testCodes.includes(testCode.toLowerCase())) {
            return { ...r, testsRemaining: Math.max(0, r.testsRemaining - 1) };
          }
          return r;
        })
      );

      const cat = findCatalog(testCode);
      const criticalAlerts = checkCriticalValues(results, cat?.parameters);
      const isCritical = criticalAlerts.length > 0;

      setOrders((list) =>
        list.map((o) => {
          if (o.id !== id) return o;

          let finalPriority = o.priority;
          if (isCritical && (o.priority === "routine" || o.priority === "urgent")) {
            finalPriority = "stat";
            toast.warning(`Critical value detected! Automatically escalated order to STAT.`);
          }

          const coc = o.chainOfCustody ? [...o.chainOfCustody] : [];
          if (complete && !coc.some((c) => c.step === "assigned_to_bench")) {
            coc.push({
              step: "assigned_to_bench" as const,
              performedBy: ACTOR_TECH,
              performedAt: new Date().toISOString(),
              location: "Bench 3 — Hematology",
              notes: "Assigned for bench verification"
            });
          }

          if (complete) {
            return {
              ...o,
              results,
              priority: finalPriority,
              status: "validation" as const,
              completed_at: new Date().toISOString(),
              bench_tech_email: o.bench_tech_email ?? DEMO_TECH_EMAIL,
              chainOfCustody: coc,
              history: pushHistory(o, ACTOR_TECH, "Results entered", "Submitted for validation"),
            };
          }
          return { ...o, results, priority: finalPriority };
        }),
      );
      if (complete) toast.success(`${id} submitted for validation`);
      else toast(`Draft saved · ${id}`);
    },
    [findCatalog],
  );

  const validate = useCallback((
    id: string,
    comment?: string,
    actor = ACTOR_SUP,
    criticalNotifData?: { notifiedPerson: string; method: string; notes?: string }
  ) => {
    let orderToValidate: LabOrder | undefined;
    setOrders((list) => {
      orderToValidate = list.find((o) => o.id === id);
      return list;
    });

    if (!orderToValidate) {
      toast.error("Order not found");
      return;
    }

    let isLocked = false;
    setQcLocks((locks) => {
      if (locks.includes(orderToValidate!.test_code.toLowerCase())) {
        isLocked = true;
      }
      return locks;
    });

    if (isLocked) {
      toast.error(`QC Lock in place for ${orderToValidate.test_code}. Cannot release results.`);
      return;
    }

    const now = new Date().toISOString();
    const cat = findCatalog(orderToValidate.test_code);
    const criticalAlerts = checkCriticalValues(orderToValidate.results, cat?.parameters);

    setOrders((list) => {
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
      if (orderToValidate) {
        const pat = patients.find((p) => p.id === orderToValidate.patient_id);
        publishLabResult({
          orderId: orderToValidate.id,
          patientId: orderToValidate.patient_id,
          testName: orderToValidate.test_name,
          testCode: orderToValidate.test_code,
          results: orderToValidate.results,
          abnormal: Object.values(orderToValidate.results ?? {}).some((v) =>
            String(v).toLowerCase().includes("high") || String(v).toLowerCase().includes("low"),
          ),
          doctorName: orderToValidate.doctor_name,
          doctorId: orderToValidate.doctor_id,
          patientName: pat?.name,
        });
      }
      return next;
    });

    if (criticalAlerts.length > 0) {
      const newNotif: CriticalValueNotification = {
        id: `CRIT-NOTIF-${Date.now()}`,
        orderId: id,
        patientId: orderToValidate.patient_id,
        doctorId: orderToValidate.doctor_id,
        parameters: criticalAlerts,
        notifiedBy: actor,
        notifiedPerson: criticalNotifData?.notifiedPerson || "Standard Routing",
        method: criticalNotifData?.method || "System Automated Paging",
        notes: criticalNotifData?.notes || "",
        notifiedAt: now,
        acknowledgedAt: null,
        status: "pending_ack"
      };

      setCriticalNotifications((prev) => [newNotif, ...prev]);

      pushPatientNotification({
        title: "Critical Lab Results Released",
        body: `Critical values identified in your ${orderToValidate.test_name} report. Your physician has been notified.`,
        at: "Just now",
        type: "report",
        to: `/patient/reports/${orderToValidate.id}`,
      });
    } else {
      // Normal (non-critical) result — still notify patient and referring doctor
      pushPatientNotification({
        title: "Lab Results Ready",
        body: `Your ${orderToValidate.test_name} results have been validated and released by the laboratory. Ordered by ${orderToValidate.doctor_name || "your doctor"}.`,
        at: "Just now",
        type: "report",
        to: `/patient/reports/${orderToValidate.id}`,
      });
    }

    toast.success(`${id} validated & released`);
  }, [patients, findCatalog]);

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

  const acknowledgeCriticalAlert = useCallback((id: string, actor?: string) => {
    const acknowledgedBy = actor || ACTOR_SUP;
    setCriticalNotifications((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              acknowledgedAt: new Date().toISOString(),
              status: "acknowledged" as const,
              notifiedPerson: n.notifiedPerson, // preserve
              notes: (n.notes ? n.notes + " | " : "") + `Confirmed by ${acknowledgedBy}`,
            }
          : n
      )
    );
    toast.success(`Critical alert acknowledged by ${acknowledgedBy}`);
  }, []);

  const supervisorOverrideCondition = useCallback((id: string, reason: string, actor: string) => {
    const now = new Date().toISOString();
    setOrders((list) =>
      list.map((o) =>
        o.id === id
          ? {
              ...o,
              sampleConditionOverride: { overriddenBy: actor, overriddenAt: now, reason },
              history: pushHistory(o, actor, `Supervisor override: non-adequate sample approved for processing`, reason),
            }
          : o
      )
    );
    toast.success(`Sample condition override recorded by ${actor}`);
  }, []);

  const logQCRun = useCallback((run: Omit<QCRun, "id" | "date" | "status" | "rulesTriggered">) => {
    const diff = run.value - run.mean;
    const sdUnits = Math.abs(diff / run.sd);
    let status: "pass" | "warning" | "fail" = "pass";
    let rules: string[] = [];

    if (sdUnits >= 3.0) {
      status = "fail";
      rules.push("1_3s Westgard Rule Violation (Value > 3SD)");
    } else if (sdUnits >= 2.0) {
      status = "warning";
      rules.push("1_2s Westgard Rule Warning (Value > 2SD)");
    }

    const newRun: QCRun = {
      ...run,
      id: `QC-RUN-${Date.now()}`,
      date: new Date().toISOString(),
      status,
      rulesTriggered: rules,
    };

    setQCRuns((prev) => [newRun, ...prev]);

    if (status === "fail") {
      setQcLocks((locks) => [...locks, run.analyte.toLowerCase()]);
      toast.error(`QC FAILED for ${run.analyteName}! Reagent/analyte locked for patient release.`);
    } else {
      toast.success(`QC Run logged successfully: ${status.toUpperCase()}`);
    }
  }, []);

  const logQCCorrectiveAction = useCallback((runId: string, action: string) => {
    let affectedAnalyte = "";
    setQCRuns((list) =>
      list.map((r) => {
        if (r.id === runId) {
          affectedAnalyte = r.analyte;
          return { ...r, correctiveAction: action, status: "pass" };
        }
        return r;
      })
    );
    if (affectedAnalyte) {
      setQcLocks((locks) => locks.filter((l) => l !== affectedAnalyte.toLowerCase()));
      toast.success(`Corrective action recorded. QC lock lifted for ${affectedAnalyte.toUpperCase()}.`);
    }
  }, []);

  const acceptSampleAtLab = useCallback((orderId: string, condition: string, reason?: string) => {
    const now = new Date().toISOString();
    setOrders((list) =>
      list.map((o) => {
        if (o.id !== orderId) return o;
        const coc = o.chainOfCustody ? [...o.chainOfCustody] : [];
        coc.push({
          step: "received_at_lab" as const,
          performedBy: ACTOR_TECH,
          performedAt: now,
          location: "Lab Reception Counter",
          notes: `Condition: ${condition}. ${reason || ""}`
        });

        const nextSpecimen = o.specimen
          ? { ...o.specimen, condition: condition as any }
          : undefined;

        return {
          ...o,
          chainOfCustody: coc,
          specimen: nextSpecimen,
          history: pushHistory(o, ACTOR_TECH, `Sample Accepted - ${condition}`, reason)
        };
      })
    );
    toast.success(`Sample condition recorded: ${condition}`);
  }, []);

  const storeSample = useCallback((orderId: string, rack: string, box: string, position: string, retentionDays: number) => {
    const now = new Date().toISOString();
    const expiry = new Date(Date.now() + retentionDays * 24 * 3600 * 1000).toISOString();
    setOrders((list) =>
      list.map((o) => {
        if (o.id !== orderId) return o;
        const coc = o.chainOfCustody ? [...o.chainOfCustody] : [];
        coc.push({
          step: "stored" as const,
          performedBy: ACTOR_TECH,
          performedAt: now,
          location: `Freezer A — Rack ${rack}, Box ${box}, Pos ${position}`,
          notes: `Stored for ${retentionDays} days retention.`
        });
        return {
          ...o,
          chainOfCustody: coc,
          sampleStorage: {
            rack,
            box,
            position,
            retentionExpiry: expiry,
            storedBy: ACTOR_TECH,
            storedAt: now,
            status: "stored" as const
          },
          history: pushHistory(o, ACTOR_TECH, "Sample put in storage")
        };
      })
    );
    toast.success(`Sample stored successfully in Freezer A`);
  }, []);

  const disposeSample = useCallback((orderId: string) => {
    const now = new Date().toISOString();
    setOrders((list) =>
      list.map((o) => {
        if (o.id !== orderId) return o;
        const coc = o.chainOfCustody ? [...o.chainOfCustody] : [];
        coc.push({
          step: "disposed" as const,
          performedBy: ACTOR_TECH,
          performedAt: now,
          location: "Biohazard Disposal",
          notes: "Sample retention period completed. Safely incinerated/disposed."
        });
        return {
          ...o,
          chainOfCustody: coc,
          sampleStorage: o.sampleStorage ? { ...o.sampleStorage, status: "disposed" as const } : undefined,
          history: pushHistory(o, ACTOR_TECH, "Sample disposed")
        };
      })
    );
    toast.success(`Sample disposed and logged`);
  }, []);

  const addReagentLot = useCallback((reagent: Omit<Reagent, "id">) => {
    const newReg: Reagent = {
      ...reagent,
      id: `REG-${Date.now()}`
    };
    setReagents((prev) => [newReg, ...prev]);
    toast.success(`Registered reagent lot ${reagent.lotNumber}`);
  }, []);

  const createAliquots = useCallback((orderId: string, list: Omit<Aliquot, "id" | "parentAccession" | "createdAt" | "status">[]) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const parentAcc = order.accession;
    const newAliquots = list.map((a, i) => ({
      ...a,
      id: `${parentAcc}-${String.fromCharCode(65 + i)}`,
      parentAccession: parentAcc,
      createdAt: new Date().toISOString(),
      status: "active" as const
    }));
    setAliquots((prev) => [...newAliquots, ...prev]);
    toast.success(`Created ${list.length} aliquots for ${parentAcc}`);
  }, [orders]);

  const saveShiftReport = useCallback((report: LabShiftReport) => {
    setLabShiftReports((prev) => [report, ...prev]);
    toast.success(`Shift report saved: ${report.shift.toUpperCase()}`);
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
      criticalNotifications,
      qcRuns,
      reagents,
      aliquots,
      labShiftReports,
      qcLocks,
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
      acknowledgeCriticalAlert,
      supervisorOverrideCondition,
      logQCRun,
      logQCCorrectiveAction,
      acceptSampleAtLab,
      storeSample,
      disposeSample,
      addReagentLot,
      createAliquots,
      saveShiftReport,
    }),
    [
      orders,
      patients,
      catalog,
      invoices,
      criticalNotifications,
      qcRuns,
      reagents,
      aliquots,
      labShiftReports,
      qcLocks,
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
      acknowledgeCriticalAlert,
      supervisorOverrideCondition,
      logQCRun,
      logQCCorrectiveAction,
      acceptSampleAtLab,
      storeSample,
      disposeSample,
      addReagentLot,
      createAliquots,
      saveShiftReport,
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
