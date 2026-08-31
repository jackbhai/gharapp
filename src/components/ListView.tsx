import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ChevronRight, Filter, Play, Plus, Search, ShoppingCart } from 'lucide-react';
import type { CosmeticItem, FilterState, FoodItem, InventoryItem, LocationItem, ModuleName } from '../lib/types';
import { filterAndSort } from '../lib/filterEngine';
import { formatDate, getExpiryStatus } from '../lib/date';
import { normalizeFood, round2 } from '../lib/normalize';
import { useAppStore } from '../store/appStore';
import { Button, Card, Chip, EmptyState } from './ui';

export function FilterChips({ module, filters, onRemove, onClear }: { module: ModuleName; filters: FilterState; onRemove: (key: string, value?: string) => void; onClear: () => void }) {
  const labels: Record<string, string> = { categories: 'Category', subCategories: 'Sub-category', cuisines: 'Cuisine', regions: 'Region', tastes: 'Taste', seasons: 'Season', bestTimes: 'Meal time', mealTypes: 'Meal type', healthGoals: 'Health goal', tags: 'Tag', allergens: 'Allergen', skinTypes: 'Skin type', concerns: 'Concern', locationIds: 'Location', statuses: 'Status', expiryStatuses: 'Expiry', smartFlags: 'Smart', prosText: 'Pro', consText: 'Con', sourceText: 'Source', ingredientsText: 'Ingredient', opened: 'Opened' };
  const chips: { key: string; value?: string; label: string }[] = [];
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'sort' || key.startsWith('min') || key.startsWith('max') || key.endsWith('From') || key.endsWith('To') || value === undefined || value === '' || value === false) return;
    if (Array.isArray(value)) value.forEach((item) => chips.push({ key, value: String(item), label: `${labels[key] ?? key}: ${item}` }));
    else chips.push({ key, label: `${labels[key] ?? key}: ${String(value)}` });
  });
  const ranges = [['Calories', 'minCalories', 'maxCalories'], ['Protein', 'minProtein', 'maxProtein'], ['Carbs', 'minCarbs', 'maxCarbs'], ['Fat', 'minFat', 'maxFat'], ['Fiber', 'minFiber', 'maxFiber'], ['Sugar', 'minSugar', 'maxSugar'], ['GI', 'minGI', 'maxGI'], ['Cooking time', 'minCookingTime', 'maxCookingTime'], ['Rating', 'minRating', 'maxRating'], ['Quantity', 'minQuantity', 'maxQuantity'], ['Price', 'minPrice', 'maxPrice']];
  ranges.forEach(([label, min, max]) => { if (filters[min] !== undefined || filters[max] !== undefined) chips.push({ key: min, label: `${label}: ${filters[min] ?? 0}–${filters[max] ?? '∞'}` }); });
  if (!chips.length) return null;
  return <div className="active-filter-row"><div className="active-filter-scroll">{chips.map((chip) => <Chip key={`${chip.key}-${chip.value}`} tone={module === 'cosmetics' ? 'purple' : module === 'inventory' ? 'blue' : 'mint'} removable onRemove={() => onRemove(chip.key, chip.value)}>{chip.label}</Chip>)}</div><button type="button" className="clear-filters" onClick={onClear}>Clear</button></div>;
}

function SearchSuggestions({ module, query, items, onSelect }: { module: ModuleName; query: string; items: (FoodItem | InventoryItem | CosmeticItem)[]; onSelect: (value: string) => void }) {
  if (!query.trim()) return null;
  const q = query.toLowerCase();
  const values = new Map<string, string>();
  items.forEach((item) => {
    const candidates: [string, string | undefined][] = [['Item', item.name], ['Category', item.category]];
    if (module === 'food') (item as FoodItem).tags?.forEach((tag) => candidates.push(['Tag', tag]));
    candidates.forEach(([kind, value]) => { if (value && value.toLowerCase().includes(q) && values.size < 7) values.set(`${kind}:${value}`, value); });
  });
  if (!values.size) return null;
  return <div className="suggestion-menu">{[...values.entries()].map(([key, value]) => <button type="button" className="suggestion-row" key={key} onClick={() => onSelect(value)}><Search size={14} /><span>{value}</span><small>{key.split(':')[0]}</small></button>)}</div>;
}

const sortLabels: Record<string, string> = { nameAsc: 'Name A–Z', nameDesc: 'Name Z–A', caloriesAsc: 'Calories low–high', caloriesDesc: 'Calories high–low', proteinDesc: 'Protein high–low', expiryAsc: 'Expiry soon first', recent: 'Recently added' };

