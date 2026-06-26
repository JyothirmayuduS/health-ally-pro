import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { CirculatoryAndNervousSystems } from "@/components/clinical/ProceduralAnatomySystems";
import {
  ANATOMY_SYSTEMS,
  classifyAtlasMesh,
  DEFAULT_SYSTEM_VISIBILITY,
  VIEW_PRESETS,
  type AnatomySystem,
  type SystemVisibility,
  type ViewPreset,
} from "@/lib/shared/anatomy-systems";
import {
  ANATOMY_MODELS,
  ANATOMY_VIEWS,
  meshMarkerId,
  type AnatomyView,
  type BodyMarker,
} from "@/lib/shared/body-anatomy";
import { cn } from "@/lib/utils";

const VIEW_ANGLES: Record<AnatomyView, { azimuth: number; elevation: number }> = {
  "external-front": { azimuth: 0, elevation: 0.08 },
  "external-back": { azimuth: Math.PI, elevation: 0.08 },
  "external-left": { azimuth: Math.PI / 2, elevation: 0.08 },
};

function ensureOriginalMaterial(mesh: THREE.Mesh) {
  if (!mesh.userData.originalMaterial) {
    mesh.userData.originalMaterial = mesh.material;
  }
}

function applyHighlight(mesh: THREE.Mesh, marked: boolean, hovered: boolean) {
  ensureOriginalMaterial(mesh);
  const original = mesh.userData.originalMaterial as THREE.Material;
  if (!marked && !hovered) {
    mesh.material = original;
    return;
  }
  const base = Array.isArray(original) ? original[0] : original;
  const mat = base.clone() as THREE.MeshStandardMaterial;
  mat.emissive = new THREE.Color(marked ? "#E53935" : "#2E6B4F");
  mat.emissiveIntensity = marked ? 0.45 : 0.2;
  mesh.material = mat;
}

function getMeshLabel(mesh: THREE.Mesh): string {
  const data = mesh.userData as { name?: string; nameDetail?: string };
  return data.nameDetail || data.name || mesh.name || "Structure";
}

function ViewCamera({ view, distance }: { view: AnatomyView; distance: number }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    const { azimuth, elevation } = VIEW_ANGLES[view];
    const y = distance * Math.sin(elevation);
    const horiz = distance * Math.cos(elevation);
    const x = horiz * Math.sin(azimuth);
    const z = horiz * Math.cos(azimuth);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.near = 0.01;
    camera.far = 200;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [view, distance, camera, controls]);

  return null;
}

type AtlasModelProps = {
  visibility: SystemVisibility;
  xrayMuscles: boolean;
  markers: BodyMarker[];
  readOnly: boolean;
  hoveredId: string | null;
  onHoverId: (id: string | null) => void;
  onHoverLabel: (label: string | null) => void;
  onPick: (regionId: string, label: string, meshType: string) => void;
  onReady: (distance: number) => void;
};

