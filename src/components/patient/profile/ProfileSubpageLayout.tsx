import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ProfileSubpageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-4xl lg:pb-12">
      <Link
        to="/profile"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink sm:mb-6"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        Profile
      </Link>
      <header className="mb-6">
        <h1 className="font-serif text-[28px] text-ink sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-ink-muted">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}
