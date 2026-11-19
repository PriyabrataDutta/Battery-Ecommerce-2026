-- Ranked product ids for the storefront "popular" lists.
-- Score = units sold in the last 90 days (orders not cancelled/refunded) x 10
--       + bestseller 5 + featured 3 + new 1. Only active, in-stock products.
-- p_group: null = mixed (car and home-power alternate), 'car', or 'home'.
-- Returns ids only, so no sales figures or order data leave the database.
create or replace function public.popular_products(p_group text default null, p_limit int default 8)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  with sales as (
    select oi.product_id, sum(oi.qty)::int as units
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status not in ('cancelled', 'refunded')
      and o.created_at > now() - interval '90 days'
      and oi.product_id is not null
    group by oi.product_id
  ),
  scored as (
    select p.id,
           case when c.slug = 'car-batteries' then 'car' else 'home' end as grp,
           coalesce(s.units, 0) * 10
             + case when p.is_bestseller then 5 else 0 end
             + case when p.is_featured then 3 else 0 end
             + case when p.is_new then 1 else 0 end as score,
           p.created_at
    from products p
    left join categories c on c.id = p.category_id
    left join sales s on s.product_id = p.id
    where p.status = 'active' and p.stock > 0
      and (c.slug is null or c.slug <> 'clearance')
  ),
  ranked as (
    select id, grp, score,
           row_number() over (partition by grp order by score desc, created_at desc) as rn
    from scored
    where p_group is null or grp = p_group
  )
  select id from ranked
  order by rn, case grp when 'car' then 0 else 1 end
  limit greatest(1, least(coalesce(p_limit, 8), 48));
$$;

revoke all on function public.popular_products(text, int) from public;
grant execute on function public.popular_products(text, int) to anon, authenticated;
