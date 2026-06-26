import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Bell, ChevronLeft, MapPin, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { LiveQueueHeroCard } from "@/components/patient/LiveQueueHeroCard";
import { QueueBoard } from "@/components/patient/QueueBoard";
import { doctors } from "@/lib/mock-data";
import { doctorGenderFor } from "@/lib/doctor-gender";
import { getLiveQueueContext } from "@/lib/patient-queue";
import { pushPatientNotification } from "@/lib/patient-notifications-store";
import { clinicPhoneHref } from "@/lib/patient-care-actions";

export const Route = createFileRoute("/queue")({
  validateSearch: (search: Record<string, unknown>) => ({
    doctor: typeof search.doctor === "string" ? search.doctor : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Live Queue — Medora" },
      {
        name: "description",
        content:
          "Real-time queue position, estimated wait, and arrival instructions for your active visit.",
      },
    ],
  }),
  component: Queue,
});

function Queue() {
  const { doctor: doctorFilter } = useSearch({ from: "/queue" });
  const live = getLiveQueueContext(doctors, doctorFilter);

  if (!live) {
    return (
      <div className="w-full py-16 text-center lg:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
          No active queue
        </p>
        <h1 className="mt-3 font-serif text-2xl tracking-tight text-ink lg:text-3xl">
          You&apos;re not in line right now
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Book an appointment to join a clinic queue.
        </p>
        <Link
          to="/book"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Book an appointment
        </Link>
      </div>
    );
  }

  const { appointment, doctor } = live;
  const position = appointment.queuePosition ?? 3;
  const total = appointment.queueTotal ?? 6;

  const notifyWhenCalled = () => {
    pushPatientNotification({
      title: "Queue alert enabled",
      body: `We'll notify you when you're one patient away from ${doctor.name}.`,
      at: "Just now",
      type: "appointment",
      to: "/queue",
    });
    toast.success("Notifications on", {
      description: "We'll alert you when you're one patient away.",
    });
  };

  const holdPlace = () => {
    pushPatientNotification({
      title: "Place held for 5 minutes",
      body: `Your queue spot with ${doctor.name} is held until you return.`,
      at: "Just now",
      type: "appointment",
      to: "/queue",
    });
    toast.success("Place held", {
      description: "You have 5 minutes before rejoining the queue.",
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-10">
      <Link
        to="/care"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>Care</span>
      </Link>

      <header className="mb-5 border-b border-[#EDEAE6] pb-5 lg:mb-8 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:pb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
            Live visit
          </p>
          <h1 className="mt-1 font-serif text-[26px] leading-tight tracking-tight text-ink sm:text-[32px] lg:text-[40px]">
            Your queue status
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            We&apos;ll notify you when you&apos;re one patient away.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0">
          <span className="rounded-full border border-[#EDEAE6] bg-white px-3 py-1.5 text-xs font-medium text-ink-muted">
            #{position} of {total}
          </span>
          <span className="rounded-full border border-[#EDEAE6] bg-white px-3 py-1.5 text-xs font-medium text-ink-muted">
            ~{appointment.estimatedWait ?? "—"} min
          </span>
        </div>
      </header>

      {/* Mobile: single column stack · Desktop (lg+): main + sidebar */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7 xl:col-span-8">
          <LiveQueueHeroCard
            appointment={appointment}
            doctor={doctor}
            to={undefined}
          />
          <QueueBoard
            position={position}
            total={total}
            doctorName={doctor.name}
            doctorGender={doctorGenderFor(doctor)}
            estimatedWait={appointment.estimatedWait}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:col-span-5 lg:gap-4 xl:col-span-4">
          <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-ink">Visit details</h2>
            <dl className="mt-3 grid gap-3 text-sm lg:mt-4 lg:gap-4">
              <div>
                <dt className="text-xs text-ink-muted">Reason</dt>
                <dd className="mt-0.5 font-medium text-ink">{appointment.reason}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Location</dt>
                <dd className="mt-0.5 inline-flex items-start gap-1.5 font-medium text-ink">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <span className="break-words">
                    {doctor.hospital} · {appointment.room ?? "Suite 4B"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Front desk</dt>
                <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-ink">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <a href={clinicPhoneHref()} className="hover:text-clay">
                    +1 (415) 555-0142
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-2">
            <button
              type="button"
              onClick={notifyWhenCalled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-sm font-medium text-primary-foreground"
            >
              <Bell className="h-4 w-4" />
              Notify me when called
            </button>
            <button
              type="button"
              onClick={holdPlace}
              className="w-full rounded-2xl border border-[#EDEAE6] bg-white py-3.5 text-sm font-medium text-ink"
            >
              Hold my place (5 min)
            </button>
          </section>

          <section className="rounded-2xl border border-[#EDEAE6] bg-[#F9F7F2] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-ink">Before you&apos;re called</p>
                <ul className="mt-2 space-y-2 text-xs leading-relaxed text-ink-muted">
                  <li>· Keep your phone volume on — we send a push at 1 patient ahead.</li>
                  <li>· Have your ID and insurance card ready at check-in.</li>
                  <li>
                    · Shared reports are already visible to {doctor.name.split(" ").pop()}.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
