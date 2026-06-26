import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { ArrowLeft, Maximize2, Volume2 } from "lucide-react";

function useClock() {
  const [n, setN] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setN(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

export default function TokenDisplay() {
  const { appointments, doctors, patients } = useStore();
  const now = useClock();

  const columns = useMemo(() => {
    return doctors
      .filter((d) => d.onDuty)
      .map((d) => {
        const docApts = appointments
          .filter(
            (a) =>
              a.date === TODAY_STR &&
              a.doctorId === d.id &&
              (a.status === "checked-in" || a.status === "in-progress"),
          )
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
        const current = docApts.find((a) => a.status === "in-progress");
        const upcoming = docApts.filter((a) => a.status === "checked-in").slice(0, 4);
        return { doctor: d, current, upcoming };
      });
  }, [doctors, appointments]);

  const totalServing = columns.filter((c) => c.current).length;

  const goFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <div
      data-testid="token-display"
      className="kiosk-bg min-h-screen text-white flex flex-col"
      style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="px-10 pt-8 pb-6 flex items-center justify-between border-b border-[#2a2c27]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-sage flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#7a7d75] font-mono">
              Maple Hospital · Reception
            </div>
            <div className="text-[26px] font-semibold leading-tight">Waiting room display</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[60px] font-mono leading-none tabular-nums">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-[12px] mt-1 uppercase tracking-[0.2em] text-[#7a7d75] font-mono">
            {now.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-10 py-8">
        {columns.map(({ doctor, current, upcoming }) => {
          const cur = current ? patients.find((p) => p.id === current.patientId) : null;
          return (
            <section
              key={doctor.id}
              data-testid={`token-col-${doctor.id}`}
              className="kiosk-card rounded-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 pt-5 pb-4 border-b border-[#2a2c27]">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#7a7d75] font-mono">
                  Room {doctor.room} · {doctor.specialty}
                </div>
                <div className="text-[22px] font-semibold mt-1">{doctor.name}</div>
              </div>

              <div className="flex-1 px-6 py-7 flex flex-col items-center justify-center text-center">
                {current ? (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[#7a7d75] font-mono mb-2">
                      Now serving
                    </div>
                    <div
                      className="font-mono font-semibold tabular-nums leading-none text-[#a7d3c3]"
                      style={{ fontSize: "clamp(96px, 14vw, 168px)" }}
                    >
                      #{current.tokenNumber}
                    </div>
                    <div className="mt-4 text-[18px] text-white/85">
                      {cur?.name?.replace(/(\S+)\s+(\S).*/, "$1 $2.") || ""}
                    </div>
                  </>
                ) : (
                  <div className="py-8">
                    <div className="font-mono text-[#3e413a] text-[120px] leading-none">—</div>
                    <div className="text-[14px] uppercase tracking-[0.2em] text-[#7a7d75] font-mono mt-3">
                      Awaiting next
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[#2a2c27]">
                <div className="text-[10.5px] uppercase tracking-[0.2em] text-[#7a7d75] font-mono mb-2">
                  Next up
                </div>
                <div className="flex flex-wrap gap-2">
                  {upcoming.length === 0 && (
                    <div className="text-[13px] text-[#5a5d56]">— none —</div>
                  )}
                  {upcoming.map((a) => (
                    <span
                      key={a.id}
                      className="px-2.5 py-1 text-[14px] font-mono tabular-nums rounded-sm bg-[#1f211d] border border-[#2a2c27] text-white/80"
                    >
                      #{a.tokenNumber}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="px-10 py-5 border-t border-[#2a2c27] flex items-center justify-between text-[12px] font-mono">
        <div className="text-[#7a7d75]">
          {totalServing} doctor{totalServing === 1 ? "" : "s"} currently serving ·{" "}
          {columns.reduce((s, c) => s + c.upcoming.length, 0)} waiting
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="token-fullscreen"
            onClick={goFullscreen}
            className="h-9 px-3 inline-flex items-center gap-2 text-[#cfd3c9] hover:text-white hover:bg-[#1f211d] rounded-sm border border-[#2a2c27]"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Full screen
          </button>
          <Link
            to="/reception"
            data-testid="token-back"
            className="h-9 px-3 inline-flex items-center gap-2 text-[#cfd3c9] hover:text-white hover:bg-[#1f211d] rounded-sm border border-[#2a2c27]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to console
          </Link>
        </div>
      </footer>
    </div>
  );
}
