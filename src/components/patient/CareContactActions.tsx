import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import {
  clinicPhoneHref,
  doctorMessageHref,
  videoVisitNotice,
} from "@/lib/patient-care-actions";
import { cn } from "@/lib/utils";

type Props = {
  doctorName: string;
  variant?: "row" | "compact" | "icon";
  className?: string;
};

export function CareContactActions({
  doctorName,
  variant = "row",
  className,
}: Props) {
  const messageLink = doctorMessageHref(doctorName);

  const onVideo = () => {
    toast.message("Video visit", { description: videoVisitNotice(doctorName) });
  };

  if (variant === "icon") {
    return (
      <div className={cn("flex shrink-0 gap-2", className)}>
        <a
          href={clinicPhoneHref()}
          aria-label={`Call ${doctorName}`}
          className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10"
        >
          <Phone className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />
        </a>
        <Link
          to={messageLink.to}
          search={messageLink.search}
          aria-label={`Message ${doctorName}`}
          className="grid h-9 w-9 place-items-center rounded-full bg-clay/10"
        >
          <MessageCircle className="h-3.5 w-3.5 text-clay" strokeWidth={1.75} />
        </Link>
        <button
          type="button"
          aria-label={`Video visit with ${doctorName}`}
          onClick={onVideo}
          className="grid h-9 w-9 place-items-center rounded-full bg-ink/10"
        >
          <Video className="h-3.5 w-3.5 text-ink" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-2", className)}>
        <a
          href={clinicPhoneHref()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium"
        >
          <Phone className="h-3.5 w-3.5" />
          Audio
        </a>
        <Link
          to={messageLink.to}
          search={messageLink.search}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </Link>
        <button
          type="button"
          onClick={onVideo}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-clay/30 bg-clay/10 py-2.5 text-xs font-medium text-clay"
        >
          <Video className="h-3.5 w-3.5" />
          Video
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={clinicPhoneHref()}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#EDEAE6] px-3 py-1.5 text-xs font-medium text-ink"
      >
        <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
        Call
      </a>
      <Link
        to={messageLink.to}
        search={messageLink.search}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#EDEAE6] px-3 py-1.5 text-xs font-medium text-ink"
      >
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
        Message
      </Link>
      <button
        type="button"
        onClick={onVideo}
        className="inline-flex items-center gap-1.5 rounded-full border border-clay/30 bg-clay/10 px-3 py-1.5 text-xs font-medium text-clay"
      >
        <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
        Video
      </button>
    </div>
  );
}
