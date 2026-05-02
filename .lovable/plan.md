## Overview

Add pagination to the Shop product listing — 20 products per page, page number in URL (`?page=2`), with Previous/Next/numbered controls using the existing shadcn Pagination component.

**Why client-side pagination?** The current architecture fetches all products to compute filter counts (battery brand counts, price bounds). Moving to true server-side pagination would break these counts or require a separate count query per filter value. Client-side pagination gives the same UX benefit (smaller DOM, faster render) without adding DB calls.

---

## Changes

### Edit `src/pages/Shop.tsx`

1. **Read page from URL**: `const page = Math.max(1, Number(params.get("page")) || 1)`
2. **Compute pagination**: After `sorted` is computed:
  - `PAGE_SIZE = 20`
  - `totalPages = Math.ceil(sorted.length / PAGE_SIZE)`
  - `paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
3. **Auto-reset**: When filters change the result count, reset to page 1
4. **Scroll to grid top** on page change for smooth UX
5. **Render `paged` instead of `sorted**` in the product grid
6. **Add pagination controls** below the grid using the existing `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` components from `src/components/ui/pagination.tsx`
7. **Page info** in the product count line: "48 products · Page 2 of 3"
8. **Smart page numbers**: Show pages 1...3 4 5...10 with ellipsis for large catalogs

No new files, no new dependencies, no database changes.  
  
Fix UI/UX where neeed every cm you should check on all device. check alingment of the shop page.

&nbsp;