import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LEGAL_CONTACT, LEGAL_ENTITY, LEGAL_LAST_UPDATED, SALES_CONTACT } from "@/lib/legal-content";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#F7F5F2] text-[#1B3B2E]">
      <header className="border-b border-[#E8E4DE] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/for-hospitals" className="font-serif text-xl font-semibold text-[#1B3B2E]">
            Medora
          </Link>
          <nav className="flex gap-4 text-xs font-medium text-[#5C6B63]">
            <Link to="/legal/terms" className="hover:text-[#1B3B2E]">
              Terms
            </Link>
            <Link to="/legal/privacy" className="hover:text-[#1B3B2E]">
              Privacy
            </Link>
            <Link to="/legal/disclaimer" className="hover:text-[#1B3B2E]">
              Disclaimer
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8F8C]">
          {LEGAL_ENTITY} · Updated {LEGAL_LAST_UPDATED}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3D4A44]">{children}</div>
        <p className="mt-10 text-xs text-[#8A8F8C]">
          {LEGAL_CONTACT} · {SALES_CONTACT}
        </p>
      </main>
    </div>
  );
}
