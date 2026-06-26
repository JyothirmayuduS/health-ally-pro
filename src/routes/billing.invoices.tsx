import { createFileRoute } from "@tanstack/react-router";
import BillingInvoices from "@/components/billing-desk/pages/Invoices";

type InvoiceSearch = { invoice?: string };

export const Route = createFileRoute("/billing/invoices")({
  validateSearch: (search: Record<string, unknown>): InvoiceSearch => ({
    invoice: typeof search.invoice === "string" ? search.invoice : undefined,
  }),
  component: BillingInvoices,
});
