# Car battery import — 2026-11-18

Record of the one-off data changes made to kachi-prod from
`Battery_Price_List_With_And_Without_GST.xlsx` (sheet `Developer_Price_List`).
Prices in the sheet include GST. These already ran; they are kept for reference
and for redoing the import, not as part of the app.

| Order | File | What it does |
|---|---|---|
| 1 | `parse-price-list.cjs <xlsx> <out.json>` | Sheet → batteries with prices and car models. Unnamed rows are merged into the battery above. |
| 2 | `audit-price-list.cjs <xlsx>` | Row counts per sheet, unnamed rows, duplicates. |
| 3 | `replace-car-batteries.sql` | Deletes the 5 sample car batteries, adds Exide DIN50R (the `\` row), publishes the 65 drafts as Car Batteries with stock 25. |
| 4 | `remove-wrong-fitment.sql` | Removes car models that came from 5 unnamed-but-priced rows (dropped by the user). |
| 5 | `process-images.sh <image-sources.json> <workdir>` | Downloads official photos, fits them in an ≤800px white square, converts to WebP (q80). |
| 6 | `link-images.sql` | Points each product's `primary_image_url` at `product-images/batteries/<hash>.webp` and registers the files in `media_files`. |

Data files:
- `image-sources.json` — official image URL and page per model (amaron.com, exidecare.com, powerzoneworld.com); `level` is `model` or `range`.
- `image-plan.json` — product → image hash actually used (Amaron 105D31R uses the 105D31L photo).

Run SQL with `supabase db query --linked -f <file>`. Upload images with
`supabase storage cp -r <workdir>/out ss:///product-images/batteries --experimental --linked --content-type image/webp --cache-control "public, max-age=31536000, immutable"`.

Result: 66 active car batteries, 1,231 fitment links, 47 WebP images (768 KB total).
The sheet has 81 rows: 66 named batteries, 8 continuation rows, 1 blank row,
5 unnamed batteries with prices (not imported), 1 TOTAL row.
