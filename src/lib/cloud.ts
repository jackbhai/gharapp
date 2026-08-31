import { getAll, getScoped, put, type StoreName } from './db';
import type { CosmeticItem, DailyLog, InventoryItem, LocationItem, MealPlanItem, Profile, ShoppingItem } from './types';

export type CloudProvider = 'supabase' | 'firebase';
export interface CloudConfig {
  provider: CloudProvider;
  url: string;
  token: string;
  enabled: boolean;
  lastSync?: string;
}

export type CloudSyncResult = { added: number; updated: number; provider: CloudProvider; lastSync: string };
const CLOUD_KEY = 'gharapp_cloud_connection_v1';
const SYNC_STORES: StoreName[] = ['inventory_items', 'cosmetics_items', 'meal_plans', 'shopping_items', 'daily_logs'];

type SyncRecord = InventoryItem | CosmeticItem | MealPlanItem | ShoppingItem | DailyLog;
export interface CloudSnapshot {
  version: 1;
  profileId: string;
  updatedAt: string;
  inventory_items: InventoryItem[];
  cosmetics_items: CosmeticItem[];
  meal_plans: MealPlanItem[];
  shopping_items: ShoppingItem[];
  daily_logs: DailyLog[];
  locations: LocationItem[];
  profiles: Profile[];
}

export function getCloudConfig(): CloudConfig | null {
  try { const raw = localStorage.getItem(CLOUD_KEY); return raw ? JSON.parse(raw) as CloudConfig : null; } catch { return null; }
}
export function saveCloudConfig(config: CloudConfig): void { localStorage.setItem(CLOUD_KEY, JSON.stringify(config)); }
export function clearCloudConfig(): void { localStorage.removeItem(CLOUD_KEY); }

/** Build a profile-scoped snapshot. Food data is intentionally excluded because every device gets the static seed. */
export async function buildSnapshot(profileId: string): Promise<CloudSnapshot> {
  const [inventory, cosmetics, plans, shopping, logs, locations, profiles] = await Promise.all([
    getScoped<InventoryItem>('inventory_items', profileId), getScoped<CosmeticItem>('cosmetics_items', profileId),
    getScoped<MealPlanItem>('meal_plans', profileId), getScoped<ShoppingItem>('shopping_items', profileId), getScoped<DailyLog>('daily_logs', profileId),
    getAll<LocationItem>('locations'), getAll<Profile>('profiles'),
  ]);
  return { version: 1, profileId, updatedAt: new Date().toISOString(), inventory_items: inventory, cosmetics_items: cosmetics, meal_plans: plans, shopping_items: shopping, daily_logs: logs, locations, profiles };
}

function cleanUrl(url: string): string { return url.trim().replace(/\/$/, ''); }
function supabaseHeaders(config: CloudConfig): HeadersInit { return { apikey: config.token, Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' }; }
function firebaseUrl(config: CloudConfig, profileId: string): string { return `${cleanUrl(config.url)}/gharapp/${encodeURIComponent(profileId)}.json?auth=${encodeURIComponent(config.token)}`; }

/** Fetch a remote snapshot from the selected cloud provider. */
export async function fetchRemoteSnapshot(config: CloudConfig, profileId: string): Promise<CloudSnapshot | null> {
  if (config.provider === 'supabase') {
    const response = await fetch(`${cleanUrl(config.url)}/rest/v1/gharapp_sync?id=eq.${encodeURIComponent(profileId)}&select=payload`, { headers: supabaseHeaders(config) });
    if (!response.ok) throw new Error(`Supabase read failed (${response.status}). Check table, URL and RLS policy.`);
    const rows = await response.json() as { payload?: CloudSnapshot }[];
    return rows[0]?.payload || null;
  }
  const response = await fetch(firebaseUrl(config, profileId));
  if (!response.ok) throw new Error(`Firebase read failed (${response.status}). Check database URL and auth token.`);
  const row = await response.json() as { payload?: CloudSnapshot } | null;
  return row?.payload || null;
}

/** Write one profile snapshot to the selected cloud provider. */
export async function pushSnapshot(config: CloudConfig, snapshot: CloudSnapshot): Promise<void> {
  if (config.provider === 'supabase') {
    const response = await fetch(`${cleanUrl(config.url)}/rest/v1/gharapp_sync`, { method: 'POST', headers: { ...supabaseHeaders(config), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify([{ id: snapshot.profileId, profile_id: snapshot.profileId, payload: snapshot, updated_at: snapshot.updatedAt }]) });
    if (!response.ok) { const text = await response.text(); throw new Error(`Supabase write failed (${response.status}). Create gharapp_sync table and RLS policy first. ${text.slice(0, 180)}`); }
    return;
  }
  const response = await fetch(firebaseUrl(config, snapshot.profileId), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: snapshot.profileId, payload: snapshot, updatedAt: snapshot.updatedAt }) });
  if (!response.ok) throw new Error(`Firebase write failed (${response.status}). Check auth rules and token.`);
}

