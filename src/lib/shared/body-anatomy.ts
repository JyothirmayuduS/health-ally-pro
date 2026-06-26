export type AnatomyView = "external-front" | "external-back" | "external-left";

export const ANATOMY_VIEWS: { id: AnatomyView; label: string; hint: string }[] = [
  { id: "external-front", label: "Front", hint: "Anterior" },
  { id: "external-back", label: "Back", hint: "Posterior" },
  { id: "external-left", label: "Side", hint: "Lateral" },
];

export type BodyMarker = {
  regionId: string;
  label: string;
  view: AnatomyView;
  meshType?: string;
};

export const ANATOMY_MODELS = {
  atlas: "/anatomy/body-atlas.glb",
} as const;

export function meshMarkerId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
