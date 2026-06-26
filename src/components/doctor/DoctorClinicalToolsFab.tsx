import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { DOCTOR_CLINICAL_TOOLS } from "@/lib/doctor-portal-nav";
import { shouldHideDoctorClinicalFab } from "@/lib/doctor-mobile-chrome";
import { cn } from "@/lib/utils";

export function DoctorClinicalToolsFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (shouldHideDoctorClinicalFab(pathname)) {
    return null;
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-label="Close tools menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2 lg:hidden">
        {open && (
          <div className="mb-1 w-48 overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-lg">
            {DOCTOR_CLINICAL_TOOLS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm font-semibold text-[#1B3B2E] hover:bg-[#FAF9F7]"
              >
                <Icon className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
                {label}
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-14 w-14 min-h-[44px] min-w-[44px] place-items-center rounded-full text-white shadow-[0_6px_20px_rgba(184,115,93,0.45)] transition-transform",
            open ? "bg-[#1B3B2E]" : "bg-[#B8735D]",
          )}
          aria-label={open ? "Close clinical tools" : "Clinical tools"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Plus className="h-6 w-6" strokeWidth={1.75} />}
        </button>
      </div>
    </>
  );
}
