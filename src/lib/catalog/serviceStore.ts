import { ServiceRow } from "../../types/catalog.types";

const LOCAL_SERVICES_KEY = "wassup_local_services_override";
const LOCAL_BOM_KEY = "wassup_local_bom_override";

interface ServiceOverrideStore {
  created: ServiceRow[];
  updated: Record<string, Partial<ServiceRow>>;
  deleted: string[];
}

export function getLocalServiceStore(): ServiceOverrideStore {
  if (typeof window === "undefined") return { created: [], updated: {}, deleted: [] };
  try {
    const raw = localStorage.getItem(LOCAL_SERVICES_KEY);
    if (!raw) return { created: [], updated: {}, deleted: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { created: [], updated: {}, deleted: [] };
  }
}

export function saveLocalServiceStore(store: ServiceOverrideStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("wassup_services_updated"));
}

export function applyLocalOverridesToServices(dbServices: ServiceRow[], type: "package" | "addon"): ServiceRow[] {
  const store = getLocalServiceStore();
  const deletedSet = new Set(store.deleted);

  // Filter out deleted and apply updates
  const updatedDb = dbServices
    .filter((s) => !deletedSet.has(s.id))
    .map((s) => {
      const patch = store.updated[s.id];
      return patch ? { ...s, ...patch } : s;
    });

  // Add newly created services that match the type and are not deleted
  const createdForType = store.created.filter((s) => s.type === type && !deletedSet.has(s.id));

  // Merge created and updatedDb, deduplicating by id
  const idMap = new Map<string, ServiceRow>();
  for (const item of [...updatedDb, ...createdForType]) {
    idMap.set(item.id, item);
  }
  return Array.from(idMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function createLocalService(newService: ServiceRow) {
  const store = getLocalServiceStore();
  store.created.push(newService);
  saveLocalServiceStore(store);
}

export function updateLocalService(id: string, patch: Partial<ServiceRow>) {
  const store = getLocalServiceStore();
  const createdIdx = store.created.findIndex((s) => s.id === id);
  if (createdIdx >= 0) {
    store.created[createdIdx] = { ...store.created[createdIdx], ...patch };
  } else {
    store.updated[id] = { ...(store.updated[id] || {}), ...patch };
  }
  saveLocalServiceStore(store);
}

export function deleteLocalService(id: string) {
  const store = getLocalServiceStore();
  store.created = store.created.filter((s) => s.id !== id);
  delete store.updated[id];
  if (!store.deleted.includes(id)) {
    store.deleted.push(id);
  }
  saveLocalServiceStore(store);
}

export function getLocalBomForService(serviceId: string): any[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_BOM_KEY}_${serviceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveLocalBomForService(serviceId: string, bomLines: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LOCAL_BOM_KEY}_${serviceId}`, JSON.stringify(bomLines));
  window.dispatchEvent(new CustomEvent("wassup_bom_updated", { detail: { serviceId } }));
}
