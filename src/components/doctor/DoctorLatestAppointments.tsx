import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { latestVisitDoctors } from "@/lib/doctor-mock-data";

function SectionArrow() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#8A8F8C] shadow-sm">
      <ArrowUpRight className="h-4 w-4" />
    </span>
  );
}

export function DoctorLatestAppointments() {
  return (
    <div className="flex h-full min-h-[480px] flex-col rounded-[28px] bg-[#F0DDD6] p-6 shadow-[0_4px_20px_rgba(28,42,46,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3B2E]">Latest Appointments</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#8A8F8C]">
            Stay updated on your last healthcare visit.
          </p>
        </div>
        <SectionArrow />
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {latestVisitDoctors.map((doc) => (
          <li key={doc.id}>
            <Link
              to="/doctor/schedule"
              className="group flex items-center gap-3.5 rounded-[20px] bg-white/75 p-3.5 transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              <img
                src={doc.photoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#1B3B2E]">{doc.name}</p>
                <p className="truncate text-xs text-[#8A8F8C]">
                  {doc.specialty} · {doc.date}
                </p>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#8A8F8C] shadow-sm group-hover:text-[#1B3B2E]">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
