import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Stethoscope,
  Syringe,
  MessageSquare,
  FlaskConical,
  Phone,
  FileBarChart,
} from "lucide-react";

export const Route = createFileRoute("/admin/masters")({
  component: MastersHub,
});

const CARDS = [
  {
    to: "/admin/masters/diagnosis",
    label: "Diagnosis / ICD master",
    desc: "ICD-10 codes for clinical & billing",
    icon: BookOpen,
    dot: "bg-plum",
  },
  {
    to: "/admin/masters/investigations",
    label: "Investigation master",
    desc: "Lab, radiology & cardiology test catalog",
    icon: FlaskConical,
    dot: "bg-teal",
  },
  {
    to: "/admin/masters/referring-doctors",
    label: "Referring doctors",
    desc: "External referrers & commission tracking",
    icon: Stethoscope,
    dot: "bg-sage",
  },
  {
    to: "/admin/masters/vaccines",
    label: "Vaccine schedule",
    desc: "National immunization schedule & doses",
    icon: Syringe,
    dot: "bg-mustard",
  },
  {
    to: "/admin/masters/advise",
    label: "Advise templates",
    desc: "Patient advice snippets (EN / HI / MR / GU)",
    icon: MessageSquare,
    dot: "bg-clay",
  },
  {
    to: "/admin/masters/comms",
    label: "SMS / Email / WhatsApp",
    desc: "Message templates for reminders & results",
    icon: Phone,
    dot: "bg-teal",
  },
  {
    to: "/admin/registers",
    label: "Statutory registers",
    desc: "OPD, indoor, vaccine, prescription registers",
    icon: FileBarChart,
    dot: "bg-money",
  },
];

function MastersHub() {
  return (
    <div className="space-y-6" data-testid="admin-masters-hub">
      <p className="text-[13px] text-ink-600 max-w-2xl">
        Central master data — mirrors AXON/MultiSpec <strong>Masters</strong> menu. Changes sync to
        Postgres via hospital desk records and feed doctor ICD pickers, reception vaccination, and
        reports.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="surface group flex flex-col gap-3 p-5 transition hover:shadow-soft border-l-4 border-l-transparent hover:border-l-plum"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${c.dot.replace("bg-", "bg-")}-soft`}
            >
              <c.icon className={`h-5 w-5 ${c.dot.replace("bg-", "text-")}`} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink-900 group-hover:text-plum">
                {c.label}
              </h2>
              <p className="mt-1 text-[12px] text-ink-500">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
