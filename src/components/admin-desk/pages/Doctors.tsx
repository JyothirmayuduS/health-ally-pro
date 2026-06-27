import { Link } from "@tanstack/react-router";
import { loadServiceFees } from "@/lib/shared/services";
import { loadRoster } from "@/lib/admin-desk/doctorRosterData";
import { Stethoscope, Room, Clock, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { useMemo } from "react";

const AVATAR_BG: Record<string, string> = {
  "General Medicine": "bg-teal-soft text-teal",
  "Pediatrics": "bg-blue-50 text-blue-700",
  "Orthopedics": "bg-purple-50 text-purple-700",
  "Dermatology": "bg-orange-50 text-orange-700",
  "Cardiology": "bg-plum-soft text-plum",
};

export default function AdminDoctors() {
  const serviceFees = loadServiceFees();
  const roster = loadRoster();

  // Combine fee details with roster data to create rich doctor profiles
  const doctorProfiles = useMemo(() => {
    const todayDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    
    return serviceFees.map((sf) => {
      const rosterDoc = roster.find((r) => r.doctorId === sf.doctorId);
      const isWorkingToday = rosterDoc ? (rosterDoc.schedule[todayDay] !== "off" && rosterDoc.schedule[todayDay] !== "leave") : false;
      const todayShift = rosterDoc ? rosterDoc.schedule[todayDay] : "off";
      
      // Initials helper
      const names = sf.doctorName.replace("Dr. ", "").split(" ");
      const initials = names.map(n => n[0]).join("").slice(0, 2).toUpperCase();

      return {
        ...sf,
        room: rosterDoc?.room ?? "—",
        initials,
        shift: todayShift === "off" ? "Off Duty" : todayShift === "leave" ? "On Leave" : `${todayShift.charAt(0).toUpperCase() + todayShift.slice(1)} Shift`,
        onDuty: isWorkingToday,
      };
    });
  }, [serviceFees, roster]);

  return (
    <div className="space-y-6" data-testid="admin-doctors">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-bone/30 p-4 border border-ink-100 rounded-lg surface">
        <div className="text-[12.5px] text-ink-500">
          Viewing clinical staff registry and today's roster presence indicators.
        </div>
        <Link 
          to="/admin/services" 
          className="rounded-md border border-plum/20 bg-white px-3 py-1.5 text-[12px] font-medium text-plum hover:bg-plum-soft transition flex items-center gap-1 shrink-0"
        >
          Edit Consultation Fees
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of Doctor Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {doctorProfiles.map((doc) => (
          <div 
            key={doc.doctorId} 
            className="surface relative overflow-hidden p-5 border border-ink-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-plum group"
          >
            {/* On-Duty Glow Strip */}
            <div className={`absolute top-0 left-0 w-full h-1 ${doc.onDuty ? "bg-teal" : "bg-stone-300"}`} />

            <div className="flex items-start gap-4">
              {/* Doctor Avatar Block */}
              <div className={`h-12 w-12 rounded-full grid place-items-center font-heading font-bold text-sm shrink-0 border border-ink-200/50 ${AVATAR_BG[doc.specialty] || "bg-stone-100 text-ink-600"}`}>
                {doc.initials}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading font-semibold text-ink-950 text-[14.5px] leading-snug truncate group-hover:text-plum transition-colors">
                    {doc.doctorName}
                  </h3>
                  
                  {/* Status Indicator */}
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    doc.onDuty 
                      ? "bg-teal animate-pulse-dot" 
                      : "bg-stone-300"
                  }`} title={doc.onDuty ? "Available for Consultations" : "Offline"} />
                </div>
                
                <p className="text-[12.5px] text-ink-500 font-medium">{doc.specialty}</p>
                <p className="text-[11px] text-ink-400 font-mono">{doc.doctorId}</p>
              </div>
            </div>

            {/* Shift & Room Details */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-stone-100 text-[12px] text-ink-600">
              <div className="space-y-0.5">
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">Today's Shift</div>
                <div className={`font-semibold capitalize ${doc.onDuty ? "text-ink-800" : "text-ink-400 font-normal"}`}>
                  {doc.shift}
                </div>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-stone-100">
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">Consulting Room</div>
                <div className="font-semibold text-ink-800 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-ink-400 shrink-0" />
                  {doc.room}
                </div>
              </div>
            </div>

            {/* Fee badge */}
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-ink-400">Consultation Fee</span>
              <span className="font-mono font-semibold text-[17px] text-money bg-money-soft border border-money/10 rounded px-2.5 py-0.5">
                ₹{doc.fee.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
