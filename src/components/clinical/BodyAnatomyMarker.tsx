import { lazy, Suspense, useEffect, useState } from "react";
import type { BodyMarker } from "@/lib/shared/body-anatomy";
import { cn } from "@/lib/utils";

const ZAnatomy3DViewer = lazy(() =>
  import("@/components/clinical/ZAnatomy3DViewer").then((m) => ({ default: m.ZAnatomy3DViewer })),
);

type Props = {
  markers: BodyMarker[];
  onChange?: (markers: BodyMarker[]) => void;
  readOnly?: boolean;
  className?: string;
};

function LoadingShell({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex h-[min(52vh,380px)] min-h-[260px] items-center justify-center rounded-[20px] border border-[#EDEAE6] bg-[#F7FAF6]",
        className,
      )}
    >
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1B3B2E] border-t-transparent" />
        <p className="mt-3 text-xs font-medium text-[#8A8F8C]">Loading 3D anatomy model…</p>
      </div>
    </section>
  );
}

export function BodyAnatomyMarker({ markers, onChange, readOnly = false, className }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingShell className={className} />;
  }

  return (
    <Suspense fallback={<LoadingShell className={className} />}>
      <ZAnatomy3DViewer
        markers={markers}
        onChange={onChange}
        readOnly={readOnly}
        className={className}
      />
    </Suspense>
  );
}