export function ListView({ module, items, locations, onFilter, onOpenDetail, onAdd, onQuickFilter, onRemoveFilter, onClearFilters, onAddToShopping }: { module: ModuleName; items: (FoodItem | InventoryItem | CosmeticItem)[]; locations: LocationItem[]; onFilter: () => void; onOpenDetail: (id: string) => void; onAdd?: () => void; onQuickFilter: (filters: FilterState) => void; onRemoveFilter: (key: string, value?: string) => void; onClearFilters: () => void; onAddToShopping?: (item: InventoryItem) => void }) {
  const query = useAppStore((state) => state.search[module]);
  const filters = useAppStore((state) => state.filters[module]);
  const sort = useAppStore((state) => state.sort[module]);
  const limit = useAppStore((state) => state.limits[module]);
  const setSearch = useAppStore((state) => state.setSearch);
  const setSort = useAppStore((state) => state.setSort);
  const loadMore = useAppStore((state) => state.loadMore);
  const [draftQuery, setDraftQuery] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => setDraftQuery(query), [query]);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(module, draftQuery), 280); return () => window.clearTimeout(timer); }, [draftQuery, module, setSearch]);

  const filtered = useMemo(() => filterAndSort(items as never[], module, query, filters, sort) as (FoodItem | InventoryItem | CosmeticItem)[], [items, module, query, filters, sort]);
  const shown = filtered.slice(0, limit);
  const tone = module === 'cosmetics' ? 'purple' : module === 'inventory' ? 'blue' : 'mint';
  const title = module === 'food' ? 'Food library' : module === 'inventory' ? 'Home inventory' : 'Beauty shelf';
  const subtitle = module === 'food' ? `${filtered.length} nourishing choices` : module === 'inventory' ? `${filtered.length} things at home` : `${filtered.length} products tracked`;

  return <section className="module-screen">
    <div className="module-heading"><div><span className="eyebrow">{module === 'food' ? 'DISCOVER' : module === 'inventory' ? 'ORGANIZE' : 'CARE'}</span><h2>{title}</h2><p>{subtitle}</p></div>{onAdd && <Button size="sm" onClick={onAdd}><Plus size={15} /> Add</Button>}</div>
    <div className="search-toolbar"><div className="search-box"><Search size={17} /><input type="search" aria-label={`Search ${title}`} placeholder={module === 'food' ? 'Search name, category, tag…' : 'Search name, brand, source…'} value={draftQuery} onFocus={() => setShowSuggestions(true)} onChange={(event) => { setDraftQuery(event.target.value); setShowSuggestions(true); }} /><button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setDraftQuery(''); setShowSuggestions(false); }}>×</button>{showSuggestions && <SearchSuggestions module={module} query={draftQuery} items={items} onSelect={(value) => { setDraftQuery(value); setShowSuggestions(false); }} />}</div><Button variant={tone === 'purple' ? 'soft' : 'secondary'} onClick={onFilter}><Filter size={16} /> Filters{Object.keys(filters).length > 0 && <b className="filter-count">{Object.keys(filters).filter((key) => filters[key] !== undefined).length}</b>}</Button></div>
    <div className="quick-filter-row">{module === 'food' && <><button type="button" className="quick-pill" onClick={() => onQuickFilter({ minProtein: 15 })}>💪 High protein</button><button type="button" className="quick-pill" onClick={() => onQuickFilter({ maxCalories: 150 })}>🥗 Low calorie</button><button type="button" className="quick-pill" onClick={() => onQuickFilter({ seasons: ['winter'] })}>❄️ Winter</button><button type="button" className="quick-pill" onClick={() => onQuickFilter({ seasons: ['summer'] })}>☀️ Summer</button><button type="button" className="quick-pill" onClick={() => onQuickFilter({ kidsFriendly: true })}>🧒 Kids</button><button type="button" className="quick-pill" onClick={() => onQuickFilter({ gymFriendly: true })}>🏋 Gym</button></>}{module === 'inventory' && <><button type="button" className="quick-pill quick-blue" onClick={() => onQuickFilter({ expiryStatuses: ['near', 'expired'] })}>⏰ Today’s expiring</button><button type="button" className="quick-pill quick-blue" onClick={() => onQuickFilter({ statuses: ['opened'] })}>Opened</button><button type="button" className="quick-pill quick-blue" onClick={() => onQuickFilter({ statuses: ['consumed'] })}>Consumed</button></>}{module === 'cosmetics' && <><button type="button" className="quick-pill quick-purple" onClick={() => onQuickFilter({ expiryStatuses: ['near', 'expired'] })}>⏰ Expiring</button><button type="button" className="quick-pill quick-purple" onClick={() => onQuickFilter({ opened: true })}>Opened</button><button type="button" className="quick-pill quick-purple" onClick={() => onQuickFilter({ opened: false })}>Unopened</button></>}</div>
    <FilterChips module={module} filters={filters} onRemove={onRemoveFilter} onClear={onClearFilters} />
    <div className="list-control"><span><ArrowDownUp size={14} /> Sort</span><select value={sort} onChange={(event) => setSort(module, event.target.value)} aria-label="Sort list">{Object.entries(sortLabels).filter(([key]) => module === 'food' || !key.startsWith('calories') && key !== 'proteinDesc').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="result-count">{filtered.length} results</span></div>
    <div className="list-stack">{shown.length ? shown.map((item) => module === 'food' ? <FoodRow key={item.id} item={item as FoodItem} onOpen={() => onOpenDetail(item.id)} /> : module === 'inventory' ? <InventoryRow key={item.id} item={item as InventoryItem} locations={locations} onOpen={() => onOpenDetail(item.id)} onAddToShopping={onAddToShopping} /> : <CosmeticRow key={item.id} item={item as CosmeticItem} onOpen={() => onOpenDetail(item.id)} />) : <EmptyState icon={module === 'food' ? '🍽️' : module === 'inventory' ? '📦' : '✨'} title={query || Object.keys(filters).length ? 'No matching items' : module === 'food' ? 'Food library is empty' : module === 'inventory' ? 'Your shelf is clear' : 'Your beauty shelf is clear'} description={query || Object.keys(filters).length ? 'Try a different search or clear one of the filters.' : 'Add your first item and GharApp will keep it organized.'} action={onAdd && <Button onClick={onAdd}><Plus size={16} /> Add first item</Button>} />}</div>
    {shown.length < filtered.length && <div className="load-more"><span>Showing {shown.length} of {filtered.length}</span><Button variant="secondary" onClick={() => loadMore(module)}>Load 60 more</Button></div>}
  </section>;
}

