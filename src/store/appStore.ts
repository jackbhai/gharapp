import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState, ModuleName } from '../lib/types';
import { todayISO } from '../lib/date';

export type TabKey = 'home' | 'food' | 'inventory' | 'cosmetics' | 'planner' | 'chat' | 'more';

type ModuleRecord<T> = Record<ModuleName, T>;

interface AppState {
  activeTab: TabKey;
  profileId: string;
  profileName: string;
  search: ModuleRecord<string>;
  filters: ModuleRecord<FilterState>;
  sort: ModuleRecord<string>;
  limits: ModuleRecord<number>;
  planDate: string;
  trackerDate: string;
  theme: 'dark' | 'light';
  fontScale: number;
  setActiveTab: (tab: TabKey) => void;
  setProfile: (id: string, name: string) => void;
  setSearch: (module: ModuleName, value: string) => void;
  setFilters: (module: ModuleName, filters: FilterState) => void;
  patchFilters: (module: ModuleName, filters: FilterState) => void;
  setSort: (module: ModuleName, sort: string) => void;
  resetLimit: (module: ModuleName) => void;
  loadMore: (module: ModuleName) => void;
  setPlanDate: (date: string) => void;
  setTrackerDate: (date: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontScale: (scale: number) => void;
}

const initialModules = <T,>(value: T): ModuleRecord<T> => ({ food: value, inventory: value, cosmetics: value });

/** Lightweight persisted UI store. Domain records remain normalized in Dexie. */
export const useAppStore = create<AppState>()(persist((set) => ({
  activeTab: 'home',
  profileId: 'profile_default',
  profileName: 'Mera ghar',
  search: initialModules(''),
  filters: initialModules({}),
  sort: { food: 'nameAsc', inventory: 'expiryAsc', cosmetics: 'nameAsc' },
  limits: initialModules(60),
  planDate: todayISO(),
  trackerDate: todayISO(),
  theme: 'dark',
  fontScale: 1,
  setActiveTab: (activeTab) => set({ activeTab }),
  setProfile: (profileId, profileName) => set({ profileId, profileName, limits: initialModules(60) }),
  setSearch: (module, value) => set((state) => ({ search: { ...state.search, [module]: value }, limits: { ...state.limits, [module]: 60 } })),
  setFilters: (module, filters) => set((state) => ({ filters: { ...state.filters, [module]: filters }, limits: { ...state.limits, [module]: 60 } })),
  patchFilters: (module, filters) => set((state) => ({ filters: { ...state.filters, [module]: { ...state.filters[module], ...filters } }, limits: { ...state.limits, [module]: 60 } })),
  setSort: (module, sort) => set((state) => ({ sort: { ...state.sort, [module]: sort }, limits: { ...state.limits, [module]: 60 } })),
  resetLimit: (module) => set((state) => ({ limits: { ...state.limits, [module]: 60 } })),
  loadMore: (module) => set((state) => ({ limits: { ...state.limits, [module]: state.limits[module] + 60 } })),
  setPlanDate: (planDate) => set({ planDate }),
  setTrackerDate: (trackerDate) => set({ trackerDate }),
  setTheme: (theme) => set({ theme }),
  setFontScale: (fontScale) => set({ fontScale }),
}), {
  name: 'gharapp-react-ui',
  partialize: (state) => ({
    activeTab: state.activeTab,
    profileId: state.profileId,
    profileName: state.profileName,
    search: state.search,
    filters: state.filters,
    sort: state.sort,
    planDate: state.planDate,
    trackerDate: state.trackerDate,
    theme: state.theme,
    fontScale: state.fontScale,
  }),
}));
