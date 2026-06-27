import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
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

function getMeshHierarchicalPath(mesh: THREE.Mesh): string {
  const names: string[] = [];
  let current: THREE.Object3D | null = mesh;
  while (current) {
    if (current.name) {
      names.unshift(current.name);
    }
    current = current.parent;
  }
  return names.join("/");
}

function centerObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
}

function muscleMaterial(original: THREE.Material, xray = false): THREE.Material {
  const base = Array.isArray(original) ? original[0] : original;
  const material = base.clone();
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    material.color = new THREE.Color("#B96A56");
    material.emissive = new THREE.Color("#772E24");
    material.emissiveIntensity = xray ? 0.06 : 0.1;
    material.roughness = 0.52;
    material.metalness = 0.08;
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat = 0.18;
      material.clearcoatRoughness = 0.38;
      material.transmission = xray ? 0.12 : 0.06;
      material.ior = 1.45;
    }
    if (xray) {
      material.transparent = true;
      material.opacity = 0.25;
      material.depthWrite = false;
    }
  }
  return material;
}

function createHighlightMaterial(original: THREE.Material, color: string): THREE.Material {
  const base = Array.isArray(original) ? original[0] : original;
  const material = base.clone() as THREE.MeshStandardMaterial;
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    const highlight = new THREE.Color(color);
    material.color = highlight;
    material.emissive = highlight;
    material.emissiveIntensity = 0.8;
    material.roughness = 0.35;
    material.metalness = 0.12;
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat = 0.22;
      material.clearcoatRoughness = 0.3;
    }
    material.needsUpdate = true;
  }
  return material;
}

function applyHighlight(mesh: THREE.Mesh, marked: boolean, selected: boolean, hovered: boolean) {
  ensureOriginalMaterial(mesh);
  const original = mesh.userData.originalMaterial as THREE.Material;
  if (selected && mesh.userData.selectedMaterial) {
    mesh.material = mesh.userData.selectedMaterial as THREE.Material;
    return;
  }
  if (hovered && mesh.userData.hoverMaterial) {
    mesh.material = mesh.userData.hoverMaterial as THREE.Material;
    return;
  }
  if (marked && mesh.userData.markedMaterial) {
    mesh.material = mesh.userData.markedMaterial as THREE.Material;
    return;
  }
  mesh.material = original;
}

function getMeshLabel(mesh: THREE.Mesh): string {
  const data = mesh.userData as { name?: string; nameDetail?: string };
  const raw = data.nameDetail || data.name || mesh.name || "Structure";
  const cleaned = raw
    .replace(/^m\.?\s*/i, "")
    .replace(/^n\.?\s*/i, "")
    .replace(/\b(l|r)\./gi, (_, side) => (side.toLowerCase() === "l" ? "Left " : "Right "))
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.toLowerCase().includes("structure")) {
    return "Body area";
  }
  const human = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
  if (/\bbiceps\b|\btriceps\b|\bquadriceps\b|\brectus\b/i.test(human)) {
    return human.replace(/\bRectus\b/i, "").trim();
  }
  return human;
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

type AtlasMeshEntry = {
  mesh: THREE.Mesh;
  system: AnatomySystem;
  id: string;
  label: string;
};

