import type { BodyMarker } from "@/lib/shared/body-anatomy";

export type AnatomySystem = "bone" | "muscle" | "nerve" | "vessel";

export const ANATOMY_SYSTEMS: { id: AnatomySystem; label: string; color: string }[] = [
  { id: "bone", label: "Bones", color: "#F5F0E8" },
  { id: "muscle", label: "Muscles", color: "#B85C52" },
  { id: "nerve", label: "Nerves", color: "#F9D71C" },
  { id: "vessel", label: "Vessels", color: "#D32F2F" },
];

export type SystemVisibility = Record<AnatomySystem, boolean>;

export const DEFAULT_SYSTEM_VISIBILITY: SystemVisibility = {
  bone: true,
  muscle: true,
  nerve: false,
  vessel: false,
};

export type ViewPreset = "surface" | "skeleton" | "vascular" | "nervous" | "inside";

export const VIEW_PRESETS: {
  id: ViewPreset;
  label: string;
  visibility: SystemVisibility;
  xrayMuscles?: boolean;
}[] = [
  {
    id: "surface",
    label: "Body",
    visibility: { bone: true, muscle: true, nerve: false, vessel: false },
  },
  {
    id: "skeleton",
    label: "Skeleton",
    visibility: { bone: true, muscle: false, nerve: false, vessel: false },
  },
  {
    id: "vascular",
    label: "Blood flow",
    visibility: { bone: true, muscle: false, nerve: false, vessel: true },
  },
  {
    id: "nervous",
    label: "Nerves",
    visibility: { bone: true, muscle: false, nerve: true, vessel: false },
  },
  {
    id: "inside",
    label: "Inside",
    visibility: { bone: true, muscle: false, nerve: true, vessel: true },
    xrayMuscles: true,
  },
];

export type TubeDef = {
  id: string;
  label: string;
  system: "nerve" | "vessel";
  vesselKind?: "artery" | "vein";
  points: [number, number, number][];
  radius: number;
};

