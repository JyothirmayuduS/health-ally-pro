import { Calendar, CreditCard, Phone, Mail, MapPin, Shield, Clock } from "lucide-react";
import type { ReceptionPatient } from "@/lib/reception-mock-data";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

type PatientDetailPanelProps = {
  patient: ReceptionPatient | null;
  nextAppointment?: { date: string; time: string; doctor: string } | null;
  className?: string;
};

export function PatientDetailPanel({
  patient,
  nextAppointment,
  className,
}: PatientDetailPanelProps) {
  if (!patient) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[400px] items-center justify-center rounded-[24px] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
          className,
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#E0E7EB]">
            <Shield className="h-7 w-7 text-[#94A3B8]" />
          </div>
          <p className="font-medium text-[#64748B]">Select a patient to view details</p>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Insurance, balance, and appointments appear here
          </p>
        </div>
      </div>
    );
  }

  const age = Math.floor(
    (Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#EEF6D4] to-[#F0FAF0] p-6">
        <div className="flex items-start gap-4">
          <img
            src={patient.photoUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#1e293b]">{patient.name}</h2>
              <StatusPill status={patient.visitStatus} size="md" />
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              {age} yrs · {patient.gender} · {patient.bloodGroup}
            </p>
            <p className="mt-2 text-sm text-[#64748B]">{patient.condition}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Insurance & Balance */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F5F7F8] p-4">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Insurance</span>
            </div>
            <p className="mt-2 font-semibold text-[#1e293b]">{patient.insuranceProvider}</p>
            <p className="text-xs text-[#94A3B8]">ID: {patient.insuranceId}</p>
          </div>
          <div className="rounded-2xl bg-[#F5F7F8] p-4">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Balance Due</span>
            </div>
            <p
              className={cn(
                "mt-2 text-2xl font-bold",
                patient.balanceDue > 0 ? "text-[#B45309]" : "text-[#4D7C0F]",
              )}
            >
              ${patient.balanceDue.toFixed(2)}
            </p>
            {patient.balanceDue > 0 && (
              <p className="text-xs text-[#94A3B8]">Payment due at checkout</p>
            )}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Contact Information
          </h3>
          <div className="space-y-2.5">
            <InfoRow icon={Phone} value={patient.phone} />
            <InfoRow icon={Mail} value={patient.email} />
            <InfoRow icon={MapPin} value={patient.address} />
          </div>
        </div>

        {/* Next appointment */}
        {nextAppointment && (
          <div className="rounded-2xl bg-[#D4F06D] p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1e293b]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#1e293b]/70">
                Next Appointment
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-[#1e293b]">{nextAppointment.doctor}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-[#1e293b]/80">
              <Clock className="h-3.5 w-3.5" />
              {nextAppointment.date} at {nextAppointment.time}
            </div>
          </div>
        )}

        {patient.notes && (
          <div className="rounded-2xl border border-[#E0E7EB] bg-[#FAFBFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Notes</p>
            <p className="mt-2 text-sm text-[#64748B]">{patient.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#64748B]">
      <Icon className="h-4 w-4 shrink-0 text-[#94A3B8]" />
      <span className="truncate">{value}</span>
    </div>
  );
}
