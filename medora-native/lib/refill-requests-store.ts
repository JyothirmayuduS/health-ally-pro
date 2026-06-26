export type RefillRequest = {
  id: string;
  medicationId: string;
  medicationName: string;
  status: "pending" | "approved" | "cancelled";
  submittedAt: string;
  deliveryMethod: "delivery" | "pickup";
};

let requests: RefillRequest[] = [
  {
    id: "rr-seed-1",
    medicationId: "m1",
    medicationName: "Levothyroxine",
    status: "pending",
    submittedAt: "2026-06-25T02:37:00.000Z",
    deliveryMethod: "delivery",
  },
  {
    id: "rr-seed-2",
    medicationId: "m1",
    medicationName: "Levothyroxine",
    status: "pending",
    submittedAt: "2026-05-28T21:56:00.000Z",
    deliveryMethod: "pickup",
  },
  {
    id: "rr-seed-3",
    medicationId: "m1",
    medicationName: "Levothyroxine",
    status: "pending",
    submittedAt: "2026-05-28T21:55:00.000Z",
    deliveryMethod: "delivery",
  },
];

export function listRefillRequests(): RefillRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function addRefillRequest(
  input: Omit<RefillRequest, "id" | "status" | "submittedAt"> & {
    id?: string;
    status?: RefillRequest["status"];
    submittedAt?: string;
  },
): RefillRequest {
  const record: RefillRequest = {
    ...input,
    id: input.id ?? `rr-${Date.now()}`,
    status: input.status ?? "pending",
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  };
  requests = [record, ...requests];
  return record;
}

export function cancelRefillRequest(id: string): void {
  requests = requests.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r));
}

export function formatRefillSubmitted(iso: string) {
  const d = new Date(iso);
  return `Submitted ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}
