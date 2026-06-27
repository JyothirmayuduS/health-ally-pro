import { useMemo } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TUBE_DEFS, type SystemVisibility, type TubeDef } from "@/lib/shared/anatomy-systems";
import type { BodyMarker } from "@/lib/shared/body-anatomy";

type PickHandler = (regionId: string, label: string, meshType: string) => void;

function tubeColor(def: TubeDef): string {
  if (def.system === "nerve") return "#F7C400";
  return def.vesselKind === "vein" ? "#1565C0" : "#D32F2F";
}

function TubePath({
  def,
  visible,
  marked,
  hovered,
  readOnly,
  onPick,
  onHover,
  onHoverId,
}: {
  def: TubeDef;
  visible: boolean;
  marked: boolean;
  hovered: boolean;
  readOnly: boolean;
  onPick: PickHandler;
  onHover: (label: string | null) => void;
  onHoverId: (id: string | null) => void;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(def.points.map((p) => new THREE.Vector3(...p))),
    [def.points],
  );
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 128, def.radius, 24, false),
    [curve, def.radius],
  );

  if (!visible) return null;

  const isNerve = def.system === "nerve";
  const baseOpacity = marked ? 0.96 : hovered ? 0.88 : isNerve ? 0.9 : 0.78;
  const transmission = isNerve ? 0.06 : 0.45;

  return (
    <mesh
      geometry={geometry}
      renderOrder={20}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!readOnly) onPick(def.id, def.label, def.system);
      }}
    >
      <meshPhysicalMaterial
        color={tubeColor(def)}
        emissive={marked ? "#FF5C6A" : hovered ? "#FFF8E8" : "#000000"}
        emissiveIntensity={marked ? 0.36 : hovered ? 0.18 : 0}
        roughness={0.22}
        metalness={0.04}
        transmission={transmission}
        ior={1.36}
        clearcoat={0.52}
        clearcoatRoughness={0.18}
        thickness={0.24}
        side={THREE.FrontSide}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
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

export function CirculatoryAndNervousSystems({
  visibility,
  markers,
  hoveredId,
  readOnly,
  onPick,
  onHover,
  onHoverId,
}: Props & { onHoverId: (id: string | null) => void }) {
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
          onHoverId={onHoverId}
        />
      ))}
    </group>
  );
}
