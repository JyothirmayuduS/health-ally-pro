import React, { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { listClinicQueue, type ClinicQueueEntry } from "@/lib/shared/clinic-queue";
import { getSharedPatient } from "@/lib/shared/patients";
import { ArrowLeft, Monitor, Volume2, Shield } from "lucide-react";

function useClock() {
  const [n, setN] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setN(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

export default function TokenBoard() {
  const { doctors } = useStore();
  const now = useClock();
  const [queue, setQueue] = useState<ClinicQueueEntry[]>([]);
  const [announcement, setAnnouncement] = useState("Welcome to Oakhaven Hospital. Please wait for your token to be called. Keep your physical slips ready.");

  // Fetch queue and announcement from localStorage
  const refreshData = () => {
    setQueue(listClinicQueue());
    const saved = localStorage.getItem("medora-reception-announcement-v1");
    if (saved) {
      setAnnouncement(saved);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for storage events in case announcement changes in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "medora-reception-announcement-v1") {
        refreshData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Now Serving entries (status: "in-consultation")
  const servingEntries = useMemo(() => {
    return queue.filter((entry) => entry.status === "in-consultation");
  }, [queue]);

  // Main Now Serving entry (most recent or first active)
  const mainServing = useMemo(() => {
    return servingEntries[0] || null;
  }, [servingEntries]);

  // Up Next entries (status: "waiting", limit to 3)
  const upNext = useMemo(() => {
    return queue.filter((entry) => entry.status === "waiting").slice(0, 3);
  }, [queue]);

  const patientInitialOnly = (patientId: string) => {
    const patient = getSharedPatient(patientId);
    if (!patient) return "P.";
    const firstName = patient.name.split(" ")[0];
    return firstName ? `${firstName[0]}.` : "P.";
  };

  const getDoctorDetails = (doctorId: string) => {
    const doc = doctors.find((d) => d.id === doctorId);
    return doc ? { name: doc.name, room: doc.room } : { name: "Medical Officer", room: "Triage" };
  };

  return (
    <div
      data-testid="token-board"
      className="min-h-screen bg-[#0d0e0c] text-white flex flex-col font-sans overflow-hidden select-none"
    >
      {/* Header */}
      <header className="px-10 py-6 bg-[#131512] border-b border-[#222521] flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-teal flex items-center justify-center shadow-lg shadow-teal/10">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#7c8279] font-mono font-semibold">
              Waiting Area Display
            </div>
            <div className="text-[26px] font-heading font-bold text-teal flex items-center gap-2">
              Oakhaven Hospital
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-6">
          <div>
            <div className="text-[44px] font-mono font-semibold leading-none tabular-nums text-white">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-[#7c8279] font-mono mt-1 font-medium">
              {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-8 p-10 overflow-hidden">
        {/* Left Column: Now Serving */}
        <section className="col-span-12 lg:col-span-8 flex flex-col justify-between">
          <div className="flex-1 bg-[#131512] border border-[#222521] rounded-sm p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-teal" />
            
            <div className="flex items-center justify-between">
              <span className="text-[12px] uppercase tracking-[0.2em] text-[#7c8279] font-mono font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-teal rounded-full animate-pulse" />
                Now Serving
              </span>
              {mainServing && (
                <span className="text-[11px] font-mono uppercase bg-[#1f231e] border border-[#2e352d] px-2.5 py-1 rounded-sm text-teal">
                  Live Clinic Queue
                </span>
              )}
            </div>

            {mainServing ? (
              <div className="my-auto py-6 flex flex-col items-center justify-center text-center">
                <div
                  className="font-mono font-bold leading-none tracking-tight text-teal text-shadow"
                  style={{ fontSize: "clamp(120px, 18vw, 240px)" }}
                >
                  #{mainServing.tokenNumber}
                </div>
                
                <div className="mt-8 space-y-2">
                  <div className="text-[28px] text-[#e3e8e2] font-semibold flex items-center justify-center gap-2">
                    Patient: <span className="font-mono text-white text-[32px] bg-[#1a1e19] px-4 py-1 border border-[#2e352d] rounded-sm">{patientInitialOnly(mainServing.patientId)}</span>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-[#222521] flex justify-center gap-12 text-left">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#7c8279] font-mono">Doctor</div>
                      <div className="text-[22px] font-medium text-[#e3e8e2] mt-1">{getDoctorDetails(mainServing.doctorId).name}</div>
                    </div>
                    <div className="border-l border-[#222521] pl-12">
                      <div className="text-[11px] uppercase tracking-wider text-[#7c8279] font-mono">Room / Cabin</div>
                      <div className="text-[22px] font-bold text-teal mt-1">Room {getDoctorDetails(mainServing.doctorId).room}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto py-12 text-center">
                <div className="font-mono text-[#2c3029] text-[180px] leading-none">—</div>
                <div className="text-[15px] uppercase tracking-[0.2em] text-[#7c8279] font-mono font-semibold mt-3">
                  All patients currently called
                </div>
              </div>
            )}
            
            <div className="text-[11.5px] text-[#555d51] flex items-center justify-between border-t border-[#222521] pt-4 font-mono">
              <span>* Private board. Displays first name initial only.</span>
              <span>Screen ID: TV-LOBBY-01</span>
            </div>
          </div>
        </section>

        {/* Right Column: Up Next */}
        <section className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <div className="flex-1 bg-[#131512] border border-[#222521] rounded-sm p-6 flex flex-col shadow-lg">
            <div className="text-[12px] uppercase tracking-[0.2em] text-[#7c8279] font-mono font-bold pb-4 border-b border-[#222521] mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-teal" />
              Queue · Up Next
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {upNext.map((entry, idx) => {
                const doc = getDoctorDetails(entry.doctorId);
                return (
                  <div
                    key={entry.id}
                    className="p-4 bg-[#1b1e1a] border border-[#2e352d] rounded-sm flex items-center justify-between relative overflow-hidden group shadow-sm hover:border-teal/30 transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7c8279]" />
                    <div className="pl-2">
                      <div className="text-[11px] uppercase tracking-wider text-[#7c8279] font-mono">
                        Position #{idx + 1}
                      </div>
                      <div className="text-[20px] font-mono font-bold text-white mt-1">
                        Patient {patientInitialOnly(entry.patientId)}
                      </div>
                      <div className="text-[12.5px] text-[#e3e8e2] mt-1 truncate max-w-[200px]">
                        {doc.name} · <span className="font-semibold text-teal">Room {doc.room}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[36px] font-mono font-bold text-teal tabular-nums">
                        #{entry.tokenNumber}
                      </div>
                      <div className="text-[10px] text-[#7c8279] font-mono mt-0.5">
                        {entry.checkInTime} check-in
                      </div>
                    </div>
                  </div>
                );
              })}

              {upNext.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#2e352d] rounded-sm my-4">
                  <div className="text-[#3c4238] font-mono text-[64px]">—</div>
                  <div className="text-[13px] text-[#7c8279] uppercase tracking-wider font-mono font-medium mt-2">
                    Lobby queue empty
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#222521] flex justify-between items-center text-[12px] font-mono text-[#7c8279]">
              <Link
                to="/reception"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#2e352d] hover:bg-[#1b1e1a] hover:text-white rounded-sm transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
              </Link>
              <span>{queue.length} Total in Queue</span>
            </div>
          </div>
        </section>
      </main>

      {/* Marquee Ticker */}
      <footer className="h-16 bg-teal text-white flex items-center shrink-0 border-t border-[#204a3e] relative overflow-hidden select-none">
        <div className="px-6 h-full bg-[#18392f] border-r border-[#204a3e] z-10 flex items-center justify-center gap-2 shrink-0">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-mono font-bold whitespace-nowrap">Announcements</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-marquee whitespace-nowrap text-[17px] font-medium tracking-wide pr-[100%] flex items-center font-mono">
            {announcement} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &bull; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {announcement}
          </div>
        </div>
      </footer>
    </div>
  );
}
