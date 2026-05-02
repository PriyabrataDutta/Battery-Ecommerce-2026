export type Money = number;

export interface BatteryBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
}

export interface CarBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface CarModel {
  id: string;
  car_brand_id: string;
  name: string;
  slug: string;
  years: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  mrp: number | null;
  price_with_exchange: number;
  price_without_exchange: number;
  stock: number;
  warranty_months: number | null;
  capacity_ah: number | null;
  short_description: string | null;
  description: string | null;
  specs: Record<string, string>;
  badges: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  status: string;
  primary_image_url: string | null;
  has_exchange: boolean;
  exchange_rebate: number;
  gst_rate_id?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  tags?: string[];
  battery_brands?: BatteryBrand | null;
  categories?: Category | null;
  /** Joined from product_images table (included in getProductBySlug) */
  product_images?: ProductImage[];
}

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  priceWithExchange: number;
  priceWithoutExchange: number;
  qty: number;
  image: string | null;
  withExchange?: boolean;
  /** GST rate slab assigned to this product */
  gst_rate_id?: string | null;
  /** @deprecated kept for old localStorage compat */
  exchangeRebate?: number;
}
