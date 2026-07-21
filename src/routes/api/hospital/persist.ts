import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import {
  authorizeHospitalPersist,
  authorizePublicOnboard,
} from "@/server/hospital-persist-auth";
import { serverHasModule } from "@/server/license";
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
  type DbAnatomyMarker,
  type DbHospitalDoctor,
  type DbOnboardingLead,
  type DbSpecialtyChart,
  type DbUnitRecord,
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

export const Route = createFileRoute("/api/hospital/persist")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
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
          case "doctors":
            return jsonResponse(await listHospitalDoctors(hospitalId));
          case "charts":
            return jsonResponse(await listSpecialtyCharts(hospitalId, specialtyId));
          case "units":
            return jsonResponse(await listUnitRecords(hospitalId));
          case "anatomy":
            if (!specialtyId) return jsonResponse({ error: "specialtyId required" }, { status: 400 });
            return jsonResponse(await listAnatomyMarkers(hospitalId, specialtyId));
          default:
            return jsonResponse({ error: "Unknown resource" }, { status: 400 });
        }
      },
      POST: async ({ request }) => {
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

          return jsonResponse(
            await insertOnboardingLead(
              {
                ...body.lead,
                admin_email: email,
                hospital_name: String(body.lead.hospital_name).trim(),
              },
              { provisionHospital: provision },
            ),
          );
        }

        const auth = await authorizeHospitalPersist(request, body.hospitalId);
        if (!auth.ok) return fail(auth);
        if (!auth.canWriteClinical) {
          return jsonResponse({ error: "Forbidden" }, { status: 403 });
        }

        const hospitalId = auth.hospitalId;

        switch (body.action) {
          case "upsert_doctors": {
            const denied = requireModule("specialty_desk", auth.mode);
            if (denied) return denied;
            return jsonResponse(
              await upsertHospitalDoctors(
                (body.doctors ?? []).map((d) => ({
                  ...d,
                  hospital_id: hospitalId,
                })),
              ),
            );
          }
          case "insert_chart": {
            const denied = requireModule("specialty_desk", auth.mode);
            if (denied) return denied;
            if (!body.chart) return jsonResponse({ error: "chart required" }, { status: 400 });
            return jsonResponse(
              await insertSpecialtyChart({
                ...body.chart,
                hospital_id: hospitalId,
                patient_name: String(body.chart.patient_name ?? "").slice(0, 200),
              }),
            );
          }
          case "upsert_units": {
            const denied = requireModule("hospital_units", auth.mode);
            if (denied) return denied;
            return jsonResponse(
              await upsertUnitRecords(
                (body.units ?? []).map((u) => ({ ...u, hospital_id: hospitalId })),
              ),
            );
          }
          case "update_unit_status": {
            const denied = requireModule("hospital_units", auth.mode);
            if (denied) return denied;
            if (!body.unitStatus) return jsonResponse({ error: "unitStatus required" }, { status: 400 });
            {
              const units = await listUnitRecords(hospitalId);
              const owned = (units.data ?? []).some((u) => u.id === body.unitStatus!.id);
              if (!owned && auth.mode !== "api_key") {
                return jsonResponse({ error: "Unit not found in hospital" }, { status: 404 });
              }
              return jsonResponse(
                await updateUnitRecordStatus(body.unitStatus.id, body.unitStatus.status),
              );
            }
          }
          case "save_anatomy": {
            const denied = requireModule("anatomy_3d", auth.mode);
            if (denied) return denied;
            if (!body.anatomy?.specialtyId) {
              return jsonResponse({ error: "anatomy.specialtyId required" }, { status: 400 });
            }
            return jsonResponse(
              await replaceAnatomyMarkers(
                hospitalId,
                body.anatomy.specialtyId,
                (body.anatomy.markers ?? []).map((m) => ({
                  ...m,
                  hospital_id: hospitalId,
                })),
              ),
            );
          }
          default:
            return jsonResponse({ error: "Unknown action" }, { status: 400 });
        }
      },
    },
  },
});
