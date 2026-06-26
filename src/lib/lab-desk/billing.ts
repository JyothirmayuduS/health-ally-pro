import type { LabOrder } from "./mockData";
import { findCatalogItem } from "@/lib/shared/lab-catalog";

export type LabPaymentStatus = "unpaid" | "paid" | "reception";
export type LabPaymentMethod = "cash" | "card" | "upi";

export type LabInvoice = {
  id: string;
  order_id: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  test_code: string;
  test_name: string;
  amount: number;
  status: LabPaymentStatus;
  method?: LabPaymentMethod;
  paid_at?: string;
  created_at: string;
};

let labInvSeq = 7000;

export function nextLabInvoiceId() {
  labInvSeq += 1;
  return `LAB-INV-${labInvSeq}`;
}

export function invoiceFromOrder(
  order: LabOrder,
  patientName: string,
  mrn: string,
  price?: number,
): LabInvoice {
  const cat = findCatalogItem(order.test_code);
  const amount = price ?? cat?.price ?? 0;
  return {
    id: nextLabInvoiceId(),
    order_id: order.id,
    patient_id: order.patient_id,
    patient_name: patientName,
    mrn,
    test_code: order.test_code,
    test_name: order.test_name,
    amount,
    status: "unpaid",
    created_at: order.ordered_at,
  };
}

export function fmtLabPrice(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
