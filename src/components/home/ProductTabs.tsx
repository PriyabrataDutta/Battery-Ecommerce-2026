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
    <section className="container-x mt-12 sm:mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">
            Top Picks
          </div>
          <h2 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 text-ink">
            Our Products
          </h2>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg self-start">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors rounded-md ${
                active === t.key
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-line animate-pulse h-72 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
