# Admin · Settings

Generic CRUD for the `site_settings` key/value table (JSONB values).

## Files
- `index.tsx` — orchestrator (search + list + drawer)
- `components/SettingsTable.tsx` — list view
- `components/SettingsEditor.tsx` — key + JSON value editor
- `hooks/useAdminSettings.ts` — React Query hooks

## Reading a setting from the storefront
Use the existing helper:

```ts
import { getSetting } from "@/api/settings";
const banner = await getSetting<{ message: string }>("home_banner");
```

If you read the same key in many places, add a typed wrapper next to `getSetting`.
