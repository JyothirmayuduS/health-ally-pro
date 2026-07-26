import type { SharedPatient } from "@/lib/shared/patients";
import type { ManagedPatient, PatientProfileBundle } from "./schemas";

export function managedToSharedPatient(p: ManagedPatient): SharedPatient {
  return {
    id: p.mrn || p.id,
    mrn: p.mrn,
    name: p.fullName,
    dob: p.dateOfBirth ?? undefined,
    gender: p.gender ?? "Unknown",
    phone: p.phone ?? "",
    email: p.email ?? undefined,
    address: [p.addressLine1, p.addressLine2, p.city, p.state, p.postalCode]
      .filter(Boolean)
      .join(", "),
    bloodGroup: p.bloodGroup ?? undefined,
    allergies: p.allergiesSummary || "—",
    insurance:
      p.insuranceProvider || p.insurancePolicyId
        ? {
            provider: p.insuranceProvider || "Self-pay",
            policyId: p.insurancePolicyId || "—",
          }
        : undefined,
    createdAt: p.createdAt?.slice(0, 10),
  };
}

export function bundleToSharedPatient(bundle: PatientProfileBundle): SharedPatient {
  const shared = managedToSharedPatient(bundle.patient);
  const primary = bundle.emergencyContacts.find((c) => c.is_primary) ?? bundle.emergencyContacts[0];
  if (primary) {
    shared.emergency = {
      name: String(primary.full_name ?? ""),
      phone: String(primary.phone ?? ""),
      relation: String(primary.relation ?? ""),
    };
  }
  if (bundle.allergies.length > 0) {
    shared.allergies = bundle.allergies
      .filter((a) => a.status === "active" && !a.archived_at)
      .map((a) => String(a.substance ?? ""))
      .filter(Boolean)
      .join(", ");
  }
  return shared;
}

export function rowToManagedPatient(row: Record<string, unknown>): ManagedPatient {
  return {
    id: String(row.id),
    hospitalId: String(row.hospital_id),
    mrn: String(row.mrn ?? ""),
    fullName: String(row.full_name ?? ""),
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    addressLine1: (row.address_line1 as string | null) ?? null,
    addressLine2: (row.address_line2 as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    bloodGroup: (row.blood_group as string | null) ?? null,
    nationalId: (row.national_id as string | null) ?? null,
    insuranceProvider: (row.insurance_provider as string | null) ?? null,
    insurancePolicyId: (row.insurance_policy_id as string | null) ?? null,
    allergiesSummary: (row.allergies_summary as string | null) ?? null,
    status: String(row.status ?? "active"),
    profileId: (row.profile_id as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
