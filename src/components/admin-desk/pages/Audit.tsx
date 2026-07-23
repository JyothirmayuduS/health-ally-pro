import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  created_at: string;
  actor_email?: string | null;
  actor_id?: string | null;
  action: string;
  resource?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  outcome?: string | null;
  ip?: string | null;
};

async function auditAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  try {
    const { getSession } = await import("@/lib/supabase/auth");
    const session = await getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    /* demo */
  }
  headers["x-medora-persist-demo"] = "1";
  return headers;
}

export default function AdminAuditExport() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ format: "json", limit: "200" });
      if (resource) q.set("resource", resource);
      const res = await fetch(`/api/hospital/audit?${q}`, {
        credentials: "same-origin",
        headers: await auditAuthHeaders(),
      });
      const data = (await res.json()) as { ok?: boolean; data?: AuditRow[]; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Could not load audit log");
        setRows([]);
        return;
      }
      setRows(data.data ?? []);
    } catch {
      toast.error("Audit export unavailable");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadCsv = async () => {
    try {
      const q = new URLSearchParams({ format: "csv", limit: "2000" });
      if (resource) q.set("resource", resource);
      const res = await fetch(`/api/hospital/audit?${q}`, {
        credentials: "same-origin",
        headers: await auditAuthHeaders(),
      });
      if (!res.ok) {
        toast.error("CSV export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medora-phi-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV export failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-audit">
      <div className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-plum-soft text-plum">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Compliance
            </div>
            <h3 className="font-heading text-[15px] font-semibold text-ink-950">
              PHI access audit
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-500">
              Who read or wrote specialty charts, doctors, units, and anatomy markers.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="rounded-md border border-ink-100 bg-white px-3 py-2 text-[12px]"
          >
            <option value="">All resources</option>
            <option value="specialty_chart_notes">Chart notes</option>
            <option value="hospital_doctors">Doctors</option>
            <option value="hospital_unit_records">Units</option>
            <option value="anatomy_markers">Anatomy</option>
            <option value="audit_logs">Audit exports</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-100 bg-white px-3 py-2 text-[12px] font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void downloadCsv()}
            className="inline-flex items-center gap-1.5 rounded-md bg-plum px-3 py-2 text-[12px] font-semibold text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="border-b border-ink-100 bg-bone/40 font-mono">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  When
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-400">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    No audit rows yet — clinical syncs will appear here.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-bone/30">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-ink-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-ink-800">
                      {r.actor_email || r.actor_id?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink-900">{r.action}</td>
                    <td className="px-4 py-2.5 text-ink-600">{r.resource || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          r.outcome === "denied" || r.outcome === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-teal-soft text-teal"
                        }`}
                      >
                        {r.outcome || "success"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-400">
                      {r.ip || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
