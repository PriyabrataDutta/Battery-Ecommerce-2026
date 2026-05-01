import type { ProductEditableFields } from "@/api/admin/products";

/**
 * Default values used when opening the editor in "create" mode.
 * Aligns with the DB column defaults — keep in sync with the
 * `products` table schema.
 */
export const EMPTY_PRODUCT: ProductEditableFields = {
  name: "",
  slug: "",
  sku: "",
  brand_id: null,
  category_id: null,
  price: 0,
  mrp: null,
  stock: 0,
  capacity_ah: null,
  warranty_months: null,
  short_description: null,
  description: null,
  primary_image_url: null,
  status: "draft",
  is_featured: false,
  is_bestseller: false,
  is_new: false,
  is_on_sale: false,
  has_exchange: true,
  exchange_rebate: 0,
};

export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