function FoodRow({ item, onOpen }: { item: FoodItem; onOpen: () => void }) { return <Card className="item-row" onClick={onOpen}><div className="row-icon food-icon">🥗</div><div className="row-content"><h3>{item.name}</h3><p>{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</p><div className="row-chips">{(item.tags ?? []).slice(0, 2).map((tag) => <Chip key={tag}>{tag}</Chip>)}<Chip>{round2(item.caloriesPer100g)} kcal</Chip><Chip>P {round2(item.proteinPer100g)}g</Chip></div></div><button type="button" className="row-action" onClick={(event) => { event.stopPropagation(); window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.recipeSearchQuery || `${item.name} recipe`)}`, '_blank', 'noopener'); }} aria-label="Open recipe"><Play size={16} fill="currentColor" /></button><ChevronRight className="row-chevron" size={17} /></Card>; }

function InventoryRow({ item, locations, onOpen, onAddToShopping }: { item: InventoryItem; locations: LocationItem[]; onOpen: () => void; onAddToShopping?: (item: InventoryItem) => void }) { const status = getExpiryStatus(item.expiryDate, item.alertBeforeDays);const location=locations.find((value)=>value.id===item.locationId)?.name;return <Card className="item-row" onClick={onOpen}><div className="row-icon inventory-icon">{item.photoData ? <img src={item.photoData} loading="lazy" alt="" /> : '📦'}</div><div className="row-content"><h3>{item.name}</h3><p>{item.brand || item.category} · {round2(item.quantity)} {item.unit}</p><p>{location ? `📍 ${location} · ` : ''}{item.expiryDate ? `Expires ${formatDate(item.expiryDate)}` : 'No expiry date'}</p><div className="row-chips">{item.reorderLevel && item.quantity <= item.reorderLevel ? <Chip tone="yellow">Low stock</Chip> : null}{item.barcode ? <Chip>▦ {item.barcode}</Chip> : null}</div></div><div className="row-right"><span className={`status-badge status-${status}`}>{status === 'near' ? 'Soon' : status}</span>{onAddToShopping && <button type="button" className="mini-action" onClick={(event) => { event.stopPropagation(); onAddToShopping(item); }} aria-label="Add to shopping list"><ShoppingCart size={14} /></button>}</div></Card>; }

function CosmeticRow({ item, onOpen }: { item: CosmeticItem; onOpen: () => void }) { const status=getExpiryStatus(item.expiryDate,item.alertBeforeDays);return <Card className="item-row" onClick={onOpen}><div className="row-icon beauty-icon">{item.photoData?<img src={item.photoData} loading="lazy" alt="" />:'✨'}</div><div className="row-content"><h3>{item.name}</h3><p>{item.brand || item.category} · {item.opened ? 'Opened' : 'Unopened'}</p><p>{item.expiryDate ? `Expires ${formatDate(item.expiryDate)}` : 'No expiry date'}</p><div className="row-chips">{(item.skinType ?? []).slice(0,2).map((skin)=><Chip tone="purple" key={skin}>{skin}</Chip>)}{item.rating ? <Chip tone="purple">★ {item.rating}/5</Chip> : null}</div></div><span className={`status-badge status-${status}`}>{status === 'near' ? 'Soon' : status}</span></Card>; }
