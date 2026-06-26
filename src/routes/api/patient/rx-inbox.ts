import { createFileRoute } from "@tanstack/react-router";
import type { PatientRxSyncEnvelope } from "@/lib/shared/patient-rx-sync-types";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { pollPatientRxInbox, publishPatientRxToHub } from "@/server/patient-rx-sync-hub";

export const Route = createFileRoute("/api/patient/rx-inbox")({
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

        return jsonResponse(pollPatientRxInbox(patientId, since));
      },
      POST: async ({ request }) => {
        let body: PatientRxSyncEnvelope;
        try {
          body = (await request.json()) as PatientRxSyncEnvelope;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body?.patientId || !body?.rx_number) {
          return jsonResponse({ error: "patientId and rx_number required" }, { status: 400 });
        }

        const msg = publishPatientRxToHub(body);
        return jsonResponse({ ok: true, seq: msg.seq });
      },
    },
  },
});
