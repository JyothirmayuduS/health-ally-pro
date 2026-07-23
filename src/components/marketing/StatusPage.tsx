import { useEffect, useState } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";

type Check = { id: string; label: string; ok: boolean; optional?: boolean };
type StatusPayload = {
  ok: boolean;
  status: string;
  checkedAt: string;
  plan: string;
  checks: Check[];
};

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);

  useEffect(() => {
    void fetch("/api/status")
      .then((r) => r.json())
      .then((j) => setData(j as StatusPayload))
      .catch(() =>
        setData({
          ok: false,
          status: "unreachable",
          checkedAt: new Date().toISOString(),
          plan: "unknown",
          checks: [],
        }),
      );
  }, []);

  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <MarketingHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">System status</h1>
        <p className="mt-2 text-sm text-[#5C6B63]">
          Public health of Medora services. No PHI is exposed on this page.
        </p>
        <div className="mt-8 rounded-2xl border border-[#E8E4DE] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold capitalize">{data?.status ?? "Checking…"}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                data?.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {data?.ok ? "All required systems up" : "Degraded / checking"}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-[#8A8F8C]">
            Checked {data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : "—"} · plan{" "}
            {data?.plan ?? "—"}
          </p>
          <ul className="mt-6 space-y-3">
            {(data?.checks ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span>
                  {c.label}
                  {c.optional ? (
                    <span className="ml-2 text-[10px] uppercase text-[#8A8F8C]">optional</span>
                  ) : null}
                </span>
                <span className={c.ok ? "text-emerald-700" : "text-amber-700"}>
                  {c.ok ? "Operational" : "Not configured"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
