import { createFileRoute } from "@tanstack/react-router";
import type { ClinicalEvent } from "@/lib/shared/clinical-event-log";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { pollClinicalEventInbox, publishClinicalEventToHub } from "@/server/clinical-event-hub";

export const Route = createFileRoute("/api/patient/clinical-events")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const patientId = url.searchParams.get("patientId");
        const since = Number(url.searchParams.get("since") ?? "0");

        if (!patientId) {
          return jsonResponse({ error: "patientId required" }, { status: 400 });
        }

        return jsonResponse(pollClinicalEventInbox(patientId, since));
      },
      POST: async ({ request }) => {
        let body: ClinicalEvent;
        try {
          body = (await request.json()) as ClinicalEvent;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body?.id || !body?.patientId || !body?.kind) {
          return jsonResponse({ error: "id, patientId, and kind required" }, { status: 400 });
        }

        const msg = publishClinicalEventToHub(body);
        return jsonResponse({ ok: true, seq: msg.seq });
      },
    },
  },
});
