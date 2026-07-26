import { describe, expect, it } from "vitest";
import {
  AppointmentListSchema,
  AvailabilityRuleSchema,
  BookAppointmentSchema,
  QueueActionSchema,
  appointmentStatusToDesk,
  queueStatusToDesk,
} from "./schemas";
import { opdToReceptionAppointment, rowToOpdAppointment } from "./compat";
import { canPerformOpd } from "@/server/opd/rbac";
import type { PhiReadAuth } from "@/server/phi-reads";

const staff: PhiReadAuth = {
  userId: "staff-1",
  email: "staff@example.test",
  hospitalIds: ["hospital-a"],
  hospitalId: "hospital-a",
  isStaff: true,
  isPatient: false,
  patientId: null,
};

describe("OPD contracts", () => {
  it("validates conflict-safe booking input", () => {
    expect(
      BookAppointmentSchema.safeParse({
        patientId: "MRN-100231",
        doctorId: "DOC-001",
        scheduledAt: "2026-07-27T09:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      BookAppointmentSchema.safeParse({
        patientId: "MRN-100231",
        doctorId: "DOC-001",
        scheduledAt: "tomorrow",
      }).success,
    ).toBe(false);
  });

  it("defaults pagination and validates queue transitions", () => {
    expect(AppointmentListSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 50,
    });
    expect(
      QueueActionSchema.safeParse({
        queueEntryId: crypto.randomUUID(),
        action: "complete",
      }).success,
    ).toBe(true);
  });

  it("validates availability ranges", () => {
    expect(
      AvailabilityRuleSchema.safeParse({
        doctorId: "DOC-001",
        weekday: 1,
        startTime: "09:00",
        endTime: "17:00",
      }).success,
    ).toBe(true);
    expect(
      AvailabilityRuleSchema.safeParse({
        doctorId: "DOC-001",
        weekday: 8,
        startTime: "9am",
        endTime: "17:00",
      }).success,
    ).toBe(false);
  });
});

describe("OPD compatibility", () => {
  it("maps canonical rows to reception status and legacy ids", () => {
    const appointment = rowToOpdAppointment({
      id: "appointment-uuid",
      hospital_id: "hospital-a",
      patient_id: "patient-uuid",
      doctor_staff_id: "doctor-uuid",
      scheduled_at: "2026-07-27T09:00:00.000Z",
      status: "in_queue",
      appointment_type: "follow-up",
      visit_mode: "scheduled",
      token_number: 104,
      legacy_id: "APT-50020",
      patients: { mrn: "MRN-100231" },
      staff_profiles: { legacy_id: "DOC-001" },
    });
    const desk = opdToReceptionAppointment(appointment);
    expect(desk).toMatchObject({
      id: "APT-50020",
      patientId: "MRN-100231",
      doctorId: "DOC-001",
      status: "checked-in",
      tokenNumber: 104,
    });
  });

  it("maps status vocabularies deterministically", () => {
    expect(appointmentStatusToDesk("upcoming")).toBe("scheduled");
    expect(appointmentStatusToDesk("in_queue")).toBe("checked-in");
    expect(queueStatusToDesk("in_progress")).toBe("in-consultation");
  });
});

describe("OPD RBAC", () => {
  it("allows reception lifecycle but not doctor booking", () => {
    expect(
      canPerformOpd("book", staff, {
        roles: ["receptionist"],
        staffProfileIds: [],
      }),
    ).toBe(true);
    expect(
      canPerformOpd("book", staff, {
        roles: ["doctor"],
        staffProfileIds: ["doctor-1"],
      }),
    ).toBe(false);
  });

  it("restricts doctors to their own queue and availability", () => {
    const actor = { roles: ["doctor"] as const, staffProfileIds: ["doctor-1"] };
    expect(canPerformOpd("manage_queue", staff, actor, "doctor-1")).toBe(true);
    expect(canPerformOpd("manage_queue", staff, actor, "doctor-2")).toBe(false);
    expect(canPerformOpd("manage_availability", staff, actor, "doctor-1")).toBe(true);
  });
});
