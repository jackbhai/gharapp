import { useMemo, useState } from 'react';
import { Bookmark, Check, RotateCcw, Save, Trash2 } from 'lucide-react';
import { COSMETIC_CATEGORIES, INV_STATUSES, INVENTORY_CATEGORIES, SKIN_TYPES, TASTES, SEASONS, BEST_TIMES, type CosmeticItem, type FilterState, type FoodItem, type InventoryItem, type LocationItem, type ModuleName, type SavedFilter } from '../lib/types';
import { Modal, Button, Chip, Field } from './ui';

function listValue(filters: FilterState, key: string): string[] {
  const value = filters[key];
  return Array.isArray(value) ? value.map(String) : [];
}

function MultiSelect({ options, value, onChange, tone = 'mint', title, labels = {} }: { options: string[]; value: string[]; onChange: (next: string[]) => void; tone?: 'mint' | 'purple' | 'blue'; title: string; labels?: Record<string, string> }) {
  return <div className="filter-group"><div className="filter-label">{title}<small>multi-select</small></div><div className="option-grid">{options.map((option) => { const active = value.map((item) => item.toLowerCase()).includes(option.toLowerCase()); return <button type="button" key={option} className={`option-pill ${active ? `selected ${tone}` : ''}`} onClick={() => onChange(active ? value.filter((item) => item.toLowerCase() !== option.toLowerCase()) : [...value, option])} aria-pressed={active}>{active && <Check size={13} />}{labels[option] ?? option}</button>; })}</div></div>;
}

function RangePair({ label, min, max, minKey, maxKey, filters, onChange }: { label: string; min: number; max: number; minKey: string; maxKey: string; filters: FilterState; onChange: (key: string, value: number | undefined) => void }) {
  const from = Number(filters[minKey] ?? min);
  const to = Number(filters[maxKey] ?? max);
  return <div className="range-group"><div className="filter-label"><span>{label}</span><small>{from === min && to === max ? 'Any' : `${from} – ${to}`}</small></div><div className="range-sliders"><input type="range" min={min} max={max} value={Math.min(from, to)} onChange={(event) => onChange(minKey, Number(event.target.value))} /><input type="range" min={min} max={max} value={Math.max(from, to)} onChange={(event) => onChange(maxKey, Number(event.target.value))} /></div><div className="range-inputs"><input type="number" min={min} max={max} placeholder="Min" value={filters[minKey] == null ? '' : String(filters[minKey])} onChange={(event) => onChange(minKey, event.target.value === '' ? undefined : Number(event.target.value))} /><input type="number" min={min} max={max} placeholder="Max" value={filters[maxKey] == null ? '' : String(filters[maxKey])} onChange={(event) => onChange(maxKey, event.target.value === '' ? undefined : Number(event.target.value))} /></div></div>;
}

function DateRange({ label, prefix, filters, onChange }: { label: string; prefix: string; filters: FilterState; onChange: (key: string, value: string | undefined) => void }) {
  return <div className="date-range"><span className="filter-label">{label}</span><input type="date" value={String(filters[`${prefix}From`] ?? '')} onChange={(event) => onChange(`${prefix}From`, event.target.value || undefined)} /><span>to</span><input type="date" value={String(filters[`${prefix}To`] ?? '')} onChange={(event) => onChange(`${prefix}To`, event.target.value || undefined)} /></div>;
}

