import { Link } from "@tanstack/react-router";
import { Clock, MapPin, MessageCircle, Phone, Star, Video } from "lucide-react";
import { toast } from "sonner";
import type { Doctor } from "@/lib/mock-data";
import {
  clinicPhoneHref,
  doctorMessageHref,
  videoVisitNotice,
} from "@/lib/patient-care-actions";

export function DoctorListCard({ doctor }: { doctor: Doctor }) {
  const messageLink = doctorMessageHref(doctor.name);

  return (
    <article className="rounded-[20px] border border-[#EDEAE6] bg-white p-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-start gap-3.5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-clay/15 font-serif text-lg text-ink">
          {doctor.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-tight text-ink">{doctor.name}</p>
          <p className="text-[13px] text-ink-muted">{doctor.specialty}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Star className="h-3 w-3 fill-clay text-clay" />
            <span className="text-xs font-semibold text-ink">{doctor.rating}</span>
            <span className="text-xs text-ink-muted">({doctor.reviews})</span>
            <span className="rounded-lg border border-[#EDEAE6] bg-[#F9F7F2] px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
              {doctor.experience}y exp
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-xl border border-[#EDEAE6] bg-[#F9F7F2] px-2.5 py-1.5 font-serif text-[15px] text-ink">
          ${doctor.fee}
        </span>
      </div>

      <p className="mt-3.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
        {doctor.bio}
      </p>

      <div className="mt-3.5 flex flex-wrap gap-4 border-t border-[#EDEAE6] pt-3 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3 w-3" strokeWidth={1.75} />
          {doctor.hospital}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3" strokeWidth={1.75} />
          {doctor.nextSlot}
        </span>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#EDEAE6] pt-3.5">
        <div className="flex gap-2">
          <Link
            to={messageLink.to}
            search={messageLink.search}
            aria-label={`Message ${doctor.name}`}
            className="grid h-9 w-9 place-items-center rounded-full bg-clay/10 text-clay"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <a
            href={clinicPhoneHref()}
            aria-label={`Call ${doctor.name}`}
            className="grid h-9 w-9 place-items-center rounded-full bg-clay/10 text-clay"
          >
            <Phone className="h-4 w-4" strokeWidth={1.75} />
          </a>
          <button
            type="button"
            aria-label={`Video visit with ${doctor.name}`}
            onClick={() =>
              toast.message("Video visit", {
                description: videoVisitNotice(doctor.name),
              })
            }
            className="grid h-9 w-9 place-items-center rounded-full bg-clay/10 text-clay"
          >
            <Video className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <Link
          to="/book/$doctorId"
          params={{ doctorId: doctor.id }}
          className="rounded-[14px] bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Book Slot
        </Link>
      </div>
    </article>
  );
}
