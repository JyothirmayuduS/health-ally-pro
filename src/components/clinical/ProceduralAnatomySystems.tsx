import { useMemo } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TUBE_DEFS, type SystemVisibility, type TubeDef } from "@/lib/shared/anatomy-systems";
import type { BodyMarker } from "@/lib/shared/body-anatomy";

type PickHandler = (regionId: string, label: string, meshType: string) => void;

function tubeColor(def: TubeDef): string {
  if (def.system === "nerve") return "#FDD835";
  return def.vesselKind === "vein" ? "#1E88E5" : "#E53935";
}

function TubePath({
  def,
  visible,
  marked,
  hovered,
  readOnly,
  onPick,
  onHover,
}: {
  def: TubeDef;
  visible: boolean;
  marked: boolean;
  hovered: boolean;
  readOnly: boolean;
  onPick: PickHandler;
  onHover: (label: string | null) => void;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(def.points.map((p) => new THREE.Vector3(...p))),
    [def.points],
  );
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 32, def.radius, 10, false), [curve, def.radius]);

  if (!visible) return null;

  return (
    <mesh
      geometry={geometry}
      renderOrder={20}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!readOnly) onPick(def.id, def.label, def.system);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(def.label);
        document.body.style.cursor = readOnly ? "grab" : "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "default";
      }}
    >
      <meshStandardMaterial
        color={tubeColor(def)}
        emissive={marked ? "#FF1744" : hovered ? "#1B3B2E" : "#000000"}
        emissiveIntensity={marked ? 0.6 : hovered ? 0.3 : 0}
        roughness={0.3}
        metalness={0.1}
        depthTest={false}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

type Props = {
  visibility: SystemVisibility;
  markers: BodyMarker[];
  hoveredId: string | null;
  readOnly: boolean;
  onPick: PickHandler;
  onHover: (label: string | null) => void;
};

export function CirculatoryAndNervousSystems({ visibility, markers, hoveredId, readOnly, onPick, onHover }: Props) {
  const markedIds = useMemo(() => new Set(markers.map((m) => m.regionId)), [markers]);

  return (
    <group>
      {TUBE_DEFS.map((tube) => (
        <TubePath
          key={tube.id}
          def={tube}
          visible={tube.system === "nerve" ? visibility.nerve : visibility.vessel}
          marked={markedIds.has(tube.id)}
          hovered={hoveredId === tube.id}
          readOnly={readOnly}
          onPick={onPick}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
