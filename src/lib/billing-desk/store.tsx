import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SEED_INVOICES, TAX_RATE } from "@/lib/reception-desk/billingData";
import { getSharedPatient } from "@/lib/shared/patients";
import {
  LEDGER_EVENT,
  loadLedgerInvoices,
  loadLedgerPayments,
  notifyLedgerUpdated,
  recordLedgerPayment,
  saveLedgerInvoices,
  upsertLedgerInvoice,
  type LedgerInvoice,
  type LedgerPayment,
  type LedgerSource,
} from "@/lib/shared/billing-ledger";
import {
  closeEncounter,
  ENCOUNTERS_EVENT,
  linkToEncounter,
  listEncounters,
  openEncounter,
  type Encounter,
} from "@/lib/shared/encounters";

function subtotal(items: { amount: number }[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

export function receptionInvoiceToLedger(inv: (typeof SEED_INVOICES)[number]): LedgerInvoice {
  const p = getSharedPatient(inv.patientId);
  const sub = subtotal(inv.items);
  const tax = Math.round(sub * TAX_RATE * 100) / 100;
  const total = Math.round((sub - (inv.discount ?? 0) + tax) * 100) / 100;
  
  let paid = inv.status === "paid" ? total : 0;
  let status = inv.status === "paid" ? "paid" : "unpaid";
  if (inv.status === "refunded") {
    paid = 0;
    status = "refunded" as any;
  } else if (inv.status === "partial-refund") {
    const totalRefunded = ((inv as any).refunds || []).reduce((sum: number, r: any) => sum + r.amount, 0);
    paid = Math.max(0, total - totalRefunded);
    status = "partial-refund" as any;
  }

  return {
    id: inv.id,
    source: "reception",
    patientId: inv.patientId,
    patientName: p?.name ?? inv.patientId,
    mrn: p?.mrn ?? inv.patientId,
    date: inv.date,
    items: inv.items,
    subtotal: sub,
    tax,
    total,
    amountPaid: paid,
    status: status as any,
    method: inv.method ?? undefined,
    paidAt: inv.paidAt,
    referenceId: inv.appointmentId,
  };
}

export function ensureLedgerHydrated() {
  const current = loadLedgerInvoices();
  const ids = new Set(current.map((i) => i.id));
  const merged = [...current];
  for (const inv of SEED_INVOICES) {
    if (!ids.has(inv.id)) merged.push(receptionInvoiceToLedger(inv));
  }
  if (merged.length !== current.length) saveLedgerInvoices(merged);
}

export function mirrorToLedger(input: {
  id: string;
  source: LedgerSource;
  patientId: string;
  patientName: string;
  mrn: string;
  date: string;
  items: LedgerInvoice["items"];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: LedgerInvoice["status"];
  method?: string;
  paidAt?: string;
  encounterId?: string;
  referenceId?: string;
}) {
  upsertLedgerInvoice({ ...input });
  notifyLedgerUpdated();
}

type BillingStore = {
  invoices: LedgerInvoice[];
  payments: LedgerPayment[];
  encounters: Encounter[];
  refresh: () => void;
  collectPayment: (invoiceId: string, amount: number, method: string) => void;
  openPatientEncounter: (patientId: string, chiefComplaint?: string) => Encounter;
  closePatientEncounter: (id: string) => void;
  linkEncounter: (
    encounterId: string,
    link: { invoiceId?: string; labOrderId?: string; rxId?: string },
  ) => void;
};

const Ctx = createContext<BillingStore | null>(null);

export function BillingStoreProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<LedgerInvoice[]>([]);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);

  const refresh = useCallback(() => {
    ensureLedgerHydrated();
    setInvoices(loadLedgerInvoices());
    setPayments(loadLedgerPayments());
    setEncounters(listEncounters());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(LEDGER_EVENT, onUpdate);
    window.addEventListener(ENCOUNTERS_EVENT, onUpdate);
    return () => {
      window.removeEventListener(LEDGER_EVENT, onUpdate);
      window.removeEventListener(ENCOUNTERS_EVENT, onUpdate);
    };
  }, [refresh]);

  const collectPayment = useCallback(
    (invoiceId: string, amount: number, method: string) => {
      recordLedgerPayment(invoiceId, amount, method);
      notifyLedgerUpdated();
      refresh();
    },
    [refresh],
  );

  const openPatientEncounter = useCallback(
    (patientId: string, chiefComplaint?: string) => {
      const enc = openEncounter({ patientId, chiefComplaint });
      refresh();
      return enc;
    },
    [refresh],
  );

  const closePatientEncounter = useCallback(
    (id: string) => {
      closeEncounter(id);
      refresh();
    },
    [refresh],
  );

  const linkEncounter = useCallback(
    (
      encounterId: string,
      link: { invoiceId?: string; labOrderId?: string; rxId?: string },
    ) => {
      linkToEncounter(encounterId, link);
      refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      invoices,
      payments,
      encounters,
      refresh,
      collectPayment,
      openPatientEncounter,
      closePatientEncounter,
      linkEncounter,
    }),
    [
      invoices,
      payments,
      encounters,
      refresh,
      collectPayment,
      openPatientEncounter,
      closePatientEncounter,
      linkEncounter,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBillingStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBillingStore outside provider");
  return ctx;
}

export function fmtLedger(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
