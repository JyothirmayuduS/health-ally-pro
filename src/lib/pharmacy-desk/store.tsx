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
  DRUGS,
  DOCTORS,
  HOSPITAL,
  PATIENTS,
  PHARMACIST,
  SEED_CONTROLLED,
  SEED_MOVEMENTS,
  SEED_PRESCRIPTIONS,
  SEED_REFILLS,
  SEED_WARD_ORDERS,
  SEED_ALERTS,
  STOCK_BATCHES,
  type Drug,
  type Prescription,
  type RefillRequest,
  type StockBatch,
  type StockMovement,
  type ControlledEntry,
  type WardOrder,
  type PharmacyAlert,
  type WalkInItem,
} from "./mockData";
import { availableQty, fefoBatch } from "./location";
import { pushHistory, getPatient } from "./utils";
import {
  drainDoctorPrescriptions,
  PHARMACY_RX_EVENT,
  type DoctorRxPayload,
} from "./prescription-bridge";
import type { PharmacyPatient } from "./mockData";
import {
  invoiceFromRx,
  balanceDue,
  type PharmacyInvoice,
  type PaymentMethod,
} from "./billing";
import { mirrorToLedger } from "@/lib/billing-desk/store";
import { findOpenEncounterForPatient, linkToEncounter } from "@/lib/shared/encounters";
import {
  loadFormulary,
  saveFormulary,
  normalizeDrug,
  weightedAvgCost,
  type DrugPricingPatch,
  type ReceiveStockOptions,
} from "./formulary";

const ACTOR = PHARMACIST.name;

function buildSeedInvoices(
  prescriptions: Prescription[],
  patients: PharmacyPatient[],
  drugs: Drug[],
): PharmacyInvoice[] {
  return prescriptions.map((rx, i) => {
    const p = getPatient(rx, patients);
    const inv = invoiceFromRx(rx, p?.name ?? "Unknown", p?.mrn ?? "—", 10040 + i, drugs);
    if (rx.payment_status === "paid") {
      inv.amount_paid = inv.total;
      inv.status = "paid";
      inv.paid_at = rx.paid_at ?? rx.received_at;
      inv.payment_method = rx.payment_method ?? "cash";
    } else if (rx.payment_status === "partial") {
      inv.amount_paid = rx.amount_paid ?? Math.round(inv.total * 0.5 * 100) / 100;
      inv.status = "partial";
    }
    if (rx.invoice_number) inv.invoice_number = rx.invoice_number;
    return inv;
  });
}

function rebuildOpenInvoices(
  invoices: PharmacyInvoice[],
  prescriptions: Prescription[],
  patients: PharmacyPatient[],
  drugs: Drug[],
): PharmacyInvoice[] {
  return invoices.map((inv) => {
    if (inv.status === "paid") return inv;
    const rx = prescriptions.find((r) => r.id === inv.rx_id);
    if (!rx) return inv;
    const p = getPatient(rx, patients);
    const seq = Number.parseInt(inv.invoice_number.replace(/\D/g, ""), 10) || 10040;
    const fresh = invoiceFromRx(
      rx,
      p?.name ?? inv.patient_name,
      p?.mrn ?? inv.mrn,
      seq,
      drugs,
    );
    return {
      ...fresh,
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount_paid: inv.amount_paid,
      status: inv.status,
      payment_method: inv.payment_method,
      paid_at: inv.paid_at,
    };
  });
}

