import { LAB_CATALOG as SEED_CATALOG, type LabCatalogItem } from "@/lib/lab-desk/mockData";

export type { LabCatalogItem };

const STORAGE_KEY = "medora-lab-catalog-v1";

export function loadLabCatalog(): LabCatalogItem[] {
  if (typeof window === "undefined") return [...SEED_CATALOG];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED_CATALOG];
    const parsed = JSON.parse(raw) as LabCatalogItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...SEED_CATALOG];
    return parsed;
  } catch {
    return [...SEED_CATALOG];
  }
}

export function saveLabCatalog(catalog: LabCatalogItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}

export function findCatalogItem(code: string, catalog?: LabCatalogItem[]) {
  const list = catalog ?? loadLabCatalog();
  return list.find((t) => t.code === code);
}

export function updateCatalogItem(
  code: string,
  patch: Partial<LabCatalogItem>,
  catalog?: LabCatalogItem[],
): LabCatalogItem[] {
  const list = catalog ?? loadLabCatalog();
  const next = list.map((t) => (t.code === code ? { ...t, ...patch } : t));
  saveLabCatalog(next);
  return next;
}

export function addCatalogItem(item: LabCatalogItem, catalog?: LabCatalogItem[]): LabCatalogItem[] {
  const list = catalog ?? loadLabCatalog();
  const next = [...list, item];
  saveLabCatalog(next);
  return next;
}

export { SEED_CATALOG };
