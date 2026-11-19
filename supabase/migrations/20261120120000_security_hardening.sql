-- Security hardening (audit 2026-11-20, items 5–7). Additive policy/grant/config changes.

-- 5. Customers may file a return only for their own order (and an item of that order).
drop policy if exists returns_self_insert on public.return_requests;
create policy returns_self_insert on public.return_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
    and (order_item_id is null
         or exists (select 1 from public.order_items i where i.id = order_item_id and i.order_id = return_requests.order_id))
  );

-- 6. Customers can no longer mark their own phone as verified. Only verify_phone_code()
--    (security definer) and the phone trigger change these columns.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, company, updated_at) on public.profiles to authenticated;

-- 7. Upload limits. Customer buckets: images only, 5 MB. Staff buckets: images (+SVG for logos), 5 MB.
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp']
  where id in ('review-images', 'return-images');
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml']
  where id in ('media', 'brand-logos', 'product-images', 'blog');
update storage.buckets set file_size_limit = 20971520, allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
  where id in ('catalogs', 'quote-uploads');