type StoreValue = {
  drugs: Drug[];
  batches: StockBatch[];
  prescriptions: Prescription[];
  refills: RefillRequest[];
  movements: StockMovement[];
  controlled: ControlledEntry[];
  wardOrders: WardOrder[];
  alerts: PharmacyAlert[];
  walkInSales: WalkInItem[];
  patients: typeof PATIENTS;
  doctors: typeof DOCTORS;
  hospital: typeof HOSPITAL;
  invoices: PharmacyInvoice[];
  findDrug: (id: string) => Drug | undefined;
  getInvoiceForRx: (rxId: string) => PharmacyInvoice | undefined;
  collectRxPayment: (rxId: string, method: PaymentMethod, amount?: number) => void;
  updateDrugPricing: (drugId: string, patch: DrugPricingPatch) => void;
  acceptRx: (id: string) => void;
  holdRx: (id: string, reason: string) => void;
  rejectRx: (id: string, reason: string) => void;
  startDispense: (id: string) => void;
  pickLine: (rxId: string, lineId: string, batchId: string, qty: number) => void;
  completeDispense: (id: string, counseling?: string, witness?: string) => void;
  markCollected: (id: string) => void;
  approveRefill: (id: string) => void;
  denyRefill: (id: string, reason: string) => void;
  receiveStock: (
    drugId: string,
    lot: string,
    expiry: string,
    qty: number,
    options?: ReceiveStockOptions,
  ) => void;
  adjustStock: (batchId: string, qtyDelta: number, reason: string) => void;
  transferBatch: (batchId: string, newLocationCode: string) => void;
  quarantineBatch: (batchId: string, reason: string) => void;
  dismissAlert: (id: string) => void;
  startWardPick: (id: string) => void;
  deliverWardOrder: (id: string) => void;
  addWalkInSale: (drugId: string, qty: number, patientName?: string) => string;
  payWalkInSale: (saleId: string, method: PaymentMethod) => void;
  addDrug: (input: {
    generic_name: string;
    strength: string;
    form: string;
    unit_price: number;
    sku?: string;
  }) => void;
  recordCycleCount: (batchId: string, countedQty: number) => void;
  searchDrugs: (q: string) => Drug[];
};

const StoreCtx = createContext<StoreValue | null>(null);

let bagSeq = 8830;
let batchSeq = 100;
let rxSeq = 430;
let refillSeq = 10;
let invoiceSeq = 10050;

function enrichRx(rx: Prescription, batches: StockBatch[]): Prescription {
  const lines = rx.lines.map((line) => {
    const drugBatches = batches.filter((b) => b.drug_id === line.drug_id);
    const avail = availableQty(drugBatches);
    return { ...line, stock_ok: avail >= line.qty_prescribed - line.qty_dispensed };
  });
  return { ...rx, lines };
}

