import Dexie, { type Table } from 'dexie';
import { FOOD_DATA } from '../data/foodData';
import { COOKED_MEALS } from '../data/cookedMeals';
import type { AppSettings, CosmeticItem, DailyLog, FoodItem, InventoryItem, LocationItem, MealPlanItem, Profile, SavedFilter, ShoppingItem } from './types';
import { normalizeCosmetic, normalizeFood, normalizeInventory } from './normalize';

export type StoreName = 'food_items' | 'inventory_items' | 'cosmetics_items' | 'locations' | 'settings' | 'chat_messages' | 'meal_plans' | 'shopping_items' | 'daily_logs' | 'profiles' | 'saved_filters';
type RecordWithId = { id: string; [key: string]: unknown };
type HasId = { id: string };

/** IndexedDB schema used by all React modules. The existing GharApp database name is kept for migration. */
export const gharDb = new Dexie('gharapp_db');
gharDb.version(8).stores({
  food_items: 'id,name,category,subCategory,*tags,*season,createdAt',
  inventory_items: 'id,name,brand,category,expiryDate,purchaseDate,mfgDate,locationId,status,barcode,profileId,createdAt',
  cosmetics_items: 'id,name,brand,category,expiryDate,purchaseDate,mfgDate,locationId,profileId,createdAt',
  locations: 'id,name,profileId',
  settings: 'id',
  chat_messages: 'id,profileId,ts',
  meal_plans: 'id,profileId,date,slot,foodId',
  shopping_items: 'id,profileId,completed,createdAt',
  daily_logs: 'id,profileId,date,foodId',
  profiles: 'id,name,createdAt',
  saved_filters: 'id,module,createdAt',
});

export const DEFAULT_LOCATIONS: LocationItem[] = [
  ['loc_kitchen', 'Kitchen Shelf'], ['loc_fridge_top', 'Fridge Top Shelf'], ['loc_fridge_bottom', 'Fridge Bottom Shelf'],
  ['loc_freezer', 'Freezer'], ['loc_grain', 'Grain Container'], ['loc_spice', 'Spice Rack'], ['loc_dryfruit', 'Dry Fruit Box'],
  ['loc_bathroom', 'Bathroom Shelf'], ['loc_bedroom', 'Bedroom Drawer'], ['loc_medicine', 'Medicine Box'],
  ['loc_balcony', 'Balcony Storage'], ['loc_garage', 'Garage Storage'], ['loc_wardrobe', 'Wardrobe'],
].map(([id, name]) => ({ id, name, type: 'default' }));

const PROFILE_STORES = new Set<StoreName>(['inventory_items', 'cosmetics_items', 'meal_plans', 'shopping_items', 'daily_logs', 'chat_messages']);
export let storageMode: 'indexeddb' | 'localstorage' = 'indexeddb';

function table(store: StoreName): Table<RecordWithId, string> {
  return gharDb.table<RecordWithId, string>(store);
}

function localKey(store: StoreName): string {
  return `gharapp_react_${store}`;
}

function localAll(store: StoreName): RecordWithId[] {
  try {
    const current = localStorage.getItem(localKey(store));
    const legacy = localStorage.getItem(`gharapp_ls_${store}`);
    const source = current ?? legacy ?? '[]';
    const parsed = JSON.parse(source) as unknown;
    return Array.isArray(parsed) ? parsed as RecordWithId[] : [];
  } catch {
    return [];
  }
}

