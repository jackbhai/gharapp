import { getExpiryStatus } from './date';
import type { CosmeticItem, FilterState, FoodItem, InventoryItem, ModuleName } from './types';

export type Filterable = FoodItem | InventoryItem | CosmeticItem;

const arrayValue = (filters: FilterState, key: string): string[] => {
  const value = filters[key];
  return Array.isArray(value) ? value.map(String).map((item) => item.toLowerCase()) : [];
};
const numberValue = (filters: FilterState, key: string): number | undefined => {
  const value = filters[key];
  return value === undefined || value === '' ? undefined : Number(value);
};
const includesAny = (value: string, options: string[]): boolean => !options.length || options.some((option) => value.toLowerCase() === option);
const includesAnyArray = (values: string[], options: string[]): boolean => !options.length || options.some((option) => values.map((value) => value.toLowerCase()).includes(option));
const between = (value: unknown, min?: number, max?: number): boolean => {
  const number = Number(value || 0);
  return !(min !== undefined && number < min) && !(max !== undefined && number > max);
};

function matchesFood(item: FoodItem, query: string, filters: FilterState): boolean {
  const wantedType = filters.foodType;
  if (Array.isArray(wantedType) && wantedType.length && !wantedType.map(String).includes(String(item.foodType || 'raw'))) return false;
  const haystack = [item.name, item.category, item.subCategory, ...(item.tags ?? []), ...(item.pros ?? []), ...(item.cons ?? [])].join(' ').toLowerCase();
  if (query && !haystack.includes(query)) return false;
  if (!includesAny(String(item.category || ''), arrayValue(filters, 'categories'))) return false;
  if (!includesAny(String(item.subCategory || ''), arrayValue(filters, 'subCategories'))) return false;
  if (!includesAny(String(item.cuisineStyle || ''), arrayValue(filters, 'cuisines'))) return false;
  if (!includesAnyArray(item.regions ?? [], arrayValue(filters, 'regions'))) return false;
  if (!includesAnyArray(item.tasteTags ?? [], arrayValue(filters, 'tastes'))) return false;
  if (!includesAnyArray(item.season ?? [], arrayValue(filters, 'seasons'))) return false;
  const times = arrayValue(filters, 'bestTimes');
  const mealTypes = arrayValue(filters, 'mealTypes');
  if (times.length && !times.some((time) => String(item.bestTimeToEat || '').toLowerCase().includes(time))) return false;
  if (mealTypes.length && !includesAnyArray(item.mealTypes ?? [], mealTypes)) return false;
  if (!includesAnyArray(item.goodForHealthGoals ?? [], arrayValue(filters, 'healthGoals'))) return false;
  if (!includesAnyArray(item.preparationMethods ?? [], arrayValue(filters, 'preparationMethods'))) return false;
  for (const [field, key] of [['caloriesPer100g', 'Calories'], ['proteinPer100g', 'Protein'], ['carbsPer100g', 'Carbs'], ['fatPer100g', 'Fat'], ['fiberPer100g', 'Fiber'], ['sugarPer100g', 'Sugar']] as const) {
    if (!between(item[field], numberValue(filters, `min${key}`), numberValue(filters, `max${key}`))) return false;
  }
  if (!between(item.glycemicIndex, numberValue(filters, 'minGI'), numberValue(filters, 'maxGI'))) return false;
  if (!between(item.cookingTimeMin, numberValue(filters, 'minCookingTime'), numberValue(filters, 'maxCookingTime'))) return false;
  for (const field of ['diabetesFriendly', 'weightLossFriendly', 'kidsFriendly', 'gymFriendly', 'dailyUse', 'isVeg', 'isVegan', 'isGlutenFree', 'isJain', 'isEgg']) {
    if (filters[field] === true && !item[field]) return false;
  }
  const tags = arrayValue(filters, 'tags');
  if (tags.length && !tags.every((tag) => (item.tags ?? []).map((value) => value.toLowerCase()).includes(tag))) return false;
  const allergenFilter = arrayValue(filters, 'allergens');
  if (allergenFilter.length && !allergenFilter.some((allergen) => [...(item.allergens ?? []), ...(item.allergenTags ?? [])].map((value) => value.toLowerCase()).includes(allergen))) return false;
  if (filters.prosText && !(item.pros ?? []).join(' ').toLowerCase().includes(String(filters.prosText).toLowerCase())) return false;
  if (filters.consText && !(item.cons ?? []).join(' ').toLowerCase().includes(String(filters.consText).toLowerCase())) return false;
  return true;
}

function dateMatches(itemDate: string | undefined, filters: FilterState, key: string): boolean {
  const from = filters[`${key}From`];
  const to = filters[`${key}To`];
  if (from && (!itemDate || itemDate < String(from))) return false;
  if (to && (!itemDate || itemDate > String(to))) return false;
  return true;
}

