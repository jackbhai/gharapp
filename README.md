# GharApp React

A mobile-first, local-first household command center rebuilt with React, Vite and TypeScript.

## Stack

- React 19 + TypeScript + Vite 6
- Zustand for UI state and persisted filters/search preferences
- Dexie for IndexedDB, keeping the existing `gharapp_db` name for migration
- Zod + React Hook Form for safe forms and required-field validation
- Lucide React for accessible icons
- Vite PWA plugin for production service-worker generation
- Custom CSS design system for the premium AMOLED-black/glass mobile UI

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Production build:

```bash
npm run build
npm run preview
```

## Modules

- Home dashboard with profiles, expiry badge and quick actions
- Food library with search autocomplete, multi-filter sheet, ranges, saved filters and pagination
- Inventory and Beauty shelves with date/status/location/price filters, photos, barcode fallback and details
- Meal planner with a week strip and nutrition totals
- Smart shopping list generated from reorder levels
- Daily nutrition tracker and seven-day history
- Optional OpenRouter assistant with Hinglish prompts, voice input, image attachment and retry UX
- JSON import/export with update/merge/skip duplicate policies and CSV exports
- Theme, high-contrast, font-size, reminders and family profiles

## Data & privacy

The app stores records locally in IndexedDB. It falls back to localStorage if IndexedDB is unavailable in a file/WebView context. AI and barcode lookup only call the network after the user chooses to configure/use them.

The database migration normalizes legacy nutrition fields to two decimals, including values such as `15.180000000000001 → 15.18`.