function recordTimestamp(record: SyncRecord): number { const updated = 'updatedAt' in record ? record.updatedAt : undefined; return new Date(String(updated || record.createdAt || 0)).getTime() || 0; }
function arrayFor(snapshot: CloudSnapshot, store: StoreName): SyncRecord[] { return (snapshot[store as keyof CloudSnapshot] as SyncRecord[] | undefined) || []; }

/** Merge remote records without deleting local data; the newer updatedAt/createdAt wins. */
export async function mergeRemoteSnapshot(remote: CloudSnapshot, profileId: string): Promise<{ added: number; updated: number }> {
  let added = 0; let updated = 0;
  for (const store of SYNC_STORES) {
    const local = await getScoped<SyncRecord & { id: string }>(store, profileId);
    const localById = new Map(local.map((record) => [record.id, record]));
    for (const remoteRecord of arrayFor(remote, store)) {
      if (!remoteRecord.id || String(remoteRecord.profileId || profileId) !== profileId) continue;
      const current = localById.get(remoteRecord.id);
      if (!current) { await put(store, { ...remoteRecord, profileId } as never); added++; }
      else if (recordTimestamp(remoteRecord) >= recordTimestamp(current)) { await put(store, { ...current, ...remoteRecord, profileId } as never); updated++; }
    }
  }
  if (remote.locations?.length) for (const location of remote.locations) await put('locations', location);
  if (remote.profiles?.length) for (const profile of remote.profiles) await put('profiles', profile);
  return { added, updated };
}

/** Pull, merge and push the current profile, making another device converge on the same snapshot. */
export async function syncCloud(profileId: string, supplied?: CloudConfig): Promise<CloudSyncResult> {
  const config = supplied || getCloudConfig();
  if (!config?.enabled) throw new Error('Cloud connection is not enabled. Add it in Settings first.');
  if (!config.url.trim() || !config.token.trim()) throw new Error('Cloud URL and public token are required.');
  const remote = await fetchRemoteSnapshot(config, profileId);
  const merged = remote ? await mergeRemoteSnapshot(remote, profileId) : { added: 0, updated: 0 };
  const snapshot = await buildSnapshot(profileId);
  await pushSnapshot(config, snapshot);
  const lastSync = new Date().toISOString();
  saveCloudConfig({ ...config, lastSync });
  return { ...merged, provider: config.provider, lastSync };
}

/** Lightweight connection check. A missing Supabase table returns a useful setup error. */
export async function testCloudConnection(config: CloudConfig): Promise<void> {
  if (!config.url.trim() || !config.token.trim()) throw new Error('Cloud URL and public token required.');
  if (config.provider === 'supabase') {
    const response = await fetch(`${cleanUrl(config.url)}/rest/v1/gharapp_sync?select=id&limit=1`, { headers: supabaseHeaders(config) });
    if (!response.ok) throw new Error(`Supabase test failed (${response.status}). Create the sync table/RLS policy and verify the URL/key.`);
  } else {
    const response = await fetch(`${cleanUrl(config.url)}/.json?auth=${encodeURIComponent(config.token)}`);
    if (!response.ok) throw new Error(`Firebase test failed (${response.status}). Verify Realtime Database URL and auth token.`);
  }
}
