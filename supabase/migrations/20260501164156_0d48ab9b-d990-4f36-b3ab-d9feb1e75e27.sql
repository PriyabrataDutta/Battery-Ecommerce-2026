ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'reviewed' AFTER 'new';
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'quoted' AFTER 'reviewed';