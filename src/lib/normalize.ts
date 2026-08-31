import type { CosmeticItem, FoodItem, InventoryItem } from './types';

/** Round numeric values to two decimals, preventing floating point artefacts. */
export function round2(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : fallback;
}

export function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

export function text(value: unknown): string {
  return String(value ?? '').trim();
}

/** Normalize food records from both the old HTML schema and the new app schema. */
export function normalizeFood(item: Partial<FoodItem> = {}): FoodItem {
  const out: FoodItem = {
    ...item,
    id: text(item.id) || `food_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: text(item.name) || 'Unnamed food',
    category: text(item.category) || 'Other',
    subCategory: text(item.subCategory),
    tasteTags: asArray(item.tasteTags ?? item.tastes).map((x) => x.toLowerCase()),
    season: asArray(item.season).map((x) => x.toLowerCase()),
    tags: asArray(item.tags).map((x) => x.toLowerCase()),
    pros: asArray(item.pros),
    cons: asArray(item.cons),
    benefits: asArray(item.benefits),
    sideEffects: asArray(item.sideEffects),
    allergens: asArray(item.allergens),
    allergenTags: asArray(item.allergenTags),
    preparationMethods: asArray(item.preparationMethods),
    cuisineStyle: text(item.cuisineStyle),
    regions: asArray(item.regions),
    mealTypes: asArray(item.mealTypes),
    goodForHealthGoals: asArray(item.goodForHealthGoals),
    createdAt: item.createdAt || new Date().toISOString(),
  };

  for (const field of ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g', 'fiberPer100g', 'sugarPer100g'] as const) {
    out[field] = round2(item[field]);
  }
  out.glycemicIndex = item.glycemicIndex == null ? null : round2(item.glycemicIndex);
  const micronutrients = item.micronutrients ?? {};
  out.micronutrients = Object.fromEntries(
    ['iron_mg', 'calcium_mg', 'vitamin_c_mg', 'vitamin_a_mcg', 'vitamin_b12_mcg', 'potassium_mg', 'sodium_mg'].map((key) => [key, round2(micronutrients[key], 0)]),
  );
  return out;
}

/** Normalize old inventory records and provide v7 defaults. */
export function normalizeInventory(item: Partial<InventoryItem>, profileId: string, settings?: { alertBeforeDays?: number; defaultUnit?: string }): InventoryItem {
  return {
    ...item,
    id: text(item.id) || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    profileId: item.profileId || profileId,
    name: text(item.name),
    brand: text(item.brand),
    category: text(item.category) || 'Groceries',
    quantity: round2(item.quantity),
    unit: text(item.unit) || settings?.defaultUnit || 'pcs',
    purchaseDate: text(item.purchaseDate),
    mfgDate: text(item.mfgDate),
    expiryDate: text(item.expiryDate),
    status: item.status === 'opened' || item.status === 'consumed' ? item.status : 'unopened',
    locationId: item.locationId || null,
    locationDetails: text(item.locationDetails),
    price: round2(item.price),
    source: text(item.source),
    barcode: text(item.barcode),
    reorderLevel: round2(item.reorderLevel),
    photoData: item.photoData || null,
    notes: text(item.notes),
    alertBeforeDays: Number(item.alertBeforeDays || settings?.alertBeforeDays || 7),
    archived: Boolean(item.archived),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Normalize old cosmetic records and provide v7 defaults. */
export function normalizeCosmetic(item: Partial<CosmeticItem>, profileId: string, settings?: { alertDays?: number }): CosmeticItem {
  return {
    ...item,
    id: text(item.id) || `cos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    profileId: item.profileId || profileId,
    name: text(item.name),
    brand: text(item.brand),
    category: text(item.category) || 'Skincare',
    skinType: asArray(item.skinType),
    opened: Boolean(item.opened),
    ingredients: text(item.ingredients),
    concerns: asArray(item.concerns),
    rating: Math.max(0, Math.min(5, round2(item.rating))),
    purchaseDate: text(item.purchaseDate),
    mfgDate: text(item.mfgDate),
    expiryDate: text(item.expiryDate),
    locationId: item.locationId || null,
    notes: text(item.notes),
    howToUse: text(item.howToUse),
    photoData: item.photoData || null,
    alertBeforeDays: Number(item.alertBeforeDays || settings?.alertDays || 14),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
