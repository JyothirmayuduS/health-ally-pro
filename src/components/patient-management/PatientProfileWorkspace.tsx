import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import type { SharedPatient } from "@/lib/shared/patients";
import type { PatientProfileBundle, UpdatePatientInput } from "@/lib/patient-management/schemas";
import { bundleToSharedPatient, managedToSharedPatient } from "@/lib/patient-management/compat";
import {
  addAllergy,
  addHistoryEntry,
  archiveDocument,
  downloadDocument,
  getPatientProfile,
  issueQr,
  replaceEmergencyContacts,
  revokeConsent,
  signConsent,
  updatePatient,
  uploadDocument,
  listConsentTemplates,
} from "@/lib/patient-management/client";
import { registerPatient as syncRegistry } from "@/lib/shared/patient-registry";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage";

const PROFILE_TABS = [
  "overview",
  "contacts",
  "allergies",
  "history",
  "consents",
  "documents",
  "qr",
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

type Props = {
  patientId: string;
  mode: "staff" | "self";
  sharedPatient?: SharedPatient;
  embedded?: boolean;
  defaultTab?: ProfileTab;
};

function str(v: unknown) {
  return v == null ? "" : String(v);
}

export function PatientProfileWorkspace({
  patientId,
  mode,
  sharedPatient,
  embedded,
  defaultTab = "overview",
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PatientProfileBundle | null>(null);
  const [resolvedId, setResolvedId] = useState(patientId);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<Record<string, unknown>>>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<ProfileTab>(defaultTab);

  const staff = mode === "staff";
  const canEditIdentity = staff || mode === "self";
  const canEditClinical = staff;
  const canManageQr = staff || mode === "self";
  const canUploadDocs = staff || mode === "self";

  const display = useMemo(() => {
    if (bundle) return bundleToSharedPatient(bundle);
    return sharedPatient;
  }, [bundle, sharedPatient]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPatientProfile(patientId);
    if (res.ok) {
      setBundle(res.data);
      setResolvedId(res.data.patient.id);
      if (res.data.qr?.tokenPrefix) {
        setQrToken(null);
        setQrSvg(null);
      }
      syncRegistry(managedToSharedPatient(res.data.patient));
    } else if (sharedPatient) {
      setError(res.error);
      setBundle(null);
    } else {
      setError(res.error || "Unable to load profile");
    }
    setLoading(false);
  }, [patientId, sharedPatient]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    listConsentTemplates().then((r) => {
      if (r.ok) setTemplates(r.data);
    });
  }, []);

  const renderQr = async (token: string) => {
    const svg = await QRCode.toString(token, { type: "svg", margin: 1, width: 180 });
    setQrSvg(svg);
    setQrToken(token);
  };

  const onIssueQr = async () => {
    if (!window.confirm("Issue a new QR ID? Previous active tokens will be revoked.")) return;
    const res = await issueQr(resolvedId);
    if (!res.ok) {
      toast.error("Could not issue QR", { description: res.error });
      return;
    }
    await renderQr(res.data.token);
    toast.success("Patient QR issued");
    void reload();
  };

  const onSaveOverview = async (patch: UpdatePatientInput) => {
    setSaving(true);
    const res = await updatePatient(resolvedId, patch);
    setSaving(false);
    if (!res.ok) {
      toast.error("Update failed", { description: res.error });
      return;
    }
    toast.success("Profile updated");
    void reload();
  };

  if (loading && !bundle && !sharedPatient) {
    return (
      <div className="surface p-10 flex items-center justify-center gap-2 text-ink-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading profile…
      </div>
    );
  }

  if (!display && error) {
    return (
      <div className="surface p-8 text-center">
        <AlertCircle className="w-8 h-8 text-status-noshowText mx-auto" />
        <p className="mt-3 text-[13px] text-ink-900">{error}</p>
        <button type="button" onClick={() => void reload()} className="mt-4 btn-ghost text-[12px]">
          Retry
        </button>
      </div>
    );
  }

  if (!display) {
    return (
      <div className="surface p-8 text-center text-[13px] text-ink-400">No patient data.</div>
    );
  }

  const patient = bundle?.patient;

  return (
    <div
      className={embedded ? "space-y-3" : "space-y-4"}
      data-testid="patient-profile-workspace"
    >
      {error && bundle == null ? (
        <div className="text-[12px] text-status-waitText bg-status-waitBg/40 border border-status-waitBorder rounded-sm px-3 py-2">
          Showing cached data — {error}
        </div>
      ) : null}

      {!embedded ? (
        <div className="surface p-5">
          <h2 className="text-[18px] font-heading font-semibold text-ink-900">{display.name}</h2>
          <p className="text-[12px] font-mono text-ink-400 mt-1">
            {patient?.mrn ?? display.id} · {display.phone}
          </p>
        </div>
      ) : null}

      {/* Local tabs — avoid Radix Tabs SSR useContext crash under Vite/Cloudflare. */}
      <div className="w-full">
        <div
          role="tablist"
          aria-label="Patient profile sections"
          className="flex w-full flex-wrap gap-1 rounded-sm bg-bone p-1"
        >
          {PROFILE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors",
                tab === t
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-800",
              )}
            >
              {t === "qr" ? "Patient ID" : t}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="surface mt-3 p-5">
          {tab === "overview" ? (
            <div className="space-y-4">
              <OverviewForm
                display={display}
                patient={patient}
                canEdit={canEditIdentity}
                saving={saving}
                onSave={onSaveOverview}
              />
            </div>
          ) : null}

          {tab === "contacts" ? (
            <ContactsPanel
              bundle={bundle}
              canEdit={canEditIdentity}
              resolvedId={resolvedId}
              onSaved={() => void reload()}
            />
          ) : null}

          {tab === "allergies" ? (
            <AllergiesPanel
              bundle={bundle}
              display={display}
              canEdit={canEditClinical}
              resolvedId={resolvedId}
              onSaved={() => void reload()}
            />
          ) : null}

          {tab === "history" ? (
            <HistoryPanel
              bundle={bundle}
              canEdit={canEditClinical}
              resolvedId={resolvedId}
              onSaved={() => void reload()}
            />
          ) : null}

          {tab === "consents" ? (
            <ConsentsPanel
              bundle={bundle}
              templates={templates}
              mode={mode}
              resolvedId={resolvedId}
              onSaved={() => void reload()}
            />
          ) : null}

          {tab === "documents" ? (
            <DocumentsPanel
              bundle={bundle}
              canUpload={canUploadDocs}
              resolvedId={resolvedId}
              onChanged={() => void reload()}
            />
          ) : null}

          {tab === "qr" ? (
            <div className="print:p-6" id="patient-qr-card">
              <p className="mb-4 text-[13px] text-ink-600">
                Hospital-scoped opaque QR for check-in. No PHI encoded in the barcode.
              </p>
              {qrSvg ? (
                <div
                  className="inline-block rounded-sm border border-ink-200 bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : bundle?.qr ? (
                <p className="font-mono text-[12px] text-ink-400">
                  Active token {bundle.qr.tokenPrefix}… — re-issue to print a new card.
                </p>
              ) : (
                <p className="text-[12px] text-ink-400">No active QR on file.</p>
              )}
              {canManageQr ? (
                <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                  <button type="button" onClick={() => void onIssueQr()} className="btn-primary h-9">
                    <RefreshCw className="h-4 w-4" />
                    {bundle?.qr ? "Rotate QR" : "Issue QR"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-ghost h-9 border border-ink-200"
                    disabled={!qrSvg && !bundle?.qr}
                  >
                    <Printer className="h-4 w-4" />
                    Print card
                  </button>
                </div>
              ) : null}
              {qrToken ? (
                <p className="mt-3 break-all font-mono text-[10px] text-ink-400 print:text-[8px]">
                  Token (store securely): {qrToken.slice(0, 24)}…
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OverviewForm({
  display,
  patient,
  canEdit,
  saving,
  onSave,
}: {
  display: SharedPatient;
  patient?: PatientProfileBundle["patient"];
  canEdit: boolean;
  saving: boolean;
  onSave: (p: UpdatePatientInput) => void;
}) {
  const [form, setForm] = useState({
    fullName: patient?.fullName ?? display.name,
    phone: patient?.phone ?? display.phone,
    email: patient?.email ?? display.email ?? "",
    dateOfBirth: patient?.dateOfBirth ?? display.dob ?? "",
    gender: patient?.gender ?? display.gender,
    bloodGroup: patient?.bloodGroup ?? display.bloodGroup ?? "",
    allergiesSummary: patient?.allergiesSummary ?? display.allergies,
  });

  useEffect(() => {
    setForm({
      fullName: patient?.fullName ?? display.name,
      phone: patient?.phone ?? display.phone,
      email: patient?.email ?? display.email ?? "",
      dateOfBirth: patient?.dateOfBirth ?? display.dob ?? "",
      gender: patient?.gender ?? display.gender,
      bloodGroup: patient?.bloodGroup ?? display.bloodGroup ?? "",
      allergiesSummary: patient?.allergiesSummary ?? display.allergies,
    });
  }, [patient, display]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(
        [
          ["fullName", "Full name"],
          ["phone", "Phone"],
          ["email", "Email"],
          ["dateOfBirth", "Date of birth"],
          ["gender", "Gender"],
          ["bloodGroup", "Blood group"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block">
          <span className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">{label}</span>
          <input
            disabled={!canEdit}
            className={`${inputCls} mt-1`}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            type={key === "dateOfBirth" ? "date" : "text"}
          />
        </label>
      ))}
      <label className="block md:col-span-2">
        <span className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
          Allergies summary
        </span>
        <input
          disabled={!canEdit}
          className={`${inputCls} mt-1`}
          value={form.allergiesSummary}
          onChange={(e) => setForm((f) => ({ ...f, allergiesSummary: e.target.value }))}
        />
      </label>
      {canEdit ? (
        <button
          type="button"
          disabled={saving}
          className="btn-primary h-9 md:col-span-2"
          onClick={() => onSave(form)}
        >
          {saving ? "Saving…" : "Save demographics"}
        </button>
      ) : null}
    </div>
  );
}

function ContactsPanel({
  bundle,
  canEdit,
  resolvedId,
  onSaved,
}: {
  bundle: PatientProfileBundle | null;
  canEdit: boolean;
  resolvedId: string;
  onSaved: () => void;
}) {
  const contacts = bundle?.emergencyContacts ?? [];
  const [draft, setDraft] = useState({
    fullName: "",
    phone: "",
    relation: "",
  });

  const save = async () => {
    const list = [
      ...contacts.map((c) => ({
        fullName: str(c.full_name),
        phone: str(c.phone),
        relation: str(c.relation) || undefined,
        isPrimary: Boolean(c.is_primary),
      })),
      ...(draft.fullName && draft.phone
        ? [{ fullName: draft.fullName, phone: draft.phone, relation: draft.relation, isPrimary: contacts.length === 0 }]
        : []),
    ];
    const res = await replaceEmergencyContacts(resolvedId, list);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Contacts updated");
    setDraft({ fullName: "", phone: "", relation: "" });
    onSaved();
  };

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <p className="text-[13px] text-ink-400">No emergency contacts on file.</p>
      ) : (
        <ul className="divide-y divide-ink-200">
          {contacts.map((c) => (
            <li key={str(c.id)} className="py-2 text-[13px]">
              <span className="font-medium text-ink-900">{str(c.full_name)}</span>
              <span className="text-ink-400 ml-2">
                {str(c.relation)} · {str(c.phone)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink-200">
          <input
            placeholder="Name"
            className={inputCls}
            value={draft.fullName}
            onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
          />
          <input
            placeholder="Phone"
            className={inputCls}
            value={draft.phone}
            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
          />
          <input
            placeholder="Relation"
            className={inputCls}
            value={draft.relation}
            onChange={(e) => setDraft((d) => ({ ...d, relation: e.target.value }))}
          />
          <button type="button" className="btn-primary h-9 col-span-3" onClick={() => void save()}>
            Save contacts
          </button>
        </div>
      ) : null}
      {bundle?.relationships?.length ? (
        <div className="pt-4 border-t border-ink-200">
          <p className="text-[11px] uppercase text-ink-400 font-mono mb-2">Family links</p>
          <ul className="text-[12px] text-ink-600 space-y-1">
            {bundle.relationships.map((r) => (
              <li key={str(r.id)}>
                {str(r.relation)} — {str(r.related_name ?? r.related_patient_id)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AllergiesPanel({
  bundle,
  display,
  canEdit,
  resolvedId,
  onSaved,
}: {
  bundle: PatientProfileBundle | null;
  display: SharedPatient;
  canEdit: boolean;
  resolvedId: string;
  onSaved: () => void;
}) {
  const rows = bundle?.allergies ?? [];
  const [substance, setSubstance] = useState("");

  const add = async () => {
    if (!substance.trim()) return;
    const res = await addAllergy(resolvedId, {
      substance: substance.trim(),
      severity: "unknown",
      status: "active",
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setSubstance("");
    toast.success("Allergy recorded");
    onSaved();
  };

  return (
    <div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-600">{display.allergies || "None documented."}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={str(a.id)} className="text-[13px] flex gap-2">
              <span className="font-medium">{str(a.substance)}</span>
              <span className="text-ink-400">{str(a.severity)}</span>
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <div className="flex gap-2 mt-4">
          <input
            className={inputCls}
            placeholder="Substance"
            value={substance}
            onChange={(e) => setSubstance(e.target.value)}
          />
          <button type="button" className="btn-primary h-9 shrink-0" onClick={() => void add()}>
            Add
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HistoryPanel({
  bundle,
  canEdit,
  resolvedId,
  onSaved,
}: {
  bundle: PatientProfileBundle | null;
  canEdit: boolean;
  resolvedId: string;
  onSaved: () => void;
}) {
  const rows = bundle?.history ?? [];
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"medical" | "surgical" | "family" | "social" | "other">(
    "medical",
  );

  const add = async () => {
    if (!title.trim()) return;
    const res = await addHistoryEntry(resolvedId, { category, title: title.trim() });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setTitle("");
    onSaved();
  };

  return (
    <div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-400">No structured history entries.</p>
      ) : (
        <ul className="divide-y divide-ink-200">
          {rows.map((h) => (
            <li key={str(h.id)} className="py-2 text-[13px]">
              <span className="text-[10px] uppercase font-mono text-ink-400 mr-2">
                {str(h.category)}
              </span>
              {str(h.title)}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <div className="flex flex-wrap gap-2 mt-4">
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            {["medical", "surgical", "family", "social", "other"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={`${inputCls} flex-1 min-w-[140px]`}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="button" className="btn-primary h-9" onClick={() => void add()}>
            Add entry
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ConsentsPanel({
  bundle,
  templates,
  mode,
  resolvedId,
  onSaved,
}: {
  bundle: PatientProfileBundle | null;
  templates: Array<Record<string, unknown>>;
  mode: "staff" | "self";
  resolvedId: string;
  onSaved: () => void;
}) {
  const rows = bundle?.consents ?? [];
  const [name, setName] = useState("");

  const sign = async (templateId?: string) => {
    const signedByName = name.trim() || "Patient";
    const res = await signConsent(resolvedId, {
      templateId,
      signedByName,
      signatureMethod: mode === "staff" ? "staff_witness" : "typed",
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Consent signed");
    onSaved();
  };

  const revoke = async (id: string) => {
    if (!window.confirm("Revoke this consent?")) return;
    const res = await revokeConsent(resolvedId, id, "Revoked from profile");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onSaved();
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-ink-200">
        {rows.length === 0 ? (
          <li className="py-4 text-[13px] text-ink-400">No consents on file.</li>
        ) : (
          rows.map((c) => (
            <li key={str(c.id)} className="py-3 flex justify-between gap-2 text-[13px]">
              <div>
                <div className="font-medium">{str(c.title)}</div>
                <div className="text-ink-400 text-[11px]">{str(c.status)}</div>
              </div>
              {c.status === "signed" ? (
                <button
                  type="button"
                  className="text-[12px] text-status-noshowText"
                  onClick={() => void revoke(str(c.id))}
                >
                  Revoke
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-ink-200 pt-4 space-y-2">
        <input
          className={inputCls}
          placeholder="Signed by (full name)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {templates.map((t) => (
          <button
            key={str(t.id)}
            type="button"
            className="w-full text-left h-9 px-3 text-[12px] border border-ink-200 rounded-sm hover:bg-bone"
            onClick={() => void sign(str(t.id))}
          >
            Sign: {str(t.title)}
          </button>
        ))}
        <button type="button" className="btn-primary h-9 w-full" onClick={() => void sign()}>
          Sign general treatment consent
        </button>
      </div>
    </div>
  );
}

function DocumentsPanel({
  bundle,
  canUpload,
  resolvedId,
  onChanged,
}: {
  bundle: PatientProfileBundle | null;
  canUpload: boolean;
  resolvedId: string;
  onChanged: () => void;
}) {
  const docs = (bundle?.documents ?? []).filter((d) => !d.archived_at);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadDocument(resolvedId, file, {
      title: file.name,
      category: "other",
    });
    if (!res.ok) {
      toast.error("Upload failed", { description: res.error });
      return;
    }
    toast.success("Document uploaded");
    onChanged();
  };

  const onDownload = async (id: string) => {
    const res = await downloadDocument(resolvedId, id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  };

  const onArchive = async (id: string) => {
    if (!window.confirm("Archive this document?")) return;
    const res = await archiveDocument(resolvedId, id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onChanged();
  };

  return (
    <div>
      {canUpload ? (
        <label className="flex items-center gap-2 h-10 px-3 border border-dashed border-ink-200 rounded-sm cursor-pointer hover:border-sage mb-4">
          <Upload className="w-4 h-4 text-ink-400" />
          <span className="text-[12px] text-ink-600">PDF or image · max 10 MB</span>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => void onUpload(e)}
          />
        </label>
      ) : null}
      {docs.length === 0 ? (
        <p className="text-[13px] text-ink-400 flex items-center gap-2">
          <FileText className="w-4 h-4" /> No documents.
        </p>
      ) : (
        <ul className="divide-y divide-ink-200">
          {docs.map((d) => (
            <li key={str(d.id)} className="py-2 flex items-center justify-between gap-2 text-[13px]">
              <span>{str(d.title)}</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  className="p-2 hover:bg-bone rounded-sm"
                  onClick={() => void onDownload(str(d.id))}
                  aria-label="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {canUpload ? (
                  <button
                    type="button"
                    className="p-2 hover:bg-bone rounded-sm text-status-noshowText"
                    onClick={() => void onArchive(str(d.id))}
                    aria-label="Archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
