export type ModuleName = 'food' | 'inventory' | 'cosmetics';
export type FoodMode = 'raw' | 'cooked';

export interface FoodItem {
  id: string;
  name: string;
  foodType?: FoodMode;
  image?: string;
  imageEmoji?: string;
  category: string;
  subCategory?: string;
  tasteTags?: string[];
  season?: string[];
  bestTimeToEat?: string;
  howToEat?: string;
  recommendedDailyAmount?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  micronutrients?: Record<string, number>;
  glycemicIndex?: number | null;
  allergens?: string[];
  preparationMethods?: string[];
  pros?: string[];
  cons?: string[];
  benefits?: string[];
  sideEffects?: string[];
  storageNotes?: string;
  diabetesFriendly?: number | boolean;
  weightLossFriendly?: number | boolean;
  kidsFriendly?: number | boolean;
  gymFriendly?: number | boolean;
  dailyUse?: number | boolean;
  recipeSearchQuery?: string;
  recipeTitle?: string;
  recipeIngredients?: string[];
  recipeSteps?: string[];
  tags?: string[];
  cuisineStyle?: string;
  regions?: string[];
  mealTypes?: string[];
  goodForHealthGoals?: string[];
  servingSizeG?: number;
  cookingTimeMin?: number;
  priceTier?: string;
  isVeg?: number | boolean;
  isVegan?: number | boolean;
  isGlutenFree?: number | boolean;
  isJain?: number | boolean;
  isEgg?: number | boolean;
  allergenTags?: string[];
  createdAt?: string;
  [key: string]: unknown;
}

export interface InventoryItem {
  id: string;
  profileId: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  mfgDate?: string;
  expiryDate?: string;
  status: 'unopened' | 'opened' | 'consumed';
  locationId?: string | null;
  locationDetails?: string;
  price?: number;
  source?: string;
  barcode?: string;
  reorderLevel?: number;
  photoData?: string | null;
  notes?: string;
  alertBeforeDays?: number;
  archived?: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CosmeticItem {
  id: string;
  profileId: string;
  name: string;
  brand?: string;
  category: string;
  skinType: string[];
  opened: boolean;
  ingredients?: string;
  concerns: string[];
  rating?: number;
  purchaseDate?: string;
  mfgDate?: string;
  expiryDate?: string;
  locationId?: string | null;
  notes?: string;
  howToUse?: string;
  photoData?: string | null;
  alertBeforeDays?: number;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface LocationItem {
  id: string;
  name: string;
  type?: string;
  profileId?: string;
}

export interface Profile {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
}

export interface AppSettings {
  id?: string;
  theme: 'dark' | 'light';
  contrast?: 'normal' | 'high';
  fontScale: number;
  alertBeforeDays: number;
  cosmeticAlertDays: number;
  defaultUnit: string;
  dailyReminder: boolean;
  onboardingDone?: boolean;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  [key: string]: unknown;
}

export interface MealPlanItem {
  id: string;
  profileId: string;
  date: string;
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: string;
  quantity: number;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  profileId: string;
  name: string;
  quantity?: string;
  source: 'auto' | 'manual';
  inventoryId?: string;
  completed: boolean;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  profileId: string;
  date: string;
  foodId: string;
  quantity: number;
  createdAt: string;
}

export interface SavedFilter {
  id: string;
  module: ModuleName;
  foodMode?: FoodMode;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export type FilterState = Record<string, string | number | boolean | string[] | undefined>;

export const INVENTORY_CATEGORIES = ['Groceries', 'Staples', 'Snacks', 'Beverages', 'Cleaning', 'Laundry', 'Kitchen', 'Baby Care', 'Pet Care', 'Medicine', 'Other'];
export const COSMETIC_CATEGORIES = ['Skincare', 'Haircare', 'Makeup', 'Fragrance', 'Bodycare', 'Oral Care', 'Other'];
export const SKIN_TYPES = ['Dry', 'Oily', 'Sensitive', 'Combination', 'Normal'];
export const TASTES = ['sweet', 'salty', 'spicy', 'bitter', 'sour', 'umami', 'neutral'];
export const SEASONS = ['summer', 'winter', 'monsoon', 'all'];
export const BEST_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Any time'];
export const INV_STATUSES = ['unopened', 'opened', 'consumed'] as const;

export type StoredRecord = FoodItem | InventoryItem | CosmeticItem | LocationItem | Profile | AppSettings | MealPlanItem | ShoppingItem | DailyLog | SavedFilter;
