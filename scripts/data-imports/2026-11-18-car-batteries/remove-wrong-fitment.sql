-- Unnamed-but-priced rows (30, 43, 46, 47) were merged into the battery above
-- them by parse-price-list.cjs; the user chose to drop those batteries, so
-- their car models are removed from the batteries they were wrongly attached to.
delete from product_fitment f using products p, car_models cm,
  (values
    ('Exide DIN100 Automotive Battery', 'TATA NEXON (DIESEL)'),
    ('Exide DIN100 Automotive Battery', 'CIAZ DIESEL (AFTER 2016)'),
    ('Exide DIN100 Automotive Battery', 'VITTARA BREEZA(DIESEL)'),
    ('Amaron DIN74 Automotive Battery', 'TUCSON DIESEL (ABOVE 2022)'),
    ('Exide 80D23R Automotive Battery', 'TOYOTA VELFIRE')
  ) as bad(pname, mname)
 where f.product_id = p.id and f.car_model_id = cm.id
   and p.name = bad.pname and cm.name = bad.mname;