function matchesInventory(item: InventoryItem, query: string, filters: FilterState): boolean {
  const haystack = [item.name, item.brand, item.category, item.source, item.barcode].join(' ').toLowerCase();
  if (query && !haystack.includes(query)) return false;
  if (filters.sourceText && !String(item.source || '').toLowerCase().includes(String(filters.sourceText).toLowerCase())) return false;
  if (item.archived && filters.includeArchived !== true) return false;
  if (!includesAny(String(item.category || ''), arrayValue(filters, 'categories'))) return false;
  const locations = arrayValue(filters, 'locationIds');
  if (locations.length && !locations.includes(String(item.locationId || '').toLowerCase())) return false;
  const statuses = arrayValue(filters, 'statuses');
  if (statuses.length && !statuses.includes(item.status)) return false;
  const expiry = arrayValue(filters, 'expiryStatuses');
  if (expiry.length && !expiry.includes(getExpiryStatus(item.expiryDate, item.alertBeforeDays))) return false;
  if (!between(item.quantity, numberValue(filters, 'minQuantity'), numberValue(filters, 'maxQuantity'))) return false;
  if (!between(item.price, numberValue(filters, 'minPrice'), numberValue(filters, 'maxPrice'))) return false;
  const smartFlags = arrayValue(filters, 'smartFlags');
  if (smartFlags.includes('low stock') && !(item.reorderLevel && item.quantity <= item.reorderLevel)) return false;
  if (smartFlags.includes('has barcode') && !item.barcode) return false;
  if (smartFlags.includes('has photo') && !item.photoData) return false;
  return dateMatches(item.purchaseDate, filters, 'purchase') && dateMatches(item.mfgDate, filters, 'mfg') && dateMatches(item.expiryDate, filters, 'expiry');
}

function matchesCosmetic(item: CosmeticItem, query: string, filters: FilterState): boolean {
  const haystack = [item.name, item.brand, item.category, item.ingredients, ...(item.concerns ?? [])].join(' ').toLowerCase();
  if (query && !haystack.includes(query)) return false;
  if (!includesAny(String(item.category || ''), arrayValue(filters, 'categories'))) return false;
  const skinTypes = arrayValue(filters, 'skinTypes');
  if (skinTypes.length && !skinTypes.some((skin) => (item.skinType ?? []).map((value) => value.toLowerCase()).includes(skin))) return false;
  if (filters.opened !== undefined && Boolean(item.opened) !== Boolean(filters.opened)) return false;
  const expiry = arrayValue(filters, 'expiryStatuses');
  if (expiry.length && !expiry.includes(getExpiryStatus(item.expiryDate, item.alertBeforeDays))) return false;
  const locations = arrayValue(filters, 'locationIds');
  if (locations.length && !locations.includes(String(item.locationId || '').toLowerCase())) return false;
  if (!includesAnyArray(item.concerns ?? [], arrayValue(filters, 'concerns'))) return false;
  if (filters.ingredientsText && !String(item.ingredients || '').toLowerCase().includes(String(filters.ingredientsText).toLowerCase())) return false;
  if (!between(item.rating, numberValue(filters, 'minRating'), numberValue(filters, 'maxRating'))) return false;
  return dateMatches(item.purchaseDate, filters, 'purchase') && dateMatches(item.mfgDate, filters, 'mfg') && dateMatches(item.expiryDate, filters, 'expiry');
}

/** Filter and sort a module list. Pagination is applied by the screen, not here. */
export function filterAndSort<T extends Filterable>(items: T[], module: ModuleName, rawQuery: string, filters: FilterState, sort: string): T[] {
  const query = rawQuery.trim().toLowerCase();
  const matched = items.filter((item) => module === 'food' ? matchesFood(item as FoodItem, query, filters) : module === 'inventory' ? matchesInventory(item as InventoryItem, query, filters) : matchesCosmetic(item as CosmeticItem, query, filters));
  return matched.sort((a, b) => {
    if (sort === 'nameDesc' || sort === 'nameAsc') {
      const result = String(a.name).localeCompare(String(b.name));
      return sort === 'nameDesc' ? -result : result;
    }
    if (sort === 'caloriesAsc' || sort === 'caloriesDesc') {
      const result = Number((a as FoodItem).caloriesPer100g || 0) - Number((b as FoodItem).caloriesPer100g || 0);
      return sort === 'caloriesDesc' ? -result : result;
    }
    if (sort === 'proteinDesc') return Number((b as FoodItem).proteinPer100g || 0) - Number((a as FoodItem).proteinPer100g || 0);
    if (sort === 'expiryAsc') return String(a.expiryDate || '9999-12-31').localeCompare(String(b.expiryDate || '9999-12-31'));
    if (sort === 'recent') return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    return 0;
  });
}

export function allValues(items: FoodItem[], key: keyof FoodItem): string[] {
  return [...new Set(items.flatMap((item) => Array.isArray(item[key]) ? item[key] as string[] : item[key] ? [String(item[key])] : []))].sort((a, b) => a.localeCompare(b));
}
