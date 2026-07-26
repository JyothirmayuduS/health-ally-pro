import { LAB_CATALOG as SEED_CATALOG, type LabCatalogItem } from "@/lib/lab-desk/mockData";
import { deskForKey, loadPersistedJson, savePersistedJson } from "./persisted-store";

export type { LabCatalogItem };

const STORAGE_KEY = "medora-lab-catalog-v1";

export function loadLabCatalog(): LabCatalogItem[] {
  const loaded = loadPersistedJson<LabCatalogItem[]>(STORAGE_KEY, []);
  return loaded.length ? loaded : [...SEED_CATALOG];
}

export function saveLabCatalog(catalog: LabCatalogItem[]) {
  savePersistedJson(STORAGE_KEY, deskForKey(STORAGE_KEY), catalog);
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
