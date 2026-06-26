import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { PatientMedShell } from "@/components/patient/medications/PatientMedShell";
import { patientMedications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/medications/$medId/refill")({
  component: RefillRequestPage,
});

function RefillRequestPage() {
  const { medId } = Route.useParams();
  const med = patientMedications.find((m) => m.id === medId);
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [sent, setSent] = useState(false);

  if (!med) return null;

  if (sent) {
    return (
      <PatientMedShell className="flex flex-col items-center justify-center px-8 text-center">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-emerald-500/15">
          <span className="text-5xl text-emerald-600">✓</span>
        </div>
        <h1 className="mt-6 font-serif text-[32px] text-ink">Request Sent</h1>
        <p className="mt-2 max-w-sm text-base leading-relaxed text-ink-muted">
          {med.prescribedBy} will review your request shortly.
        </p>
        <Link
          to="/medications/refill-history"
          className="mt-8 w-full max-w-sm rounded-[14px] border border-[#EDEAE6] py-3.5 text-[15px] font-semibold"
        >
          View refill history
        </Link>
      </PatientMedShell>
    );
  }

  return (
    <PatientMedShell className="pb-32">
      <header className="flex items-center gap-2 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-0">
        <Link
          to="/medications/$medId"
          params={{ medId }}
          className="grid h-11 w-11 place-items-center rounded-full"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </Link>
        <h1 className="text-lg font-semibold">Request Refill</h1>
      </header>

      <div className="px-5 pt-2 lg:max-w-xl lg:px-0">
        <h2 className="font-serif text-[32px] leading-tight text-ink">{med.name}</h2>
        <p className="text-ink-muted">
          {med.dosage} · {med.frequency}
        </p>

        <div className="mt-6 flex gap-3.5 rounded-[20px] border border-[#EDEAE6] bg-white p-5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-clay" />
          <div>
            <p className="font-semibold">Direct Authorization</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              This request goes instantly to {med.prescribedBy} for 1-click clinical approval.
            </p>
          </div>
        </div>

        <h3 className="mt-8 font-serif text-lg text-ink">Delivery Method</h3>
        {[
          {
            id: "delivery" as const,
            title: "Home Delivery",
            sub: "Usually ships in 1-2 business days to your flat.",
            icon: Truck,
          },
          {
            id: "pickup" as const,
            title: "Pharmacy Pickup",
            sub: "Oakhaven Medical Center Pharmacy. Same day.",
            icon: MapPin,
          },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMethod(opt.id)}
            className={cn(
              "mt-3 flex w-full items-center gap-4 rounded-3xl border p-5 text-left transition-colors",
              method === opt.id
                ? "border-clay border-2 bg-white"
                : "border-[#EDEAE6] bg-white",
            )}
          >
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full",
                method === opt.id ? "bg-clay text-white" : "bg-[#F5F2ED] text-ink-muted",
              )}
            >
              <opt.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <p className="font-semibold">{opt.title}</p>
              <p className="text-sm text-ink-muted">{opt.sub}</p>
            </span>
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border-2",
                method === opt.id ? "border-clay" : "border-[#E5E1DC]",
              )}
            >
              {method === opt.id ? <span className="h-3 w-3 rounded-full bg-clay" /> : null}
            </span>
          </button>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#EDEAE6] bg-[#F9F7F2]/95 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[430px] lg:max-w-xl">
          <button
            type="button"
            onClick={() => setSent(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-ink py-[18px] text-base font-semibold text-white"
          >
            <Package className="h-5 w-5" />
            Submit Refill Request
          </button>
        </div>
      </div>
    </PatientMedShell>
  );
}
