import { useState } from "react";
import { useProducts } from "@/hooks/queries/useProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const tabs = [
  { key: "featured", label: "Featured", opts: { isFeatured: true, limit: 8 } },
  { key: "bestsellers", label: "Bestsellers", opts: { isBestseller: true, limit: 8 } },
  { key: "new", label: "New Arrivals", opts: { isNew: true, limit: 8 } },
] as const;

export function ProductTabs() {
  const [active, setActive] = useState<string>("featured");
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  const { data: products = [], isLoading } = useProducts(activeTab.opts);

  return (
    <section className="container-x mt-16 sm:mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow">Top picks</div>
          <h2 className="font-display-tight text-3xl sm:text-4xl font-bold mt-2 text-ink">
            Batteries people trust
          </h2>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-white p-1 shadow-card self-start">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`rounded-full px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                active === t.key
                  ? "bg-ink text-white"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface animate-pulse h-80" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Button asChild size="lg" variant="outline">
          <Link to="/shop">
            View All Products <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