function AtlasModel({
  visibility,
  xrayMuscles,
  markers,
  readOnly,
  hoveredId,
  onHoverId,
  onHoverLabel,
  onPick,
  onReady,
}: AtlasModelProps) {
  const { scene } = useGLTF(ANATOMY_MODELS.atlas, true);
  const root = useMemo(() => scene.clone(true), [scene]);
  const meshes = useRef<{ mesh: THREE.Mesh; system: AnatomySystem; id: string; label: string }[]>([]);
  const markedIds = useMemo(() => new Set(markers.map((m) => m.regionId)), [markers]);

  useEffect(() => {
    const list: typeof meshes.current = [];
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      ensureOriginalMaterial(child);
      child.castShadow = true;
      child.receiveShadow = true;
      const ud = child.userData as { type?: string };
      const system = classifyAtlasMesh(child.name, ud.type);
      const label = getMeshLabel(child);
      list.push({ mesh: child, system, id: meshMarkerId(label), label });
    });
    meshes.current = list;

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    onReady(maxDim * 1.35);
  }, [root, onReady]);

  useEffect(() => {
    meshes.current.forEach(({ mesh, system }) => {
      if (system === "muscle") {
        const show = visibility.muscle || xrayMuscles;
        mesh.visible = show;
        ensureOriginalMaterial(mesh);
        const original = mesh.userData.originalMaterial as THREE.MeshStandardMaterial;
        if (!(original instanceof THREE.MeshStandardMaterial)) return;
        if (xrayMuscles) {
          const ghost = original.clone();
          ghost.transparent = true;
          ghost.opacity = visibility.muscle ? 0.35 : 0.12;
          ghost.depthWrite = false;
          mesh.material = ghost;
        } else {
          mesh.material = original;
        }
        return;
      }
      mesh.visible = visibility[system];
      ensureOriginalMaterial(mesh);
      mesh.material = mesh.userData.originalMaterial;
    });
  }, [visibility, xrayMuscles]);

  useEffect(() => {
    meshes.current.forEach(({ mesh, id }) => {
      if (!mesh.visible) return;
      applyHighlight(mesh, markedIds.has(id), hoveredId === id);
    });
  }, [markedIds, hoveredId, visibility, xrayMuscles]);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const mesh = e.object;
      if (!(mesh instanceof THREE.Mesh) || !mesh.visible) return;
      const entry = meshes.current.find((m) => m.mesh === mesh);
      if (!entry) return;
      onHoverId(entry.id);
      onHoverLabel(entry.label);
      document.body.style.cursor = readOnly ? "grab" : "pointer";
    },
    [onHoverId, onHoverLabel, readOnly],
  );

  const handlePointerOut = useCallback(() => {
    onHoverId(null);
    onHoverLabel(null);
    document.body.style.cursor = "default";
  }, [onHoverId, onHoverLabel]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (readOnly) return;
      const mesh = e.object;
      if (!(mesh instanceof THREE.Mesh) || !mesh.visible) return;
      const entry = meshes.current.find((m) => m.mesh === mesh);
      if (entry) onPick(entry.id, entry.label, entry.system);
    },
    [onPick, readOnly],
  );

  return (
    <group>
      <primitive object={root} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick} />
      <CirculatoryAndNervousSystems
        visibility={visibility}
        markers={markers}
        hoveredId={hoveredId}
        readOnly={readOnly}
        onPick={onPick}
        onHover={onHoverLabel}
      />
    </group>
  );
}

useGLTF.preload(ANATOMY_MODELS.atlas, true);

function Scene({
  view,
  cameraDistance,
  ...modelProps
}: AtlasModelProps & { view: AnatomyView; cameraDistance: number }) {
  return (
    <>
      <color attach="background" args={["#EEF2F0"]} />
      <hemisphereLight args={["#ffffff", "#c8d4cc", 0.7]} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} color="#fffaf5" />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#e8f0ff" />
      <directionalLight position={[0, -2, 4]} intensity={0.2} />
      <ViewCamera view={view} distance={cameraDistance} />
      <Suspense fallback={null}>
        <AtlasModel {...modelProps} />
      </Suspense>
      <OrbitControls
        enablePan
        enableDamping
        dampingFactor={0.06}
        minDistance={cameraDistance * 0.25}
        maxDistance={cameraDistance * 4}
        zoomSpeed={1.2}
        target={[0, 0, 0]}
      />
    </>
  );
}

type Props = {
  markers: BodyMarker[];
  onChange?: (markers: BodyMarker[]) => void;
  readOnly?: boolean;
  className?: string;
};

