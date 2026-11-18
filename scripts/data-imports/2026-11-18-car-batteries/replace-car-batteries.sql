begin;

-- 1. Remove the 5 sample car batteries (user chose permanent delete; no orders/reviews/wishlist).
delete from products
 where status = 'active'
   and category_id = (select id from categories where slug = 'car-batteries')
   and name in ('Amaron Flo 35Ah Car Battery', 'Amaron Pro 65Ah Car Battery',
                'Elito Charge 60Ah Car Battery', 'Exide Matrix 45Ah Car Battery',
                'Exide Mileage 70Ah Car Battery');

-- 2. The unnamed sheet row, confirmed as Exide DIN50R.
insert into products (name, sku, slug, brand_id, price, mrp, price_with_exchange, price_without_exchange,
                      has_exchange, warranty_months, short_description, stock, status)
values ('Exide DIN50R Automotive Battery', 'EXIDEDIN50RAUTOMOTIVEBATTERY', 'exide-din50r-automotive-battery',
        (select id from battery_brands where slug = 'exide'), 8000, 8000, 5850, 8000,
        true, 48, 'Warranty: 48 MONTHS WARRANTY (24+24)', 0, 'draft');

insert into product_fitment (product_id, car_model_id)
select p.id, m.id from products p, car_models m
 where p.sku = 'EXIDEDIN50RAUTOMOTIVEBATTERY'
   and m.id in ('447bb7b2-35be-4813-8e1b-0220f8e24229', 'dae879c7-86b4-4e55-834b-1e305d582f5d',
                'd418e3a5-077e-443a-bddd-0ed43a53d7d7', '0a51ab1b-054a-47f2-ab87-c1edc74c3ed0',
                'b5a17a24-dad4-4a9b-86c9-eaba16b3bc6b', '22335ada-9c41-44de-acd1-cce534b30860');

-- 3. Publish all price-list batteries as car batteries with stock 25.
update products
   set status = 'active', stock = 25,
       category_id = (select id from categories where slug = 'car-batteries')
 where status = 'draft';

select (select count(*) from products p join categories c on c.id = p.category_id
         where c.slug = 'car-batteries' and p.status = 'active') as car_batteries_active,
       (select count(*) from products where status = 'draft') as drafts_left,
       (select count(*) from products where status = 'active') as all_active,
       (select count(*) from product_fitment) as fitment_links;
commit;
