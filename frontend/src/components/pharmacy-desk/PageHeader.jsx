import React from "react";
import GlobalSearchBar from "./GlobalSearchBar";
import { classNames } from "@/lib/pharmacy-desk/utils";

export default function PageHeader({ title, subtitle, actions, children, hideSearch = false, dataTestId }) {
  return (
    <header
      data-testid={dataTestId || "page-header"}
      className="sticky top-0 z-10 bg-background/85 backdrop-blur-md border-b border-border/70"
    >
      <div className="max-w-[1500px] mx-auto px-8 pt-6 pb-4">
        <div className="flex items-end gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[32px] leading-[1.05] text-[hsl(var(--ink))]">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[13px] text-muted-foreground max-w-xl">{subtitle}</p>}
          </div>
          {!hideSearch && (
            <div className="hidden md:flex items-center shrink-0">
              <GlobalSearchBar />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
      {children && <div className={classNames("max-w-[1500px] mx-auto px-8 pb-3")}>{children}</div>}
    </header>
  );
}