export function ZAnatomy3DViewer({ markers, onChange, readOnly = false, className }: Props) {
  const [view, setView] = useState<AnatomyView>("external-front");
  const [visibility, setVisibility] = useState<SystemVisibility>(DEFAULT_SYSTEM_VISIBILITY);
  const [xrayMuscles, setXrayMuscles] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cameraDistance, setCameraDistance] = useState(2.8);

  const onModelReady = useCallback((dist: number) => {
    setCameraDistance(dist);
  }, []);

  const applyPreset = (preset: ViewPreset) => {
    const p = VIEW_PRESETS.find((x) => x.id === preset);
    if (!p) return;
    setVisibility(p.visibility);
    setXrayMuscles(Boolean(p.xrayMuscles));
  };

  const toggleMarker = useCallback(
    (regionId: string, label: string, meshType: string) => {
      if (!onChange) return;
      const exists = markers.find((m) => m.regionId === regionId);
      if (exists) {
        onChange(markers.filter((m) => m.regionId !== regionId));
      } else {
        onChange([...markers, { regionId, label, view, meshType }]);
      }
    },
    [markers, onChange, view],
  );

  const toggleSystem = (system: AnatomySystem) => {
    setVisibility((prev) => ({ ...prev, [system]: !prev[system] }));
  };

  return (
    <section className={cn("rounded-[20px] border border-[#EDEAE6] bg-white p-3 sm:p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#1B3B2E]">3D body map</h2>
          <p className="text-[11px] text-[#8A8F8C]">Real anatomy model · click to flag · scroll to zoom</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ANATOMY_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                view === v.id ? "bg-[#1B3B2E] text-white" : "border border-[#E8E4DF] bg-[#FAFAF8] text-[#8A8F8C]",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {VIEW_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className="rounded-full border border-[#E8E4DF] bg-[#FAFAF8] px-2.5 py-1 text-[10px] font-semibold text-[#1B3B2E] hover:bg-[#E8EFE6]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ANATOMY_SYSTEMS.map((sys) => (
          <button
            key={sys.id}
            type="button"
            onClick={() => toggleSystem(sys.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
              visibility[sys.id] ? "bg-[#E8EFE6] text-[#1B3B2E]" : "border border-[#E8E4DF] text-[#8A8F8C]",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sys.color }} />
            {sys.label}
          </button>
        ))}
      </div>

      {hoverLabel ? <p className="mt-2 truncate text-[11px] font-medium text-[#1B3B2E]">{hoverLabel}</p> : null}

      <div className="relative mt-3 h-[min(58vh,440px)] min-h-[300px] overflow-hidden rounded-2xl border border-[#D8E0DC] bg-gradient-to-b from-[#F8FAF9] to-[#E8EEEB]">
        <Canvas
          camera={{ fov: 32, near: 0.01, far: 200, position: [0, 0.2, 2.8] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          dpr={[1, 2]}
        >
          <Scene
            view={view}
            cameraDistance={cameraDistance}
            visibility={visibility}
            xrayMuscles={xrayMuscles}
            markers={markers}
            readOnly={readOnly}
            hoveredId={hoveredId}
            onHoverId={setHoveredId}
            onHoverLabel={setHoverLabel}
            onPick={toggleMarker}
            onReady={onModelReady}
          />
        </Canvas>
        {(visibility.vessel || visibility.nerve) && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[9px] text-[#8A8F8C] shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-[#E53935]" /> Arteries
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#1E88E5]" /> Veins
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#FDD835]" /> Nerves
          </div>
        )}
      </div>

      {markers.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {markers.map((m) => (
            <li key={m.regionId}>
              {readOnly || !onChange ? (
                <span className="inline-block rounded-full bg-[#FCE8E6] px-2.5 py-1 text-[10px] font-semibold text-[#C45C4A]">
                  {m.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(markers.filter((x) => x.regionId !== m.regionId))}
                  className="rounded-full bg-[#FCE8E6] px-2.5 py-1 text-[10px] font-semibold text-[#C45C4A]"
                >
                  {m.label} ×
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-center text-[11px] text-[#8A8F8C]">
          Click any bone or muscle · try Skeleton, Blood flow, or Nerves presets
        </p>
      )}
    </section>
  );
}
