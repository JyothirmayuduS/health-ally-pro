import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onScan: (token: string) => void;
  className?: string;
};

export function QrScanner({ onScan, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manual, setManual] = useState("");
  const [cameraOk, setCameraOk] = useState(false);
  const rafRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }
    let cancelled = false;
    const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setCameraOk(true);
        }
        if (!hasDetector) {
          toast.message("Camera preview only", {
            description: "Enter token manually or use a browser with BarcodeDetector.",
          });
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) {
              onScan(String(raw).trim());
              stopCamera();
              setMode("manual");
              return;
            }
          } catch {
            /* frame skip */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        toast.error("Camera unavailable");
        setMode("manual");
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode, onScan, stopCamera]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const t = manual.trim();
    if (t.length < 16) {
      toast.error("Enter a valid patient QR token");
      return;
    }
    onScan(t);
    setManual("");
  };

  return (
    <div className={`space-y-3 ${className}`} data-testid="qr-scanner">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 h-9 text-[12px] font-medium rounded-sm border ${
            mode === "manual"
              ? "border-sage bg-sage-soft text-sage"
              : "border-ink-200 bg-white text-ink-600"
          }`}
        >
          <Keyboard className="w-3.5 h-3.5 inline mr-1.5" />
          Manual token
        </button>
        <button
          type="button"
          onClick={() => setMode("camera")}
          className={`flex-1 h-9 text-[12px] font-medium rounded-sm border ${
            mode === "camera"
              ? "border-sage bg-sage-soft text-sage"
              : "border-ink-200 bg-white text-ink-600"
          }`}
        >
          <Camera className="w-3.5 h-3.5 inline mr-1.5" />
          Scan QR
        </button>
      </div>
      {mode === "camera" ? (
        <div className="relative aspect-video bg-ink-900 rounded-sm overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!cameraOk ? (
            <div className="absolute inset-0 grid place-items-center text-white/80 text-[12px]">
              Starting camera…
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submitManual} className="flex gap-2">
          <input
            data-testid="qr-manual-input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste mq_… token"
            className="flex-1 h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage font-mono"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary h-9 px-4 text-[12px]">
            Resolve
          </button>
        </form>
      )}
    </div>
  );
}
