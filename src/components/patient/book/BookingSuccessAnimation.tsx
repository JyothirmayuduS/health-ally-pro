/** Looping success visual — GIF-style motion via SVG + CSS (no external asset). */
export function BookingSuccessAnimation() {
  return (
    <div className="booking-success-anim relative mx-auto h-[168px] w-[168px] sm:h-[192px] sm:w-[192px]">
      <span className="booking-success-ring booking-success-ring--1" aria-hidden />
      <span className="booking-success-ring booking-success-ring--2" aria-hidden />
      <span className="booking-success-ring booking-success-ring--3" aria-hidden />

      {[
        { cls: "booking-confetti booking-confetti--1", delay: "0s" },
        { cls: "booking-confetti booking-confetti--2", delay: "0.4s" },
        { cls: "booking-confetti booking-confetti--3", delay: "0.8s" },
        { cls: "booking-confetti booking-confetti--4", delay: "1.1s" },
        { cls: "booking-confetti booking-confetti--5", delay: "0.6s" },
        { cls: "booking-confetti booking-confetti--6", delay: "1.4s" },
      ].map(({ cls, delay }) => (
        <span
          key={cls}
          className={cls}
          style={{ animationDelay: delay }}
          aria-hidden
        />
      ))}

      <div className="booking-success-badge relative z-10 grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#E8F3EE] via-white to-[#F7E7DC] shadow-[0_12px_40px_-12px_rgba(27,59,46,0.35)] ring-1 ring-[#2D6B4F]/15">
        <svg
          viewBox="0 0 96 96"
          className="h-[58%] w-[58%] text-[#2D6B4F]"
          aria-hidden
        >
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeOpacity="0.18"
            className="booking-success-orbit"
          />
          <path
            d="M30 48 L42 60 L66 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="booking-success-check"
          />
          <rect
            x="28"
            y="22"
            width="40"
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.12"
            className="booking-success-calendar"
          />
        </svg>
      </div>
    </div>
  );
}