export function FilterSheet({ module, filters, items, locations, saved, onApply, onClose, onSave, onDeleteSaved, onUseSaved }: { module: ModuleName; filters: FilterState; items: (FoodItem | InventoryItem | CosmeticItem)[]; locations: LocationItem[]; saved: SavedFilter[]; onApply: (filters: FilterState) => void; onClose: () => void; onSave: (name: string, filters: FilterState) => void; onDeleteSaved: (id: string) => void; onUseSaved: (filter: SavedFilter) => void }) {
  const [draft, setDraft] = useState<FilterState>({ ...filters });
  const [saveName, setSaveName] = useState('');
  const update = (key: string, value: FilterState[string]) => setDraft((current) => { const next = { ...current }; if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete next[key]; else next[key] = value; return next; });
  const toggle = (key: string) => (next: string[]) => update(key, next);
  const foodItems = items as FoodItem[];
  const inventoryItems = items as InventoryItem[];
  const cosmeticItems = items as CosmeticItem[];
  const subCategories = useMemo(() => [...new Set(foodItems.filter((item) => !listValue(draft, 'categories').length || listValue(draft, 'categories').map((value) => value.toLowerCase()).includes(item.category.toLowerCase())).map((item) => item.subCategory).filter(Boolean) as string[])].sort(), [foodItems, draft]);
  const foodTags = useMemo(() => [...new Set(foodItems.flatMap((item) => item.tags ?? []))].sort(), [foodItems]);
  const foodPros = useMemo(() => [...new Set(foodItems.flatMap((item) => item.pros ?? []))].sort(), [foodItems]);
  const customInvCats = [...new Set([...INVENTORY_CATEGORIES, ...inventoryItems.map((item) => item.category).filter(Boolean)])].sort();
  const customCosCats = [...new Set([...COSMETIC_CATEGORIES, ...cosmeticItems.map((item) => item.category).filter(Boolean)])].sort();
  const tone = module === 'cosmetics' ? 'purple' : module === 'inventory' ? 'blue' : 'mint';
  const title = module === 'food' ? 'Food intelligence filters' : module === 'inventory' ? 'Inventory smart filters' : 'Beauty shelf filters';

  return <Modal title={title} description="Search aur selected filters saath me AND logic ke saath apply honge." onClose={onClose} wide>
    <div className="filter-sheet-body">
      {module === 'food' && <>
        <MultiSelect title="Category" options={[...new Set(foodItems.map((item) => item.category).filter(Boolean))].sort()} value={listValue(draft, 'categories')} onChange={toggle('categories')} tone="mint" />
        <MultiSelect title="Sub-category" options={subCategories} value={listValue(draft, 'subCategories')} onChange={toggle('subCategories')} tone="mint" />
        <MultiSelect title="Taste" options={TASTES} value={listValue(draft, 'tastes')} onChange={toggle('tastes')} tone="mint" />
        <MultiSelect title="Season" options={SEASONS} value={listValue(draft, 'seasons')} onChange={toggle('seasons')} tone="mint" />
        <MultiSelect title="Best time to eat" options={BEST_TIMES} value={listValue(draft, 'bestTimes')} onChange={toggle('bestTimes')} tone="mint" />
        <div className="filter-section-title">Nutrition · per 100g</div>
        <RangePair label="Calories · kcal" min={0} max={900} minKey="minCalories" maxKey="maxCalories" filters={draft} onChange={update} />
        <RangePair label="Protein · g" min={0} max={60} minKey="minProtein" maxKey="maxProtein" filters={draft} onChange={update} />
        <RangePair label="Carbs · g" min={0} max={100} minKey="minCarbs" maxKey="maxCarbs" filters={draft} onChange={update} />
        <RangePair label="Fat · g" min={0} max={100} minKey="minFat" maxKey="maxFat" filters={draft} onChange={update} />
        <RangePair label="Fiber · g" min={0} max={40} minKey="minFiber" maxKey="maxFiber" filters={draft} onChange={update} />
        <RangePair label="Sugar · g" min={0} max={100} minKey="minSugar" maxKey="maxSugar" filters={draft} onChange={update} />
        <MultiSelect title="Dietary flags" options={['diabetesFriendly', 'weightLossFriendly', 'kidsFriendly', 'gymFriendly', 'dailyUse']} value={['diabetesFriendly', 'weightLossFriendly', 'kidsFriendly', 'gymFriendly', 'dailyUse'].filter((key) => draft[key] === true)} onChange={(next) => { const current = ['diabetesFriendly', 'weightLossFriendly', 'kidsFriendly', 'gymFriendly', 'dailyUse']; setDraft((old) => { const copy = { ...old }; current.forEach((key) => { if (next.includes(key)) copy[key] = true; else delete copy[key]; }); return copy; }); }} tone="mint" />
        <MultiSelect title="Tags" options={foodTags} value={listValue(draft, 'tags')} onChange={toggle('tags')} tone="mint" />
        <div className="two-field"><Field label="Has specific pro"><select value={String(draft.prosText ?? '')} onChange={(event) => update('prosText', event.target.value || undefined)}><option value="">Any pro</option>{foodPros.map((pro) => <option key={pro}>{pro}</option>)}</select></Field><Field label="Has specific con"><input value={String(draft.consText ?? '')} onChange={(event) => update('consText', event.target.value || undefined)} placeholder="e.g. sugar" /></Field></div>
      </>}
      {module === 'inventory' && <>
        <MultiSelect title="Category" options={customInvCats} value={listValue(draft, 'categories')} onChange={toggle('categories')} tone="blue" />
        <MultiSelect title="Location" options={locations.map((location) => location.id)} labels={Object.fromEntries(locations.map((location) => [location.id, location.name]))} value={listValue(draft, 'locationIds')} onChange={toggle('locationIds')} tone="blue" />
        <div className="option-labels">{locations.filter((location) => listValue(draft, 'locationIds').includes(location.id)).map((location) => <Chip key={location.id} tone="blue">{location.name}</Chip>)}</div>
        <MultiSelect title="Status" options={[...INV_STATUSES]} value={listValue(draft, 'statuses')} onChange={toggle('statuses')} tone="blue" />
        <MultiSelect title="Expiry" options={['safe', 'near', 'expired']} value={listValue(draft, 'expiryStatuses')} onChange={toggle('expiryStatuses')} tone="blue" />
        <RangePair label="Quantity" min={0} max={1000} minKey="minQuantity" maxKey="maxQuantity" filters={draft} onChange={update} />
        <RangePair label="Price · ₹" min={0} max={100000} minKey="minPrice" maxKey="maxPrice" filters={draft} onChange={update} />
        <div className="filter-section-title">Date ranges</div><DateRange label="Purchase date" prefix="purchase" filters={draft} onChange={update} /><DateRange label="MFG date" prefix="mfg" filters={draft} onChange={update} /><DateRange label="Expiry date" prefix="expiry" filters={draft} onChange={update} />
        <Field label="Source / shop"><input value={String(draft.sourceText ?? '')} onChange={(event) => update('sourceText', event.target.value || undefined)} placeholder="e.g. DMart" /></Field>
      </>}
      {module === 'cosmetics' && <>
        <MultiSelect title="Category" options={customCosCats} value={listValue(draft, 'categories')} onChange={toggle('categories')} tone="purple" />
        <MultiSelect title="Skin type" options={SKIN_TYPES} value={listValue(draft, 'skinTypes')} onChange={toggle('skinTypes')} tone="purple" />
        <MultiSelect title="Opened state" options={['Opened', 'Unopened']} value={draft.opened === true ? ['Opened'] : draft.opened === false ? ['Unopened'] : []} onChange={(next) => update('opened', next[0] === 'Opened' ? true : next[0] === 'Unopened' ? false : undefined)} tone="purple" />
        <MultiSelect title="Expiry" options={['safe', 'near', 'expired']} value={listValue(draft, 'expiryStatuses')} onChange={toggle('expiryStatuses')} tone="purple" />
        <MultiSelect title="Location" options={locations.map((location) => location.id)} labels={Object.fromEntries(locations.map((location) => [location.id, location.name]))} value={listValue(draft, 'locationIds')} onChange={toggle('locationIds')} tone="purple" />
        <div className="filter-section-title">Date ranges</div><DateRange label="Purchase date" prefix="purchase" filters={draft} onChange={update} /><DateRange label="MFG date" prefix="mfg" filters={draft} onChange={update} /><DateRange label="Expiry date" prefix="expiry" filters={draft} onChange={update} />
      </>}
    </div>
    <div className="saved-filters"><div className="filter-section-title"><Bookmark size={15} /> Saved filters</div><div className="save-filter-row"><input value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Name this filter…" /><Button variant="soft" size="sm" onClick={() => { if (saveName.trim()) { onSave(saveName.trim(), draft); setSaveName(''); } }}> <Save size={14} /> Save</Button></div>{saved.length > 0 && <div className="saved-list">{saved.map((item) => <div className="saved-item" key={item.id}><span>{item.name}</span><button type="button" onClick={() => onUseSaved(item)}>Use</button><button type="button" className="danger-icon" onClick={() => onDeleteSaved(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div>)}</div>}</div>
    <div className="modal-footer-actions"><Button variant="ghost" onClick={() => setDraft({})}><RotateCcw size={15} /> Reset</Button><Button onClick={() => onApply(draft)}>Apply filters</Button></div>
  </Modal>;
}