type AtlasModelProps = {
  visibility: SystemVisibility;
  xrayMuscles: boolean;
  markers: BodyMarker[];
  readOnly: boolean;
  hoveredId: string | null;
  selectedId: string | null;
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
  selectedId,
  onHoverId,
  onHoverLabel,
  onPick,
  onReady,
}: AtlasModelProps) {
  const { scene } = useGLTF(ANATOMY_MODELS.atlas, true);
  const root = useMemo(() => {
    const clone = scene.clone(true);
    centerObject(clone);
    return clone;
  }, [scene]);
  const meshes = useRef<AtlasMeshEntry[]>([]);
  const markedIds = useMemo(() => new Set(markers.map((m) => m.regionId)), [markers]);
  const lastHoverId = useRef<string | null>(null);
  const lastSelectedId = useRef<string | null>(null);
  const pointerDownPosition = useRef<{ x: number; y: number } | null>(null);
  const pointerMoved = useRef(false);
  const ignoreSelection = useRef(false);

  useEffect(() => {
    const list: AtlasMeshEntry[] = [];
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      ensureOriginalMaterial(child);
      child.castShadow = true;
      child.receiveShadow = true;
      const ud = child.userData as { type?: string };
      const system = classifyAtlasMesh(child.name, ud.type);
      const label = getMeshLabel(child);
      const path = getMeshHierarchicalPath(child);
      const id = meshMarkerId(`${path}:${label}`);
      const show = system === "muscle" ? visibility.muscle || xrayMuscles : visibility[system];
      child.visible = show;
      const original = child.userData.originalMaterial as THREE.Material;
      if (system === "muscle") {
        child.material = xrayMuscles ? muscleMaterial(original, true) : muscleMaterial(original);
      } else {
        child.material = original;
      }
      child.userData.hoverMaterial = createHighlightMaterial(child.material, "#E53935");
      child.userData.markedMaterial = createHighlightMaterial(child.material, "#2E6B4F");
      child.userData.selectedMaterial = createHighlightMaterial(child.material, "#FFD54F");
      const entry = { mesh: child, system, id, label };
      child.userData.meshEntry = entry;
      list.push(entry);
    });
    meshes.current = list;
  }, [root, visibility, xrayMuscles]);

  const findMeshEntry = useCallback((object: THREE.Object3D | null) => {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current instanceof THREE.Mesh && current.userData.meshEntry) {
        return current.userData.meshEntry as AtlasMeshEntry;
      }
      current = current.parent;
    }
    return undefined;
  }, []);

  useEffect(() => {
    meshes.current.forEach(({ mesh, id }) => {
      if (!mesh.visible) return;
      applyHighlight(mesh, markedIds.has(id), selectedId === id, false);
    });
  }, [markedIds, visibility, xrayMuscles, selectedId]);

  useEffect(() => {
    const prevId = lastHoverId.current;
    if (prevId === hoveredId) return;

    if (prevId) {
      const prevEntry = meshes.current.find((entry) => entry.id === prevId);
      if (prevEntry?.mesh.visible) {
        applyHighlight(
          prevEntry.mesh,
          markedIds.has(prevEntry.id),
          selectedId === prevEntry.id,
          false,
        );
      }
    }

    if (hoveredId) {
      const nextEntry = meshes.current.find((entry) => entry.id === hoveredId);
      if (nextEntry?.mesh.visible) {
        applyHighlight(
          nextEntry.mesh,
          markedIds.has(nextEntry.id),
          selectedId === nextEntry.id,
          true,
        );
      }
    }

    lastHoverId.current = hoveredId;
  }, [hoveredId, markedIds, selectedId]);

  useEffect(() => {
    const prevId = lastSelectedId.current;
    if (prevId === selectedId) return;

    if (prevId) {
      const prevEntry = meshes.current.find((entry) => entry.id === prevId);
      if (prevEntry?.mesh.visible) {
        applyHighlight(prevEntry.mesh, markedIds.has(prevEntry.id), false, hoveredId === prevId);
      }
    }

    if (selectedId) {
      const nextEntry = meshes.current.find((entry) => entry.id === selectedId);
      if (nextEntry?.mesh.visible) {
        applyHighlight(nextEntry.mesh, markedIds.has(nextEntry.id), true, hoveredId === selectedId);
      }
    }

    lastSelectedId.current = selectedId;
  }, [selectedId, markedIds, hoveredId]);

  const getIntersectionEntry = useCallback(
    (intersections: ThreeEvent<PointerEvent>["intersections"]) => {
      if (!intersections?.length) return undefined;
      const sorted = intersections.slice().sort((a, b) => a.distance - b.distance);
      for (const intersect of sorted) {
        const entry = findMeshEntry(intersect.object);
        if (entry && entry.mesh.visible) return entry;
      }
      return undefined;
    },
    [findMeshEntry],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (pointerDownPosition.current) {
        const dx = e.clientX - pointerDownPosition.current.x;
        const dy = e.clientY - pointerDownPosition.current.y;
        if (Math.hypot(dx, dy) > 4) {
          pointerMoved.current = true;
        }
      }

      if (pointerMoved.current) return;

      const entry = getIntersectionEntry(e.intersections);
      const nextHoverId = entry?.id ?? null;
      if (nextHoverId === lastHoverId.current) return;
      lastHoverId.current = nextHoverId;
      if (!entry) {
        onHoverId(null);
        onHoverLabel(null);
        return;
      }
      onHoverId(entry.id);
      onHoverLabel(entry.label);
    },
    [getIntersectionEntry, onHoverId, onHoverLabel],
  );

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPosition.current = { x: e.clientX, y: e.clientY };
    pointerMoved.current = false;
    ignoreSelection.current = e.detail > 1;
  }, []);

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (pointerMoved.current || readOnly || ignoreSelection.current) {
        pointerDownPosition.current = null;
        pointerMoved.current = false;
        ignoreSelection.current = false;
        return;
      }

      const entry = getIntersectionEntry(e.intersections);
      if (entry) {
        onPick(entry.id, entry.label, entry.system);
      }
      pointerDownPosition.current = null;
      pointerMoved.current = false;
    },
    [getIntersectionEntry, onPick, readOnly],
  );

  const handlePointerLeave = useCallback(() => {
    lastHoverId.current = null;
    pointerDownPosition.current = null;
    pointerMoved.current = false;
    onHoverId(null);
    onHoverLabel(null);
  }, [onHoverId, onHoverLabel]);

  return (
    <group>
      <primitive
        object={root}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        pointerEvents="auto"
      />
      <CirculatoryAndNervousSystems
        visibility={visibility}
        markers={markers}
        hoveredId={hoveredId}
        readOnly={readOnly}
        onPick={onPick}
        onHover={onHoverLabel}
        onHoverId={onHoverId}
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
  const target = useMemo(() => [0, 0, 0] as const, []);

  return (
    <>
      <color attach="background" args={["#EEF2F0"]} />
      <ambientLight intensity={0.28} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#c8d4cc", 0.7]} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} color="#fffaf5" />
      <directionalLight position={[-5, 3, -3]} intensity={0.65} color="#e8f0ff" />
      <directionalLight position={[0, -2, 4]} intensity={0.22} color="#dce8ff" />
      <Environment preset="sunset" />
      <ViewCamera view={view} distance={cameraDistance} />
      <Suspense fallback={null}>
        <AtlasModel {...modelProps} selectedId={modelProps.selectedId} />
      </Suspense>
      <OrbitControls
        enablePan
        screenSpacePanning
        enableDamping
        dampingFactor={0.06}
        minDistance={cameraDistance * 0.25}
        maxDistance={cameraDistance * 4}
        zoomSpeed={1.2}
        target={target}
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    <section
      className={cn("rounded-[20px] border border-[#EDEAE6] bg-white p-3 sm:p-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#1B3B2E]">3D body map</h2>
          <p className="text-[11px] text-[#8A8F8C]">
            Real anatomy model · click to flag · scroll to zoom
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ANATOMY_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                view === v.id
                  ? "bg-[#1B3B2E] text-white"
                  : "border border-[#E8E4DF] bg-[#FAFAF8] text-[#8A8F8C]",
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
              visibility[sys.id]
                ? "bg-[#E8EFE6] text-[#1B3B2E]"
                : "border border-[#E8E4DF] text-[#8A8F8C]",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sys.color }} />
            {sys.label}
          </button>
        ))}
      </div>

      {hoverLabel ? (
        <p className="mt-2 truncate text-[11px] font-medium text-[#1B3B2E]">{hoverLabel}</p>
      ) : null}

      <div className="relative mt-3 h-[min(58vh,440px)] min-h-[300px] overflow-hidden rounded-2xl border border-[#D8E0DC] bg-gradient-to-b from-[#F8FAF9] to-[#E8EEEB]">
        <Canvas
          className={readOnly ? "cursor-grab" : "cursor-pointer"}
          camera={{ fov: 32, near: 0.01, far: 200, position: [0, 0.2, 2.8] }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
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
            selectedId={selectedId}
            onHoverId={setHoveredId}
            onHoverLabel={setHoverLabel}
            onPick={(regionId, label, meshType) => {
              setSelectedId(regionId);
              toggleMarker(regionId, label, meshType);
            }}
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
