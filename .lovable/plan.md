## Goal

Upgrade the search bar in the header (next to the logo) to behave like Myntra: a single search box that understands many kinds of intent and shows live suggestions as the user types.

Examples that should work:
- "car battery" → shows the Car Batteries category + all car batteries
- "inverter" → Inverter & UPS category + matching products
- "amaron" → Amaron brand page + all Amaron products
- "baleno" → Baleno car model + all batteries that fit Baleno
- "exide 150ah" → Exide products around 150 Ah
- "din65" / SKU → matches products by name/SKU

## UX

Live suggestions dropdown under the header search input (desktop + mobile drawer):

```text
┌─────────────────────────────────────────┐
│ [Search batteries, brands, models...] 🔍│
├─────────────────────────────────────────┤
│ CATEGORIES                              │
│  • Car Batteries                        │
│  • Inverter & UPS                       │
│ BRANDS                                  │
│  • Amaron                               │
│ CAR MODELS                              │
│  • Maruti Baleno  → Batteries for Baleno│
│ PRODUCTS                                │
│  [img] Amaron DIN65  ₹6,499             │
│  [img] Exide MILEAGE ₹5,899             │
│ ─────────────────────────────────────── │
│  See all results for "baleno"           │
└─────────────────────────────────────────┘
```

- Debounced (~200ms) as the user types.
- Keyboard support: ↑/↓ to navigate, Enter to select, Esc to close.
- Click outside or selecting an item closes the dropdown.
- Pressing Enter with no selection navigates to `/shop?q=<term>` (current behavior, kept as fallback).
- "See all results for X" link at the bottom goes to `/shop?q=X`.

## Routing behavior on selection

- Category → `/category/<slug>`
- Battery brand → `/brand/<slug>`
- Car model → `/shop?type=car-batteries&car_model=<slug>` (uses existing fitment filter)
- Product → `/product/<slug>` (existing detail route)
- Free text fallback → `/shop?q=<term>`

## Shop page upgrade (so "See all results" works well)

Currently `/shop?q=` only matches `name` and `sku`. Extend it so a term like "baleno" or "amaron" still returns useful results from the shop page:

1. If `q` exactly matches a `car_models.slug` or name, auto-apply the car model fitment filter.
2. If `q` matches a `battery_brands.slug` or name, auto-apply the brand filter.
3. Otherwise fall back to current name/SKU `ilike` filter (broaden to also match `short_description`).

## Technical implementation

New component: `src/components/search/SmartSearch.tsx`
- Replaces the inline `<form>` + `<Input>` block currently in `src/components/layout/Header.tsx` (and reused in the mobile drawer).
- Internal state: `term`, `open`, `activeIndex`.
- Uses `useQuery` with key `["smart_search", debouncedTerm]`, enabled when term length ≥ 2.
- Single query function runs 4 parallel Supabase calls with `Promise.all`:
  - `categories`: `select('name,slug').ilike('name', %q%).limit(4)`
  - `battery_brands`: `select('name,slug').ilike('name', %q%).limit(4)`
  - `car_models`: `select('name,slug, car_brands(name)').ilike('name', %q%).limit(5)`
  - `products`: `select('id,name,slug,sku,price,primary_image_url,battery_brands(slug,name)').eq('status','active').or(\`name.ilike.%q%,sku.ilike.%q%,short_description.ilike.%q%\`).limit(6)`
- Results grouped and rendered in the dropdown described above.
- Use `useRef` + click-outside hook to close the panel.

Header changes (`src/components/layout/Header.tsx`):
- Remove existing local `search` state and inline form.
- Render `<SmartSearch />` in the desktop header (where the form is now) and inside the mobile drawer.

Shop page changes (`src/pages/Shop.tsx`):
- Extend the query function so when `q` is present, also try to resolve it to a battery brand or car model and apply those filters in addition to the text match. This makes the "See all results for baleno" link return Baleno-fitting batteries.

No DB schema changes. No new dependencies. All data already exists in `products`, `categories`, `battery_brands`, `car_models`, and `product_fitment`.

## Out of scope

- Search analytics / popular searches.
- Typo tolerance / fuzzy matching beyond Postgres `ilike` (can be added later with `pg_trgm` if desired).
- Recent searches history.
