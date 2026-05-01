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
    <section className="mt-12 sm:mt-14">
      <h2 className="font-display-tight text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Related Products
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
