export function MedoraLogo({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-[#D4F064] shadow-[0_2px_8px_rgba(212,240,100,0.4)] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[55%] w-[55%]" fill="none" aria-hidden>
        <path
          d="M16 6c-1.2 0-2.2.5-3 1.3-.8-.8-1.8-1.3-3-1.3-2.5 0-4.5 2.2-4.5 4.8 0 3.2 2.8 5.8 7.5 10.2 4.7-4.4 7.5-7 7.5-10.2C20.5 8.2 18.5 6 16 6z"
          fill="#1C2A2E"
        />
        <path
          d="M10 14c-1.5 1.2-2.5 2.8-2.5 4.2 0 2.2 2 4 4.5 4s4.5-1.8 4.5-4c0-1.4-1-3-2.5-4.2"
          fill="#1C2A2E"
          opacity="0.85"
        />
        <path
          d="M22 14c1.5 1.2 2.5 2.8 2.5 4.2 0 2.2-2 4-4.5 4s-4.5-1.8-4.5-4c0-1.4 1-3 2.5-4.2"
          fill="#1C2A2E"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
