import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import {
  authorizeHospitalPersist,
  authorizePublicOnboard,
} from "@/server/hospital-persist-auth";
import { serverHasModule } from "@/server/license";
import { writePhiAudit } from "@/server/phi-audit";
import { productionBootHttpResponse } from "@/server/production-boot";
import { notifyLeadWebhook, verifyTurnstile } from "@/server/sales-ops";
import {
  DEFAULT_HOSPITAL_ID,
  insertOnboardingLead,
  insertSpecialtyChart,
  listAnatomyMarkers,
  listHospitalDoctors,
  listSpecialtyCharts,
  listUnitRecords,
  persistenceAvailable,
  replaceAnatomyMarkers,
  updateUnitRecordStatus,
  upsertHospitalDoctors,
  upsertUnitRecords,
  upsertDeskRecords,
  listDeskRecords,
  type DbAnatomyMarker,
  type DbHospitalDoctor,
  type DbOnboardingLead,
  type DbSpecialtyChart,
  type DbUnitRecord,
  type DbDeskRecord,
  type DeskId,
} from "@/server/hospital-persistence";

function fail(auth: { status: number; error: string }) {
  return jsonResponse({ error: auth.error }, { status: auth.status });
}

function requireModule(moduleId: string, mode: string) {
  // Demo/API key paths used for sales demos & ops; licensed JWT must match plan modules
  if (mode === "demo" || mode === "api_key") return null;
  if (!serverHasModule(moduleId)) {
    return jsonResponse(
      { error: `Module '${moduleId}' not included in current license plan` },
      { status: 403 },
    );
  }
  return null;
}

async function audit(
  request: Request,
  auth: { hospitalId: string; userId: string | null; actorEmail: string | null },
  action: string,
  resource: string,
  extra?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown>; outcome?: "success" | "denied" | "error" },
) {
  await writePhiAudit({
    hospitalId: auth.hospitalId,
    actorId: auth.userId,
    actorEmail: auth.actorEmail,
    action,
    resource,
    entityType: extra?.entityType,
    entityId: extra?.entityId,
    metadata: extra?.metadata,
    outcome: extra?.outcome,
    request,
  });
}

