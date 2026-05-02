## Add HSN Code to Product Categories

When creating or editing a category, users will be required to enter an HSN code. This code will be stored on the category and displayed in the categories table.

### Changes

**1. Database migration** — Add `hsn_code text` column to `categories` table (nullable initially so existing categories aren't broken, but the UI will enforce it going forward).

**2. `src/api/admin/categories.ts`** — Add `hsn_code` to `CategoryEditableFields` interface and `EMPTY_CATEGORY` default.

**3. `src/pages/admin/categories/components/CategoryEditor.tsx`** — Add an HSN Code input field (required). Block save if HSN code is empty with a toast error.

**4. `src/pages/admin/categories/components/CategoriesTable.tsx`** — Add an "HSN Code" column to the table so it's visible at a glance.

### Technical details

- Migration: `ALTER TABLE public.categories ADD COLUMN hsn_code text;`
- The UI will mark HSN code as required with a red asterisk and validate on save.
- Existing categories without HSN codes will show "—" in the table and will need to be updated when edited.