export const TUBE_DEFS: TubeDef[] = [
  {
    id: "aorta",
    label: "Aorta",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.008,
    points: [
      [0.02, 0.45, 0.04],
      [0.02, 0.3, 0.05],
      [0.01, 0.15, 0.05],
      [0, 0, 0.04],
      [0, -0.15, 0.03],
    ],
  },
  {
    id: "vena-cava",
    label: "Vena cava",
    system: "vessel",
    vesselKind: "vein",
    radius: 0.009,
    points: [
      [-0.03, 0.38, -0.01],
      [-0.03, 0.22, 0],
      [-0.02, 0.05, 0.01],
      [-0.02, -0.12, 0.01],
    ],
  },
  {
    id: "carotid-l",
    label: "Left carotid",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.004,
    points: [
      [-0.03, 0.52, 0.05],
      [-0.04, 0.62, 0.06],
      [-0.045, 0.7, 0.05],
    ],
  },
  {
    id: "carotid-r",
    label: "Right carotid",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.004,
    points: [
      [0.03, 0.52, 0.05],
      [0.04, 0.62, 0.06],
      [0.045, 0.7, 0.05],
    ],
  },
  {
    id: "subclavian-l",
    label: "Left subclavian artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [-0.02, 0.44, 0.04],
      [-0.08, 0.53, 0.06],
      [-0.15, 0.5, 0.05],
    ],
  },
  {
    id: "subclavian-r",
    label: "Right subclavian artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [0.02, 0.44, 0.04],
      [0.08, 0.53, 0.06],
      [0.15, 0.5, 0.05],
    ],
  },
  {
    id: "axillary-l",
    label: "Left axillary artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [-0.15, 0.5, 0.05],
      [-0.2, 0.38, 0.04],
      [-0.22, 0.28, 0.03],
    ],
  },
  {
    id: "axillary-r",
    label: "Right axillary artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [0.15, 0.5, 0.05],
      [0.2, 0.38, 0.04],
      [0.22, 0.28, 0.03],
    ],
  },
  {
    id: "renal-l",
    label: "Left renal artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [-0.02, 0.2, 0.02],
      [-0.05, 0.08, 0.02],
      [-0.06, -0.05, 0.01],
    ],
  },
  {
    id: "renal-r",
    label: "Right renal artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [0.02, 0.2, 0.02],
      [0.05, 0.08, 0.02],
      [0.06, -0.05, 0.01],
    ],
  },
  {
    id: "iliac-l",
    label: "Left iliac artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [0, -0.04, 0.04],
      [-0.08, -0.18, 0.05],
      [-0.1, -0.35, 0.04],
    ],
  },
  {
    id: "iliac-r",
    label: "Right iliac artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [0, -0.04, 0.04],
      [0.08, -0.18, 0.05],
      [0.1, -0.35, 0.04],
    ],
  },
  {
    id: "brachial-l",
    label: "Brachial plexus (L)",
    system: "nerve",
    radius: 0.004,
    points: [
      [0, 0.5, 0.02],
      [-0.1, 0.42, 0.04],
      [-0.18, 0.32, 0.05],
      [-0.24, 0.18, 0.03],
    ],
  },
  {
    id: "brachial-r",
    label: "Brachial plexus (R)",
    system: "nerve",
    radius: 0.004,
    points: [
      [0, 0.5, 0.02],
      [0.1, 0.42, 0.04],
      [0.18, 0.32, 0.05],
      [0.24, 0.18, 0.03],
    ],
  },
  {
    id: "ulnar-l",
    label: "Left ulnar nerve",
    system: "nerve",
    radius: 0.0035,
    points: [
      [-0.24, 0.18, 0.03],
      [-0.26, 0.05, 0.02],
      [-0.28, -0.12, 0.02],
    ],
  },
  {
    id: "ulnar-r",
    label: "Right ulnar nerve",
    system: "nerve",
    radius: 0.0035,
    points: [
      [0.24, 0.18, 0.03],
      [0.26, 0.05, 0.02],
      [0.28, -0.12, 0.02],
    ],
  },
  {
    id: "radial-l",
    label: "Left radial nerve",
    system: "nerve",
    radius: 0.0035,
    points: [
      [-0.18, 0.32, 0.05],
      [-0.2, 0.15, 0.04],
      [-0.22, -0.02, 0.03],
    ],
  },
  {
    id: "radial-r",
    label: "Right radial nerve",
    system: "nerve",
    radius: 0.0035,
    points: [
      [0.18, 0.32, 0.05],
      [0.2, 0.15, 0.04],
      [0.22, -0.02, 0.03],
    ],
  },
  {
    id: "sciatic-r",
    label: "Sciatic nerve (R)",
    system: "nerve",
    radius: 0.005,
    points: [
      [0, 0, -0.03],
      [0.07, -0.18, -0.02],
      [0.09, -0.38, -0.01],
      [0.08, -0.62, 0],
    ],
  },
  {
    id: "femoral-l",
    label: "Femoral artery (L)",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [0, -0.05, 0.05],
      [-0.07, -0.22, 0.06],
      [-0.08, -0.45, 0.05],
    ],
  },
  {
    id: "femoral-r",
    label: "Femoral artery (R)",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.005,
    points: [
      [0, -0.05, 0.05],
      [0.07, -0.22, 0.06],
      [0.08, -0.45, 0.05],
    ],
  },
  {
    id: "popliteal-l",
    label: "Left popliteal artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [-0.08, -0.45, 0.05],
      [-0.08, -0.55, 0.04],
      [-0.08, -0.65, 0.03],
    ],
  },
  {
    id: "popliteal-r",
    label: "Right popliteal artery",
    system: "vessel",
    vesselKind: "artery",
    radius: 0.0045,
    points: [
      [0.08, -0.45, 0.05],
      [0.08, -0.55, 0.04],
      [0.08, -0.65, 0.03],
    ],
  },
];

export function classifyAtlasMesh(name: string, userDataType?: string): AnatomySystem {
  const t = (userDataType ?? "").toLowerCase();
  if (t === "muscle") return "muscle";
  if (t === "bone") return "bone";
  const n = name.toLowerCase();
  if (n.includes("muscle") || n.includes("m.")) return "muscle";
  if (n.includes("nerve") || n.includes("n.")) return "nerve";
  if (n.includes("arter") || n.includes("vein") || n.includes("vessel")) return "vessel";
  return "bone";
}
