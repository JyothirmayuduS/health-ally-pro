import { Link } from "@tanstack/react-router";
import { ChevronLeft, Plus, Shield, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AddDependentSheet } from "@/components/patient/profile/AddDependentSheet";
import {
  DependentEmptyState,
  DependentFullCard,
} from "@/components/patient/profile/DependentCard";
import { useDependents } from "@/hooks/useDependents";

export function DependentsListPage() {
  const [addOpen, setAddOpen] = useState(false);
  const dependents = useDependents();

  const summary = useMemo(() => {
    const avgAdherence =
      dependents.length === 0
        ? 0
        : Math.round(
            dependents.reduce((sum, d) => sum + d.adherence, 0) / dependents.length,
          );
    const upcoming = dependents.filter((d) =>
      d.appointments.some((a) => a.status === "upcoming"),
    ).length;
    return { count: dependents.length, avgAdherence, upcoming };
  }, [dependents]);

  return (
    <div className="mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-12">
      <header className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
        <Link
          to="/profile"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11"
          aria-label="Back to profile"
        >
          <ChevronLeft className="h-5 w-5 text-ink sm:h-6 sm:w-6" strokeWidth={2.25} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl text-ink sm:text-[32px]">Family profiles</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Manage care for people linked to your account
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white"
          aria-label="Add dependent"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      {dependents.length > 0 ? (
        <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
          {[
            { icon: Users, label: "Profiles", value: String(summary.count) },
            { icon: Shield, label: "Avg adherence", value: `${summary.avgAdherence}%` },
            {
              icon: Plus,
              label: "Upcoming visits",
              value: String(summary.upcoming),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-[18px] border border-[#EDEAE6] bg-white px-2 py-3 text-center sm:rounded-[20px] sm:py-4"
            >
              <Icon className="mx-auto h-4 w-4 text-ink-muted" strokeWidth={1.75} />
              <p className="mt-1.5 font-serif text-xl tabular-nums text-ink sm:text-2xl">
                {value}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted sm:text-[10px]">
                {label}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mb-5 flex gap-2.5 rounded-2xl bg-[#E8F3EE] px-4 py-3.5 text-sm text-[#2D6B4F] sm:mb-6">
        <Shield className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <p>
          You have HIPAA-compliant proxy access to view summaries, book visits, and track
          medications for linked family members.
        </p>
      </div>

      {dependents.length === 0 ? (
        <DependentEmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {dependents.map((dep) => (
            <li key={dep.id}>
              <DependentFullCard dep={dep} />
            </li>
          ))}
        </ul>
      )}

      <AddDependentSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
