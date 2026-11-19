/**
 * RelatedProducts — "you might also like" grid at the bottom.
 *
 * Renders nothing when the list is empty, so callers can drop it in
 * unconditionally.
 */
import { ProductCard } from "@/components/products/ProductCard";

type Product = Parameters<typeof ProductCard>[0]["product"];

export const RelatedProducts = ({ products }: { products: Product[] }) => {
  if (products.length === 0) return null;
  return (
    <section className="mt-14 sm:mt-20">
      <div className="eyebrow">More from this brand</div>
      <h2 className="font-display-tight text-2xl sm:text-3xl font-bold mt-2 mb-5 sm:mb-7 text-ink">
        You may also like
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
