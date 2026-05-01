# Admin · Brands

CRUD panel for the `battery_brands` table.

## Files
- `index.tsx` — orchestrator (state + composition)
- `components/BrandsToolbar.tsx` — search + "New brand" button
- `components/BrandsTable.tsx` — list view (uses shared `EntityTable`)
- `components/BrandEditor.tsx` — create/edit side drawer
- `hooks/useAdminBrands.ts` — React Query hooks (list + mutations)

## Add a column to the list
Edit `components/BrandsTable.tsx` and add an entry to the `columns` array.

## Add an editable field
1. Add the column to the DB (migration).
2. Add it to `BrandEditableFields` in `src/api/admin/brands.ts` and `EMPTY_BRAND`.
3. Add a `<Field>` to `BrandEditor.tsx` and wire it to `set("your_field", ...)`.