export const Route = createFileRoute("/api/hospital/persist")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const url = new URL(request.url);
        const resource = url.searchParams.get("resource");
        const requestedHospitalId = url.searchParams.get("hospitalId");
        const specialtyId = url.searchParams.get("specialtyId") ?? undefined;

        if (resource === "status") {
          // Status is intentionally low-sensitivity (no PHI); still require same-origin/auth.
          const auth = await authorizeHospitalPersist(request, requestedHospitalId);
          if (!auth.ok) {
            // Soft status for UI badge when logged out
            return jsonResponse({
              ok: false,
              persistence: persistenceAvailable(),
              hospitalId: DEFAULT_HOSPITAL_ID,
              authRequired: true,
            });
          }
          return jsonResponse({
            ok: true,
            persistence: persistenceAvailable(),
            hospitalId: auth.hospitalId,
            mode: auth.mode,
          });
        }

        const auth = await authorizeHospitalPersist(request, requestedHospitalId);
        if (!auth.ok) return fail(auth);

        if (!persistenceAvailable()) {
          return jsonResponse({ ok: false, offline: true, data: [] });
        }

        const hospitalId = auth.hospitalId;

        switch (resource) {
          case "doctors": {
            const result = await listHospitalDoctors(hospitalId);
            await audit(request, auth, "read", "hospital_doctors", {
              metadata: { count: Array.isArray(result.data) ? result.data.length : 0 },
            });
            return jsonResponse(result);
          }
          case "charts": {
            const result = await listSpecialtyCharts(hospitalId, specialtyId);
            await audit(request, auth, "read", "specialty_chart_notes", {
              metadata: {
                specialtyId: specialtyId ?? null,
                count: Array.isArray(result.data) ? result.data.length : 0,
              },
            });
            return jsonResponse(result);
          }
          case "units": {
            const result = await listUnitRecords(hospitalId);
            await audit(request, auth, "read", "hospital_unit_records", {
              metadata: { count: Array.isArray(result.data) ? result.data.length : 0 },
            });
            return jsonResponse(result);
          }
          case "anatomy": {
            if (!specialtyId) return jsonResponse({ error: "specialtyId required" }, { status: 400 });
            const result = await listAnatomyMarkers(hospitalId, specialtyId);
            await audit(request, auth, "read", "anatomy_markers", {
              metadata: { specialtyId },
            });
            return jsonResponse(result);
          }
          case "desk": {
            const desk = (url.searchParams.get("desk") ?? "") as DeskId;
            if (!["reception", "lab", "pharmacy", "billing", "nursing", "admin", "doctor", "patient"].includes(desk)) {
              return jsonResponse({ error: "desk required" }, { status: 400 });
            }
            const result = await listDeskRecords(hospitalId, desk);
            await audit(request, auth, "read", "hospital_desk_records", {
              metadata: { desk, count: Array.isArray(result.data) ? result.data.length : 0 },
            });
            return jsonResponse(result);
          }
          default:
            return jsonResponse({ error: "Unknown resource" }, { status: 400 });
        }
      },
      POST: async ({ request }) => {
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        if (!persistenceAvailable()) {
          return jsonResponse(
            { ok: false, offline: true, error: "Supabase admin not configured" },
            { status: 503 },
          );
        }

        let body: {
          action: string;
          hospitalId?: string;
          doctors?: DbHospitalDoctor[];
          chart?: DbSpecialtyChart;
          units?: DbUnitRecord[];
          unitStatus?: { id: string; status: string };
          lead?: DbOnboardingLead;
          anatomy?: { specialtyId: string; markers: DbAnatomyMarker[] };
          provision?: boolean;
          turnstileToken?: string;
          deskRecords?: DbDeskRecord[];
          desk?: DeskId;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        // Public sales funnel: lead only, rate-limited, no tenant create unless authorized
        if (body.action === "onboard") {
          const pub = authorizePublicOnboard(request);
          if (!pub.ok) return fail(pub);
          if (!body.lead) return jsonResponse({ error: "lead required" }, { status: 400 });

          const turnstile = await verifyTurnstile(body.turnstileToken, request);
          if (!turnstile.ok) {
            return jsonResponse({ error: turnstile.error }, { status: 400 });
          }

          const email = String(body.lead.admin_email ?? "").trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonResponse({ error: "Valid admin_email required" }, { status: 400 });
          }
          if (!String(body.lead.hospital_name ?? "").trim()) {
            return jsonResponse({ error: "hospital_name required" }, { status: 400 });
          }

          let provision = false;
          if (body.provision) {
            const auth = await authorizeHospitalPersist(request, body.hospitalId);
            provision = auth.ok && auth.canProvision;
          }

          const result = await insertOnboardingLead(
            {
              ...body.lead,
              admin_email: email,
              hospital_name: String(body.lead.hospital_name).trim(),
            },
            { provisionHospital: provision },
          );

          if (result.ok) {
            await notifyLeadWebhook({
              hospitalName: String(body.lead.hospital_name).trim(),
              adminEmail: email,
              plan: String((body.lead as { plan?: string }).plan ?? ""),
              provisioned: provision,
            });
            await writePhiAudit({
              hospitalId: DEFAULT_HOSPITAL_ID,
              actorEmail: email,
              action: "create",
              resource: "hospital_onboarding_leads",
              metadata: { provision },
              request,
            });
          }

          return jsonResponse(result);
        }

        const auth = await authorizeHospitalPersist(request, body.hospitalId);
        if (!auth.ok) return fail(auth);
        if (!auth.canWriteClinical) {
          await audit(request, auth, body.action || "write", "hospital_persist", {
            outcome: "denied",
          });
          return jsonResponse({ error: "Forbidden" }, { status: 403 });
        }

        const hospitalId = auth.hospitalId;

        switch (body.action) {
          case "upsert_doctors": {
            const denied = requireModule("specialty_desk", auth.mode);
            if (denied) {
              await audit(request, auth, "upsert", "hospital_doctors", { outcome: "denied" });
              return denied;
            }
            const result = await upsertHospitalDoctors(
              (body.doctors ?? []).map((d) => ({
                ...d,
                hospital_id: hospitalId,
              })),
            );
            await audit(request, auth, "upsert", "hospital_doctors", {
              metadata: { count: body.doctors?.length ?? 0 },
              outcome: result.ok ? "success" : "error",
            });
            return jsonResponse(result);
          }
          case "insert_chart": {
            const denied = requireModule("specialty_desk", auth.mode);
            if (denied) {
              await audit(request, auth, "create", "specialty_chart_notes", { outcome: "denied" });
              return denied;
            }
            if (!body.chart) return jsonResponse({ error: "chart required" }, { status: 400 });
            const result = await insertSpecialtyChart({
              ...body.chart,
              hospital_id: hospitalId,
              patient_name: String(body.chart.patient_name ?? "").slice(0, 200),
            });
            await audit(request, auth, "create", "specialty_chart_notes", {
              entityType: "specialty_chart_note",
              entityId: result.data && typeof result.data === "object" && "id" in result.data
                ? String((result.data as { id: string }).id)
                : undefined,
              metadata: { specialtyId: body.chart.specialty_id },
              outcome: result.ok ? "success" : "error",
            });
            return jsonResponse(result);
          }
          case "upsert_units": {
            const denied = requireModule("hospital_units", auth.mode);
            if (denied) {
              await audit(request, auth, "upsert", "hospital_unit_records", { outcome: "denied" });
              return denied;
            }
            const result = await upsertUnitRecords(
              (body.units ?? []).map((u) => ({ ...u, hospital_id: hospitalId })),
            );
            await audit(request, auth, "upsert", "hospital_unit_records", {
              metadata: { count: body.units?.length ?? 0 },
              outcome: result.ok ? "success" : "error",
            });
            return jsonResponse(result);
          }
          case "update_unit_status": {
            const denied = requireModule("hospital_units", auth.mode);
            if (denied) {
              await audit(request, auth, "update", "hospital_unit_records", { outcome: "denied" });
              return denied;
            }
            if (!body.unitStatus) return jsonResponse({ error: "unitStatus required" }, { status: 400 });
            {
              const units = await listUnitRecords(hospitalId);
              const owned = (units.data ?? []).some((u) => u.id === body.unitStatus!.id);
              if (!owned && auth.mode !== "api_key") {
                return jsonResponse({ error: "Unit not found in hospital" }, { status: 404 });
              }
              const result = await updateUnitRecordStatus(body.unitStatus.id, body.unitStatus.status);
              await audit(request, auth, "update_status", "hospital_unit_records", {
                entityId: body.unitStatus.id,
                metadata: { status: body.unitStatus.status },
                outcome: result.ok ? "success" : "error",
              });
              return jsonResponse(result);
            }
          }
          case "save_anatomy": {
            const denied = requireModule("anatomy_3d", auth.mode);
            if (denied) {
              await audit(request, auth, "replace", "anatomy_markers", { outcome: "denied" });
              return denied;
            }
            if (!body.anatomy?.specialtyId) {
              return jsonResponse({ error: "anatomy.specialtyId required" }, { status: 400 });
            }
            const result = await replaceAnatomyMarkers(
              hospitalId,
              body.anatomy.specialtyId,
              (body.anatomy.markers ?? []).map((m) => ({
                ...m,
                hospital_id: hospitalId,
              })),
            );
            await audit(request, auth, "replace", "anatomy_markers", {
              metadata: {
                specialtyId: body.anatomy.specialtyId,
                count: body.anatomy.markers?.length ?? 0,
              },
              outcome: result.ok ? "success" : "error",
            });
            return jsonResponse(result);
          }
          case "upsert_desk": {
            const desk = body.desk;
            if (
              !desk ||
              !["reception", "lab", "pharmacy", "billing", "nursing", "admin", "doctor", "patient"].includes(
                desk,
              )
            ) {
              return jsonResponse({ error: "desk required" }, { status: 400 });
            }
            const result = await upsertDeskRecords(
              (body.deskRecords ?? []).map((r) => ({
                ...r,
                hospital_id: hospitalId,
                desk,
              })),
            );
            await audit(request, auth, "upsert", "hospital_desk_records", {
              metadata: { desk, count: body.deskRecords?.length ?? 0 },
              outcome: result.ok ? "success" : "error",
            });
            return jsonResponse(result);
          }
          default:
            return jsonResponse({ error: "Unknown action" }, { status: 400 });
        }
      },
    },
  },
});
