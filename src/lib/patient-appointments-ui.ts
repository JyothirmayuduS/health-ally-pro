export function appointmentStatusLabel(status: string) {
  if (status === "in-queue") return "In queue";
  if (status === "upcoming") return "Upcoming";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return status;
}

export function appointmentStatusColor(status: string) {
  if (status === "in-queue") return "text-clay bg-clay/10";
  if (status === "upcoming") return "text-emerald-700 bg-emerald-600/10";
  if (status === "completed") return "text-ink-muted bg-[#F3F1EC]";
  if (status === "cancelled") return "text-[#B5534A] bg-[#FDF0EE]";
  return "text-ink-muted bg-[#F3F1EC]";
}

export function formatVisitDateLong(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatVisitDateShort(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