let drugSeq = 900;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [drugs, setDrugs] = useState<Drug[]>(() => loadFormulary());
  const [batches, setBatches] = useState<StockBatch[]>(STOCK_BATCHES);
  const [patients, setPatients] = useState<PharmacyPatient[]>(PATIENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() =>
    SEED_PRESCRIPTIONS.map((rx) => enrichRx(rx, STOCK_BATCHES)),
  );
  const [refills, setRefills] = useState<RefillRequest[]>(SEED_REFILLS);
  const [movements, setMovements] = useState<StockMovement[]>(SEED_MOVEMENTS);
  const [controlled, setControlled] = useState<ControlledEntry[]>(SEED_CONTROLLED);
  const [wardOrders, setWardOrders] = useState<WardOrder[]>(SEED_WARD_ORDERS);
  const [alerts, setAlerts] = useState<PharmacyAlert[]>(SEED_ALERTS);
  const [walkInSales, setWalkInSales] = useState<WalkInItem[]>([]);
  const [invoices, setInvoices] = useState<PharmacyInvoice[]>(() =>
    buildSeedInvoices(SEED_PRESCRIPTIONS, PATIENTS, loadFormulary()),
  );

  const findDrugById = useCallback(
    (id: string) => drugs.find((d) => d.id === id),
    [drugs],
  );

  const addMovement = useCallback((m: Omit<StockMovement, "id" | "at">) => {
    const entry: StockMovement = {
      ...m,
      id: `mv-${Date.now()}`,
      at: new Date().toISOString(),
    };
    setMovements((list) => [entry, ...list]);
  }, []);

  const ingestDoctorPayloads = useCallback(
    (payloads: DoctorRxPayload[]) => {
      if (!payloads.length) return;

      setPatients((prev) => {
        const next = [...prev];
        for (const payload of payloads) {
          const exists = next.find((p) => p.id === payload.patient.id || p.mrn === payload.patient.mrn);
          if (!exists) next.push(payload.patient);
          else {
            const idx = next.findIndex((p) => p.id === payload.patient.id || p.mrn === payload.patient.mrn);
            next[idx] = { ...next[idx], ...payload.patient };
          }
        }
        return next;
      });

      setPrescriptions((prev) => {
        const incoming = payloads.map((payload) => {
          const lines = payload.lines.map((line, i) => ({
            id: `${payload.id}-l${i}`,
            drug_id: line.drug_id,
            sig: line.sig,
            qty_prescribed: line.qty_prescribed,
            qty_dispensed: 0,
            days_supply: line.days_supply,
            refills_allowed: line.refills_allowed,
            refills_used: 0,
          }));
          return enrichRx(
            {
              id: payload.id,
              rx_number: payload.rx_number,
              patient_id: payload.patient.id,
              doctor_id: payload.doctor_id,
              doctor_name: payload.doctor_name,
              source: "doctor" as const,
              priority: payload.priority,
              status: "received" as const,
              payment_status: "unpaid" as const,
              received_at: payload.sent_at,
              lines,
              clinical_flags: payload.patient.allergies.length
                ? [`Allergies: ${payload.patient.allergies.join(", ")}`]
                : undefined,
              history: [
                {
                  at: payload.sent_at,
                  actor: payload.doctor_name,
                  action: "E-prescribed — sent to pharmacy",
                  note: payload.notes,
                },
              ],
            },
            batches,
          );
        });
        const ids = new Set(incoming.map((r) => r.id));
        const merged = [...incoming, ...prev.filter((r) => !ids.has(r.id))];
        return merged.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
      });

      setInvoices((prev) => {
        const newInvs = payloads.map((payload) => {
          const rxStub: Prescription = {
            id: payload.id,
            rx_number: payload.rx_number,
            patient_id: payload.patient.id,
            doctor_id: payload.doctor_id,
            doctor_name: payload.doctor_name,
            source: "doctor",
            priority: payload.priority,
            status: "received",
            payment_status: "unpaid",
            received_at: payload.sent_at,
            lines: payload.lines.map((line, i) => ({
              id: `${payload.id}-l${i}`,
              drug_id: line.drug_id,
              sig: line.sig,
              qty_prescribed: line.qty_prescribed,
              qty_dispensed: 0,
              days_supply: line.days_supply,
              refills_allowed: line.refills_allowed,
              refills_used: 0,
            })),
            history: [],
          };
          invoiceSeq += 1;
          return invoiceFromRx(
            rxStub,
            payload.patient.name,
            payload.patient.mrn,
            invoiceSeq,
            drugs,
          );
        });
        const ids = new Set(newInvs.map((i) => i.rx_id));
        return [...newInvs, ...prev.filter((i) => !ids.has(i.rx_id))];
      });

      toast.success(
        payloads.length === 1
          ? `New Rx from ${payloads[0].doctor_name} — ${payloads[0].patient.name}`
          : `${payloads.length} prescriptions received from doctors`,
      );
      for (const payload of payloads) {
        const enc = findOpenEncounterForPatient(payload.patient.id);
        if (enc) linkToEncounter(enc.id, { rxId: payload.id });
      }
    },
    [batches, drugs],
  );

  const syncDoctorInbox = useCallback(() => {
    const payloads = drainDoctorPrescriptions();
    ingestDoctorPayloads(payloads);
  }, [ingestDoctorPayloads]);

  useEffect(() => {
    syncDoctorInbox();
    const onIncoming = () => syncDoctorInbox();
    window.addEventListener(PHARMACY_RX_EVENT, onIncoming);
    return () => window.removeEventListener(PHARMACY_RX_EVENT, onIncoming);
  }, [syncDoctorInbox]);

  const getInvoiceForRx = useCallback(
    (rxId: string) => invoices.find((i) => i.rx_id === rxId),
    [invoices],
  );

  const collectRxPayment = useCallback((rxId: string, method: PaymentMethod, amount?: number) => {
    const now = new Date().toISOString();
    setInvoices((list) => {
      const inv = list.find((i) => i.rx_id === rxId);
      if (!inv) return list;
      const payAmount = amount ?? balanceDue(inv);
      const newPaid = Math.min(inv.total, Math.round((inv.amount_paid + payAmount) * 100) / 100);
      const status = newPaid >= inv.total ? "paid" : newPaid > 0 ? "partial" : "unpaid";

      setPrescriptions((rxList) =>
        rxList.map((rx) =>
          rx.id === rxId
            ? {
                ...rx,
                payment_status: status,
                amount_paid: newPaid,
                payment_method: method,
                invoice_number: inv.invoice_number,
                paid_at: status === "paid" ? now : rx.paid_at,
                history: pushHistory(
                  rx,
                  ACTOR,
                  status === "paid" ? "Payment collected" : "Partial payment recorded",
                  `${method.toUpperCase()} · ₹${payAmount.toLocaleString("en-IN")}`,
                ),
              }
            : rx,
        ),
      );

      const updated = list.map((i) =>
        i.rx_id === rxId
          ? {
              ...i,
              amount_paid: newPaid,
              status,
              payment_method: method,
              paid_at: status === "paid" ? now : i.paid_at,
            }
          : i,
      );
      const paidInv = updated.find((i) => i.rx_id === rxId);
      if (paidInv) {
        const enc = findOpenEncounterForPatient(paidInv.patient_id);
        if (enc) linkToEncounter(enc.id, { rxId: paidInv.rx_id, invoiceId: paidInv.id });
        mirrorToLedger({
          id: paidInv.id,
          source: "pharmacy",
          patientId: paidInv.patient_id,
          patientName: paidInv.patient_name,
          mrn: paidInv.mrn,
          date: paidInv.created_at.slice(0, 10),
          items: paidInv.lines.map((l) => ({
            label: l.description,
            qty: l.qty,
            unit: l.unit_price,
            amount: l.amount,
          })),
          subtotal: paidInv.subtotal,
          tax: paidInv.tax,
          total: paidInv.total,
          amountPaid: paidInv.amount_paid,
          status: paidInv.status,
          method,
          paidAt: paidInv.paid_at,
          referenceId: paidInv.rx_id,
        });
      }
      return updated;
    });
    toast.success("Payment recorded");
  }, []);

  const updateDrugPricing = useCallback(
    (drugId: string, patch: DrugPricingPatch) => {
      const now = new Date().toISOString();
      setDrugs((list) => {
        const next = list.map((d) => {
          if (d.id !== drugId) return d;
          const unit = patch.unit_price ?? d.unit_price;
          const pack = patch.pack_size ?? d.pack_size ?? 10;
          return normalizeDrug({
            ...d,
            ...patch,
            unit_price: unit,
            pack_size: pack,
            pack_mrp:
              patch.pack_mrp ?? Math.round(unit * pack * 100) / 100,
            price_updated_at: now,
            price_updated_by: ACTOR,
          });
        });
        saveFormulary(next);
        setInvoices((invs) =>
          rebuildOpenInvoices(invs, prescriptions, patients, next),
        );
        return next;
      });
      toast.success("Formulary pricing saved");
    },
    [prescriptions, patients],
  );

  const acceptRx = useCallback((id: string) => {
    const now = new Date().toISOString();
    setPrescriptions((list) =>
      list.map((rx) =>
        rx.id === id
          ? enrichRx(
              {
                ...rx,
                status: "ready_to_dispense",
                reviewed_at: now,
                history: pushHistory(rx, ACTOR, "Accepted — ready to dispense"),
              },
              batches,
            )
          : rx,
      ),
    );
    toast.success("Prescription accepted for dispensing");
  }, [batches]);

  const holdRx = useCallback((id: string, reason: string) => {
    setPrescriptions((list) =>
      list.map((rx) =>
        rx.id === id
          ? enrichRx(
              {
                ...rx,
                status: "on_hold",
                hold_reason: reason,
                history: pushHistory(rx, ACTOR, "Placed on hold", reason),
              },
              batches,
            )
          : rx,
      ),
    );
    toast("Prescription on hold");
  }, [batches]);

  const rejectRx = useCallback((id: string, reason: string) => {
    setPrescriptions((list) =>
      list.map((rx) =>
        rx.id === id
          ? enrichRx(
              {
                ...rx,
                status: "cancelled",
                cancel_reason: reason,
                history: pushHistory(rx, ACTOR, "Rejected", reason),
              },
              batches,
            )
          : rx,
      ),
    );
    toast.error("Prescription rejected");
  }, [batches]);

  const startDispense = useCallback((id: string) => {
    setPrescriptions((list) =>
      list.map((rx) =>
        rx.id === id
          ? enrichRx(
              {
                ...rx,
                status: "dispensing",
                history: pushHistory(rx, ACTOR, "Dispensing started"),
              },
              batches,
            )
          : rx,
      ),
    );
    toast("Dispense workflow started");
  }, [batches]);

  const pickLine = useCallback(
    (rxId: string, lineId: string, batchId: string, qty: number) => {
      setBatches((list) =>
        list.map((b) => {
          if (b.id !== batchId) return b;
          return { ...b, reserved_qty: Math.min(b.qty, b.reserved_qty + qty) };
        }),
      );
      setPrescriptions((list) =>
        list.map((rx) => {
          if (rx.id !== rxId) return rx;
          const lines = rx.lines.map((line) =>
            line.id === lineId
              ? { ...line, pick_batch_id: batchId, qty_dispensed: line.qty_dispensed + qty }
              : line,
          );
          return enrichRx(
            {
              ...rx,
              lines,
              history: pushHistory(rx, ACTOR, `Picked line ${lineId}`, `Batch ${batchId}, qty ${qty}`),
            },
            batches,
          );
        }),
      );
    },
    [batches],
  );

  const completeDispense = useCallback(
    (id: string, counseling?: string, witness?: string) => {
      bagSeq += 1;
      const bagId = `BAG-${bagSeq}`;
      const now = new Date().toISOString();

      setPrescriptions((list) => {
        const rx = list.find((r) => r.id === id);
        if (!rx) return list;

        setBatches((bl) => {
          let next = [...bl];
          for (const line of rx.lines) {
            let pickQty = line.qty_dispensed;
            let batchId = line.pick_batch_id;
            if (!batchId || pickQty <= 0) {
              const fefo = fefoBatch(next.filter((b) => b.drug_id === line.drug_id));
              if (!fefo) continue;
              batchId = fefo.id;
              pickQty = line.qty_prescribed;
            }
            next = next.map((b) => {
              if (b.id !== batchId) return b;
              const drug = findDrugById(line.drug_id);
              addMovement({
                drug_id: line.drug_id,
                batch_id: b.id,
                type: "dispense",
                qty: -pickQty,
                reference: rx.rx_number,
                actor: ACTOR,
              });
              if (drug?.controlled_schedule) {
                setControlled((cl) => [
                  {
                    id: `ce-${Date.now()}-${line.id}`,
                    drug_id: line.drug_id,
                    rx_id: rx.id,
                    patient_id: rx.patient_id,
                    qty: -pickQty,
                    balance_after: Math.max(0, b.qty - pickQty),
                    witness: witness || "A. Brooks",
                    at: now,
                    pharmacist: ACTOR,
                  },
                  ...cl,
                ]);
              }
              return {
                ...b,
                qty: b.qty - pickQty,
                reserved_qty: Math.max(0, b.reserved_qty - pickQty),
              };
            });
          }
          return next;
        });

        return list.map((r) =>
          r.id === id
            ? enrichRx(
                {
                  ...r,
                  status: "ready_pickup",
                  dispensed_at: now,
                  bag_id: bagId,
                  counseling_notes: counseling,
                  history: pushHistory(r, ACTOR, `Dispensed — ${bagId}`),
                },
                batches,
              )
            : r,
        );
      });
      toast.success(`Dispensed — bag ${bagId} ready for pickup`);
    },
    [batches, addMovement],
  );

  const markCollected = useCallback((id: string) => {
    const now = new Date().toISOString();
    setPrescriptions((list) =>
      list.map((rx) =>
        rx.id === id
          ? enrichRx(
              {
                ...rx,
                status: "collected",
                collected_at: now,
                history: pushHistory(rx, ACTOR, "Collected by patient"),
              },
              batches,
            )
          : rx,
      ),
    );
    toast.success("Handover complete");
  }, [batches]);

  const approveRefill = useCallback((id: string) => {
    refillSeq += 1;
    rxSeq += 1;
    const refill = refills.find((r) => r.id === id);
    if (!refill) return;

    const drug = findDrugById(refill.drug_id);
    const orig = prescriptions.find((r) => r.id === refill.original_rx_id);
    const doctor = DOCTORS.find((d) => d.id === orig?.doctor_id) ?? DOCTORS[0];
    const now = new Date().toISOString();

    const newRx: Prescription = enrichRx(
      {
        id: `rx-refill-${refillSeq}`,
        rx_number: `RX-2025-${rxSeq}`,
        patient_id: refill.patient_id,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        source: "doctor",
        priority: "routine",
        status: "ready_to_dispense",
        payment_status: "paid",
        received_at: now,
        reviewed_at: now,
        lines: orig?.lines.filter((l) => l.drug_id === refill.drug_id).map((l) => ({
          ...l,
          id: `rl-${refillSeq}`,
          qty_dispensed: 0,
          pick_batch_id: undefined,
        })) ?? [
          {
            id: `rl-${refillSeq}`,
            drug_id: refill.drug_id,
            sig: "As previously prescribed",
            qty_prescribed: 30,
            qty_dispensed: 0,
            days_supply: 30,
            refills_allowed: refill.refills_remaining,
            refills_used: 0,
          },
        ],
        history: [{ at: now, actor: ACTOR, action: "Refill approved — auto queued" }],
      },
      batches,
    );

    setPrescriptions((list) => [newRx, ...list]);
    setRefills((list) =>
      list.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r)),
    );
    toast.success("Refill approved — added to dispense queue");
  }, [refills, prescriptions, batches]);

  const denyRefill = useCallback((id: string, reason: string) => {
    setRefills((list) =>
      list.map((r) => (r.id === id ? { ...r, status: "denied", note: reason } : r)),
    );
    toast("Refill denied");
  }, []);

  const receiveStock = useCallback(
    (
      drugId: string,
      lot: string,
      expiry: string,
      qty: number,
      options?: ReceiveStockOptions,
    ) => {
      batchSeq += 1;
      const now = new Date().toISOString();
      const drug = drugs.find((d) => d.id === drugId);
      const costPerUnit =
        options?.purchaseCostPerUnit ??
        drug?.purchase_cost ??
        drug?.unit_price ??
        0;
      const poRef = options?.poReference ?? `PO-${batchSeq}`;
      const batch: StockBatch = {
        id: `b${batchSeq}`,
        drug_id: drugId,
        lot,
        expiry,
        qty,
        reserved_qty: 0,
        purchase_cost_per_unit: costPerUnit,
        vendor: options?.vendor,
        po_reference: poRef,
        received_at: now,
        status: "active",
      };
      setBatches((list) => {
        const nextBatches = [...list, batch];
        if (options?.purchaseCostPerUnit != null && drug) {
          const avg = weightedAvgCost(nextBatches, drugId, costPerUnit);
          setDrugs((drugList) => {
            const nextDrugs = drugList.map((d) =>
              d.id === drugId
                ? normalizeDrug({ ...d, purchase_cost: avg, price_updated_at: now, price_updated_by: ACTOR })
                : d,
            );
            saveFormulary(nextDrugs);
            return nextDrugs;
          });
        }
        return nextBatches;
      });
      addMovement({
        drug_id: drugId,
        batch_id: batch.id,
        type: "receive",
        qty,
        reference: poRef,
        actor: ACTOR,
        note: `Lot ${lot} · ₹${costPerUnit}/unit${options?.vendor ? ` · ${options.vendor}` : ""}`,
      });
      setPrescriptions((list) => list.map((rx) => enrichRx(rx, [...batches, batch])));
      toast.success(`Received ${qty} units — lot ${lot}`);
    },
    [batches, addMovement, drugs],
  );

  const adjustStock = useCallback(
    (batchId: string, qtyDelta: number, reason: string) => {
      setBatches((list) =>
        list.map((b) => (b.id === batchId ? { ...b, qty: Math.max(0, b.qty + qtyDelta) } : b)),
      );
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        addMovement({
          drug_id: batch.drug_id,
          batch_id: batchId,
          type: "adjust",
          qty: qtyDelta,
          actor: ACTOR,
          note: reason,
        });
      }
      toast("Stock adjusted");
    },
    [batches, addMovement],
  );

  const transferBatch = useCallback((batchId: string, newLocationCode: string) => {
    setBatches((list) =>
      list.map((b) =>
        b.id === batchId ? { ...b, location_override: newLocationCode } : b,
      ),
    );
    toast(`Batch moved to ${newLocationCode}`);
  }, []);

  const quarantineBatch = useCallback(
    (batchId: string, reason: string) => {
      const batch = batches.find((b) => b.id === batchId);
      setBatches((list) =>
        list.map((b) => (b.id === batchId ? { ...b, status: "quarantine" as const } : b)),
      );
      if (batch) {
        addMovement({
          drug_id: batch.drug_id,
          batch_id: batchId,
          type: "quarantine",
          qty: 0,
          actor: ACTOR,
          note: reason,
        });
      }
      toast("Batch quarantined");
    },
    [batches, addMovement],
  );

  const dismissAlert = useCallback((id: string) => {
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const startWardPick = useCallback((id: string) => {
    setWardOrders((list) =>
      list.map((w) => (w.id === id ? { ...w, status: "picking" as const } : w)),
    );
    toast("Ward pick started");
  }, []);

  const deliverWardOrder = useCallback((id: string) => {
    setWardOrders((list) =>
      list.map((w) => (w.id === id ? { ...w, status: "delivered" as const } : w)),
    );
    toast.success("Delivered to ward");
  }, []);

  const addWalkInSale = useCallback(
    (drugId: string, qty: number, patientName?: string) => {
      const drug = findDrugById(drugId);
      const amount = Math.round((drug?.unit_price ?? 0) * qty * 100) / 100;
      const id = `wi-${Date.now()}`;
      setWalkInSales((list) => [
        {
          id,
          drug_id: drugId,
          qty,
          patient_name: patientName,
          amount,
          payment: "unpaid",
          at: new Date().toISOString(),
        },
        ...list,
      ]);
      toast.success(`Sale queued — collect ₹${amount.toLocaleString("en-IN")}`);
      return id;
    },
    [findDrugById],
  );

  const payWalkInSale = useCallback(
    (saleId: string, method: PaymentMethod) => {
      const sale = walkInSales.find((s) => s.id === saleId);
      if (!sale || sale.payment === "paid") return;
      const drug = findDrugById(sale.drug_id);
      const fefo = fefoBatch(batches.filter((b) => b.drug_id === sale.drug_id));
      if (fefo && sale.qty > 0) {
        setBatches((list) =>
          list.map((b) =>
            b.id === fefo.id ? { ...b, qty: Math.max(0, b.qty - sale.qty) } : b,
          ),
        );
        addMovement({
          drug_id: sale.drug_id,
          batch_id: fefo.id,
          type: "dispense",
          qty: -sale.qty,
          reference: "WALK-IN",
          actor: ACTOR,
          note: sale.patient_name,
        });
      }
      setWalkInSales((list) =>
        list.map((s) => (s.id === saleId ? { ...s, payment: "paid" as const } : s)),
      );
      const tax = Math.round(sale.amount * 0.05 * 100) / 100;
      const total = Math.round((sale.amount + tax) * 100) / 100;
      mirrorToLedger({
        id: `OTC-${saleId}`,
        source: "pharmacy",
        patientId: "",
        patientName: sale.patient_name ?? "Walk-in",
        mrn: "—",
        date: new Date().toISOString().slice(0, 10),
        items: [
          {
            label: drug ? `${drug.generic_name} ${drug.strength}` : "OTC item",
            qty: sale.qty,
            unit: drug?.unit_price ?? sale.amount / sale.qty,
            amount: sale.amount,
          },
        ],
        subtotal: sale.amount,
        tax,
        total,
        amountPaid: total,
        status: "paid",
        method,
        paidAt: new Date().toISOString(),
        referenceId: saleId,
      });
      toast.success(`Paid via ${method.toUpperCase()} · ${drug?.generic_name ?? "item"}`);
    },
    [walkInSales, batches, addMovement, findDrugById],
  );

  const addDrug = useCallback(
    (input: {
      generic_name: string;
      strength: string;
      form: string;
      unit_price: number;
      sku?: string;
    }) => {
      drugSeq += 1;
      const id = `drug-new-${drugSeq}`;
      const drug = normalizeDrug({
        id,
        sku: input.sku ?? `SKU-${drugSeq}`,
        barcode: `890${drugSeq}`,
        generic_name: input.generic_name,
        brand_names: [input.generic_name],
        strength: input.strength,
        form: input.form,
        route: input.form === "Injection" ? "IV/IM" : "Oral",
        rx_required: input.form !== "Tablet" || input.unit_price > 50,
        location: {
          zone: "main",
          aisle: "A",
          rack: "1",
          tray: "1",
          slot: String(drugSeq % 10),
          temp: "Room",
          location_code: `MAIN-A1-T${drugSeq % 10}`,
        },
        reorder_level: 20,
        unit_price: input.unit_price,
      });
      setDrugs((list) => {
        const next = [...list, drug];
        saveFormulary(next);
        return next;
      });
      toast.success(`Added ${drug.generic_name} to formulary`);
    },
    [],
  );

  const recordCycleCount = useCallback(
    (batchId: string, countedQty: number) => {
      const batch = batches.find((b) => b.id === batchId);
      if (!batch) return;
      const delta = countedQty - batch.qty;
      setBatches((list) =>
        list.map((b) => (b.id === batchId ? { ...b, qty: countedQty } : b)),
      );
      if (delta !== 0) {
        addMovement({
          drug_id: batch.drug_id,
          batch_id: batchId,
          type: "adjust",
          qty: delta,
          actor: ACTOR,
          note: `Cycle count — expected ${batch.qty}, counted ${countedQty}`,
        });
      }
      toast(delta === 0 ? "Count matches system" : `Variance ${delta > 0 ? "+" : ""}${delta} recorded`);
    },
    [batches, addMovement],
  );

  const searchDrugs = useCallback((q: string) => {
    const lower = q.toLowerCase();
    return drugs.filter((d) => {
      const hay = [d.generic_name, ...d.brand_names, d.sku, d.barcode, d.location.location_code].join(" ").toLowerCase();
      return hay.includes(lower);
    });
  }, [drugs]);

  const value = useMemo(
    () => ({
      drugs,
      batches,
      prescriptions,
      refills,
      movements,
      controlled,
      wardOrders,
      alerts,
      walkInSales,
      patients,
      doctors: DOCTORS,
      hospital: HOSPITAL,
      invoices,
      findDrug: findDrugById,
      getInvoiceForRx,
      collectRxPayment,
      updateDrugPricing,
      acceptRx,
      holdRx,
      rejectRx,
      startDispense,
      pickLine,
      completeDispense,
      markCollected,
      approveRefill,
      denyRefill,
      receiveStock,
      adjustStock,
      transferBatch,
      quarantineBatch,
      dismissAlert,
      startWardPick,
      deliverWardOrder,
      addWalkInSale,
      payWalkInSale,
      addDrug,
      recordCycleCount,
      searchDrugs,
    }),
    [
      drugs,
      batches,
      prescriptions,
      refills,
      movements,
      controlled,
      wardOrders,
      alerts,
      walkInSales,
      patients,
      invoices,
      findDrugById,
      acceptRx,
      holdRx,
      rejectRx,
      startDispense,
      pickLine,
      completeDispense,
      markCollected,
      approveRefill,
      denyRefill,
      receiveStock,
      adjustStock,
      transferBatch,
      quarantineBatch,
      dismissAlert,
      startWardPick,
      deliverWardOrder,
      addWalkInSale,
      payWalkInSale,
      addDrug,
      recordCycleCount,
      searchDrugs,
      getInvoiceForRx,
      collectRxPayment,
      updateDrugPricing,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function usePharmacyStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("usePharmacyStore must be used within StoreProvider");
  return ctx;
}

export { getPatient, formatRelative, formatDateTime } from "./utils";
export { searchMedicines, availableQty, fefoBatch, formatLocation, isLowStock } from "./location";
