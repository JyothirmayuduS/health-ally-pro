import { createFileRoute } from "@tanstack/react-router";
import {
  ClinicalTaskSchema,
  CompleteConsultationSchema,
  CompleteTaskSchema,
  FollowUpSchema,
  LabOrderSchema,
  PrescriptionOrderSchema,
  RadiologyOrderSchema,
  ReferralSchema,
  StartConsultationSchema,
} from "@/lib/doctor-workspace/schemas";
import {
  completeClinicalTask,
  completeConsultation,
  createClinicalTask,
  createReferral,
  getConsultationBundle,
  getDoctorBoard,
  orderLab,
  orderPrescription,
  orderRadiology,
  scheduleFollowUp,
  startConsultation,
} from "@/server/doctor-workspace/service";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";
import { optionsResponse } from "@/server/ai/api-auth";

export const Route = createFileRoute("/api/hospital/doctor-workspace")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),

      GET: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;
        const url = new URL(request.url);
        const action = url.searchParams.get("action");

        if (action === "consultation") {
          const consultationId = url.searchParams.get("consultationId");
          if (!consultationId) {
            return withRequestLog(request, started, fail(400, "consultationId required"), {
              request_id: requestId,
            });
          }
          const result = await getConsultationBundle(auth, consultationId);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "doctor.consultation.read", "doctor_consultations", requestId, {
            consultation_id: consultationId,
            patient_id: result.data.patientId,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        const date = url.searchParams.get("date") ?? undefined;
        const result = await getDoctorBoard(auth, { date });
        if (!result.ok) {
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
          });
        }
        auditAfter(request, auth, "doctor.workspace.board", "doctor_workspace", requestId, {
          date: result.data.date,
          appointment_count: result.data.appointments.length,
          queue_count: result.data.queue.length,
        });
        return withRequestLog(request, started, ok(result.data), { request_id: requestId });
      },

      POST: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;
        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "";
        const body = await request.json().catch(() => ({}));

        const run = async (
          auditAction: string,
          resource: string,
          meta: Record<string, unknown>,
          exec: () => Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }>,
        ) => {
          const result = await exec();
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, auditAction, resource, requestId, meta);
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        };

        if (action === "start") {
          const parsed = StartConsultationSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.consultation.start",
            "doctor_consultations",
            { patient_id: parsed.data.patientId },
            () => startConsultation(auth, parsed.data),
          );
        }

        if (action === "complete") {
          const parsed = CompleteConsultationSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.consultation.complete",
            "doctor_consultations",
            { consultation_id: parsed.data.consultationId },
            () => completeConsultation(auth, parsed.data.consultationId, parsed.data.notes),
          );
        }

        if (action === "rx") {
          const parsed = PrescriptionOrderSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run("doctor.rx.order", "prescriptions", { patient_id: parsed.data.patientId }, () =>
            orderPrescription(auth, parsed.data),
          );
        }

        if (action === "lab") {
          const parsed = LabOrderSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run("doctor.lab.order", "lab_orders", { patient_id: parsed.data.patientId }, () =>
            orderLab(auth, parsed.data),
          );
        }

        if (action === "radiology") {
          const parsed = RadiologyOrderSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.radiology.order",
            "radiology_orders",
            { patient_id: parsed.data.patientId },
            () => orderRadiology(auth, parsed.data),
          );
        }

        if (action === "referral") {
          const parsed = ReferralSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.referral.create",
            "clinical_referrals",
            { patient_id: parsed.data.patientId },
            () => createReferral(auth, parsed.data),
          );
        }

        if (action === "task") {
          const parsed = ClinicalTaskSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run("doctor.task.create", "clinical_tasks", {}, () =>
            createClinicalTask(auth, parsed.data),
          );
        }

        if (action === "complete_task") {
          const parsed = CompleteTaskSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.task.complete",
            "clinical_tasks",
            { task_id: parsed.data.taskId },
            () => completeClinicalTask(auth, parsed.data.taskId),
          );
        }

        if (action === "follow_up") {
          const parsed = FollowUpSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          return run(
            "doctor.follow_up.schedule",
            "appointments",
            { patient_id: parsed.data.patientId },
            () => scheduleFollowUp(auth, parsed.data),
          );
        }

        return withRequestLog(request, started, fail(400, "Unknown action"), {
          request_id: requestId,
        });
      },
    },
  },
});
