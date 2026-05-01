# Admin · Categories

CRUD panel for the `categories` table (supports optional `parent_id`).

## Files
- `index.tsx` — orchestrator
- `components/CategoriesToolbar.tsx` — search + "New category"
- `components/CategoriesTable.tsx` — list view
- `components/CategoryEditor.tsx` — create/edit drawer
- `hooks/useAdminCategories.ts` — React Query hooks

## Add a field
1. Add the DB column via migration.
2. Add it to `CategoryEditableFields` and `EMPTY_CATEGORY` in
   `src/api/admin/categories.ts`.
3. Add a `<Field>` to `CategoryEditor.tsx`.