function localSet(store: StoreName, records: RecordWithId[]): boolean {
  try {
    localStorage.setItem(localKey(store), JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

/** Initialize IndexedDB, falling back to localStorage in file/WebView contexts. */
export async function initDatabase(seedUrl?: string): Promise<void> {
  try {
    await gharDb.open();
    storageMode = 'indexeddb';
  } catch {
    storageMode = 'localstorage';
  }

  const food = await getAll<FoodItem>('food_items');
  if (!food.length) {
    await bulkPut('food_items', [...FOOD_DATA, ...COOKED_MEALS].map((item) => normalizeFood(item)));
  } else {
    // v2/v7 records are rewritten once so long decimals such as 15.180000000000001 become 15.18.
    await bulkPut('food_items', food.map((item) => normalizeFood(item)));
  }

  const inventory = await getAll<InventoryItem>('inventory_items');
  if (inventory.length) await bulkPut('inventory_items', inventory.map((item) => normalizeInventory(item, 'profile_default')));
  const cosmetics = await getAll<CosmeticItem>('cosmetics_items');
  if (cosmetics.length) await bulkPut('cosmetics_items', cosmetics.map((item) => normalizeCosmetic(item, 'profile_default')));


  const locations = await getAll<LocationItem>('locations');
  if (!locations.length) await bulkPut('locations', DEFAULT_LOCATIONS);
  const profiles = await getAll<Profile>('profiles');
  if (!profiles.some((profile) => profile.id === 'profile_default')) {
    await put('profiles', { id: 'profile_default', name: 'Mera ghar', emoji: '🏠', createdAt: new Date().toISOString() });
  }
}

/** Seed the large JSON in the background after the first screen is usable. */
export async function seedLargeFoodDataset(seedUrl: string): Promise<boolean> {
  if (storageMode !== 'indexeddb') return false;
  try {
    const current = await getAll<FoodItem>('food_items');
    const marker = await getSetting<{ value?: number }>('foodDatasetVersion');
    if (marker?.value === 3 && current.length >= 4600) return false;
    const response = await fetch(seedUrl);
    if (!response.ok) return false;
    const payload = await response.json() as { module?: string; items?: Partial<FoodItem>[] };
    if (payload.module !== 'food' || !Array.isArray(payload.items)) return false;
    if (payload.items.length <= current.length) {
      await putSetting('foodDatasetVersion', { value: Number((payload as { datasetVersion?: number }).datasetVersion || 2) });
      return false;
    }
    await bulkPut('food_items', payload.items.map((item) => normalizeFood(item)));
    await putSetting('foodDatasetVersion', { value: Number((payload as { datasetVersion?: number }).datasetVersion || 2) });
    return true;
  } catch {
    // The bundled 57-item starter set remains available when offline.
    return false;
  }
}

export async function getAll<T extends HasId>(store: StoreName): Promise<T[]> {
  if (storageMode === 'localstorage') return localAll(store) as T[];
  try {
    return await table(store).toArray() as T[];
  } catch {
    storageMode = 'localstorage';
    return localAll(store) as T[];
  }
}

export async function get<T extends HasId>(store: StoreName, id: string): Promise<T | undefined> {
  if (storageMode === 'localstorage') return localAll(store).find((item) => item.id === id) as T | undefined;
  try {
    return await table(store).get(id) as T | undefined;
  } catch {
    storageMode = 'localstorage';
    return localAll(store).find((item) => item.id === id) as T | undefined;
  }
}

export async function put<T extends HasId>(store: StoreName, value: T): Promise<void> {
  if (storageMode === 'localstorage') {
    const records = localAll(store);
    const index = records.findIndex((item) => item.id === value.id);
    if (index === -1) records.push(value); else records[index] = value;
    localSet(store, records);
    return;
  }
  try {
    await table(store).put(value);
  } catch {
    storageMode = 'localstorage';
    const records = localAll(store);
    const index = records.findIndex((item) => item.id === value.id);
    if (index === -1) records.push(value); else records[index] = value;
    localSet(store, records);
  }
}

export async function bulkPut<T extends HasId>(store: StoreName, values: T[]): Promise<void> {
  if (!values.length) return;
  if (storageMode === 'localstorage') {
    const current = localAll(store);
    const map = new Map(current.map((item) => [item.id, item]));
    values.forEach((value) => map.set(value.id, value));
    localSet(store, [...map.values()]);
    return;
  }
  try {
    await table(store).bulkPut(values);
  } catch {
    storageMode = 'localstorage';
    const current = localAll(store);
    const map = new Map(current.map((item) => [item.id, item]));
    values.forEach((value) => map.set(value.id, value));
    localSet(store, [...map.values()]);
  }
}

export async function remove(store: StoreName, id: string): Promise<void> {
  if (storageMode === 'localstorage') {
    localSet(store, localAll(store).filter((item) => item.id !== id));
    return;
  }
  try { await table(store).delete(id); } catch { storageMode = 'localstorage'; localSet(store, localAll(store).filter((item) => item.id !== id)); }
}

export async function clearStore(store: StoreName): Promise<void> {
  if (storageMode === 'localstorage') { localStorage.removeItem(localKey(store)); return; }
  try { await table(store).clear(); } catch { storageMode = 'localstorage'; localStorage.removeItem(localKey(store)); }
}

export async function getScoped<T extends HasId>(store: StoreName, profileId: string): Promise<T[]> {
  const records = await getAll<T>(store);
  return PROFILE_STORES.has(store) ? records.filter((record) => ((record as RecordWithId).profileId as string | undefined) === profileId) : records;
}

export async function getSetting<T = unknown>(id: string): Promise<T | undefined> {
  const result = await get<RecordWithId>('settings', id);
  return result as T | undefined;
}

export async function putSetting<T extends object>(id: string, value: T): Promise<void> {
  await put('settings', { ...value, id } as HasId);
}

export const defaultSettings: AppSettings = {
  theme: 'dark', fontScale: 1, alertBeforeDays: 7, cosmeticAlertDays: 14, defaultUnit: 'pcs', dailyReminder: false,
  calorieTarget: 2000, proteinTarget: 60, carbsTarget: 250, fatTarget: 70,
};

export function isProfileRecord(store: StoreName): boolean { return PROFILE_STORES.has(store); }

export type AppRecord = FoodItem | InventoryItem | CosmeticItem | LocationItem | Profile | AppSettings | MealPlanItem | ShoppingItem | DailyLog | SavedFilter;
