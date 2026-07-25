import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/server/ai/api-auth";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";
import {
  AppointmentListSchema,
  AvailabilityRuleSchema,
  BookAppointmentSchema,
  CancelAppointmentSchema,
  CheckInSchema,
  RescheduleSchema,
  WalkInSchema,
} from "@/lib/opd/schemas";
import {
  bookAppointment,
  cancelAppointment,
  checkInAppointment,
  createWalkIn,
  listAppointments,
  listAvailability,
  rescheduleAppointment,
  upsertAvailabilityRule,
} from "@/server/opd/service";

export const Route = createFileRoute("/api/hospital/appointments")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;
        const authResult = await authorize(request);
        if (!authResult.ok) return fail(authResult.status, authResult.error);
        const auth = authResult.auth;
        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "list";
        if (action === "availability") {
          const doctorId = url.searchParams.get("doctorId");
          if (!doctorId) return fail(400, "doctorId required");
          const result = await listAvailability(
            auth,
            doctorId,
            url.searchParams.get("date") ?? undefined,
          );
          if (!result.ok) return fail(result.status, result.error);
          return withRequestLog(request, started, ok(result.data), {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
            resource: "doctor_availability",
          });
        }
        const parsed = AppointmentListSchema.safeParse({
          date: url.searchParams.get("date") ?? undefined,
          doctorId: url.searchParams.get("doctorId") ?? undefined,
          patientId: url.searchParams.get("patientId") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
          page: url.searchParams.get("page") ?? 1,
          pageSize: url.searchParams.get("pageSize") ?? 50,
        });
        if (!parsed.success) return fail(400, parsed.error.message);
        const result = await listAppointments(auth, parsed.data);
        if (!result.ok) {
          auditAfter(request, auth, "opd.appointments.list_denied", "appointments", requestId, {}, "denied");
          return fail(result.status, result.error);
        }
        auditAfter(request, auth, "opd.appointments.list", "appointments", requestId, {
          count: result.data.total,
        });
        return withRequestLog(request, started, ok(result.data), {
          request_id: requestId,
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          resource: "appointments",
        });
      },
      POST: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;
        const authResult = await authorize(request);
        if (!authResult.ok) return fail(authResult.status, authResult.error);
        const auth = authResult.auth;
        const action = new URL(request.url).searchParams.get("action") ?? "book";
        const body = await request.json().catch(() => ({}));

        let result:
          | Awaited<ReturnType<typeof bookAppointment>>
          | Awaited<ReturnType<typeof createWalkIn>>
          | Awaited<ReturnType<typeof checkInAppointment>>
          | Awaited<ReturnType<typeof rescheduleAppointment>>
          | Awaited<ReturnType<typeof cancelAppointment>>
          | Awaited<ReturnType<typeof upsertAvailabilityRule>>;

        if (action === "book" || action === "follow_up") {
          const parsed = BookAppointmentSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await bookAppointment(auth, parsed.data);
        } else if (action === "walk_in") {
          const parsed = WalkInSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await createWalkIn(auth, parsed.data);
        } else if (action === "check_in") {
          const parsed = CheckInSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await checkInAppointment(auth, parsed.data.appointmentId);
        } else if (action === "reschedule") {
          const parsed = RescheduleSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await rescheduleAppointment(
            auth,
            parsed.data.appointmentId,
            parsed.data.scheduledAt,
            parsed.data.doctorId,
            parsed.data.reason,
          );
        } else if (action === "cancel") {
          const parsed = CancelAppointmentSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await cancelAppointment(
            auth,
            parsed.data.appointmentId,
            parsed.data.reason,
            parsed.data.notes,
          );
        } else if (action === "availability") {
          const parsed = AvailabilityRuleSchema.safeParse(body);
          if (!parsed.success) return fail(400, parsed.error.message);
          result = await upsertAvailabilityRule(auth, parsed.data);
        } else {
          return fail(400, "Unknown action");
        }

        if (!result.ok) {
          auditAfter(
            request,
            auth,
            `opd.${action}_denied`,
            "appointments",
            requestId,
            { code: result.code },
            result.status === 403 ? "denied" : "error",
          );
          return fail(result.status, result.error);
        }
        auditAfter(request, auth, `opd.${action}`, "appointments", requestId);
        return withRequestLog(request, started, ok(result.data), {
          request_id: requestId,
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          resource: "appointments",
        });
      },
    },
  },
});
