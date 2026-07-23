import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { salesMailto, SALES_CONTACT } from "@/lib/legal-content";

type Props = {
  active?: "home" | "product" | "pricing" | "security" | "sla";
};

export function MarketingHeader({ active }: Props) {
  const link = (id: Props["active"], to: string, label: string) => (
    <Link
      to={to}
      className={`hidden text-sm hover:text-[#1B3B2E] sm:inline ${
        active === id ? "font-semibold text-[#1B3B2E]" : "text-[#5C6B63]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="relative z-10 border-b border-[#E4DFD8]/80 bg-[#F4F1EC]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#1B3B2E]">Medora</span>
          <span className="hidden rounded-full bg-[#1B3B2E] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white sm:inline">
            Hospital OS
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          {link("product", "/for-hospitals", "Product")}
          {link("pricing", "/pricing", "Pricing")}
          {link("security", "/security", "Security")}
          {link("sla", "/sla", "SLA")}
          <a
            href={salesMailto("Medora hospital license inquiry")}
            className="hidden text-[#5C6B63] hover:text-[#1B3B2E] md:inline"
          >
            {SALES_CONTACT}
          </a>
          <Link
            to="/login"
            className="rounded-full border border-[#1B3B2E]/20 px-3 py-2 text-sm font-medium text-[#1B3B2E] hover:bg-white sm:px-4"
          >
            Staff login
          </Link>
          <Link
            to="/register-hospital"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1B3B2E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#244C3B] sm:px-4"
          >
            Start hospital
            <ArrowRight className="hidden h-3.5 w-3.5 sm:inline" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-[#E4DFD8] bg-[#F4F1EC] px-4 py-8 text-xs text-[#8A8F8C] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-sm text-[#1B3B2E]">Medora</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/for-hospitals" className="hover:text-[#1B3B2E]">
            Product
          </Link>
          <Link to="/pricing" className="hover:text-[#1B3B2E]">
            Pricing
          </Link>
          <Link to="/security" className="hover:text-[#1B3B2E]">
            Security
          </Link>
          <Link to="/sla" className="hover:text-[#1B3B2E]">
            SLA
          </Link>
          <Link to="/implement" className="hover:text-[#1B3B2E]">
            Implementation
          </Link>
          <Link to="/trust" className="hover:text-[#1B3B2E]">
            Trust pack
          </Link>
          <Link to="/status" className="hover:text-[#1B3B2E]">
            Status
          </Link>
          <Link to="/legal/baa" className="hover:text-[#1B3B2E]">
            BAA
          </Link>
          <Link to="/legal/terms" className="hover:text-[#1B3B2E]">
            Terms
          </Link>
          <Link to="/legal/privacy" className="hover:text-[#1B3B2E]">
            Privacy
          </Link>
          <Link to="/legal/disclaimer" className="hover:text-[#1B3B2E]">
            Disclaimer
          </Link>
          <Link to="/app" className="hover:text-[#1B3B2E]">
            Patient app
          </Link>
        </div>
      </div>
    </footer>
  );
}
