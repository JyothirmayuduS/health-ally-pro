import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from "react";
import type { BodyMarker } from "@/lib/shared/body-anatomy";
import type { AnatomyView } from "@/lib/shared/body-anatomy";
import type { ViewPreset } from "@/lib/shared/anatomy-systems";
import { cn } from "@/lib/utils";

const ZAnatomy3DViewer = lazy(() =>
  import("@/components/clinical/ZAnatomy3DViewer").then((m) => ({ default: m.ZAnatomy3DViewer })),
);

export type BodyAnatomyMarkerProps = {
  markers: BodyMarker[];
  onChange?: (markers: BodyMarker[]) => void;
  readOnly?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  initialView?: AnatomyView;
  initialPreset?: ViewPreset;
  cameraTarget?: [number, number, number];
  cameraDistance?: number;
  focusKeywords?: string[];
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

class AnatomyErrorBoundary extends Component<
  { children: ReactNode; className?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section
          className={cn(
            "flex h-[min(40vh,280px)] items-center justify-center rounded-[20px] border border-[#FCE8E6] bg-[#FDF6F5] p-6 text-center",
            this.props.className,
          )}
        >
          <div>
            <p className="text-sm font-semibold text-[#C45C4A]">3D anatomy unavailable</p>
            <p className="mt-1 text-xs text-[#8A8F8C]">
              WebGL failed to start on this device. Clinical charting still works without the model.
            </p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export function BodyAnatomyMarker({
  markers,
  onChange,
  readOnly = false,
  className,
  title,
  subtitle,
  initialView,
  initialPreset,
  cameraTarget,
  cameraDistance,
  focusKeywords,
}: BodyAnatomyMarkerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingShell className={className} />;
  }

  return (
    <AnatomyErrorBoundary className={className}>
      <Suspense fallback={<LoadingShell className={className} />}>
        <ZAnatomy3DViewer
          markers={markers}
          onChange={onChange}
          readOnly={readOnly}
          className={className}
          title={title}
          subtitle={subtitle}
          initialView={initialView}
          initialPreset={initialPreset}
          cameraTarget={cameraTarget}
          cameraDistance={cameraDistance}
          focusKeywords={focusKeywords}
        />
      </Suspense>
    </AnatomyErrorBoundary>
  );
}
