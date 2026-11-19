import { Link } from "react-router-dom";
import { useCarBrands } from "@/hooks/queries/useBrands";
import { Car } from "lucide-react";

export function CarBrandGrid() {
  const { data: brands = [] } = useCarBrands();
  const displayed = brands.slice(0, 12);

  if (displayed.length === 0) return null;

  return (
    <section className="container-x mt-12 sm:mt-20">
      <SectionHeadInline eyebrow="Find Your Fit" title="Shop by Car Brand" />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
        {displayed.map((b) => (
          <Link
            key={b.id}
            to={`/shop?car_brand=${b.slug}`}
            className="group bg-white border border-line hover:border-primary/40 hover:shadow-card p-4 sm:p-5 flex flex-col items-center gap-2 transition-all hover-lift"
          >
            {b.logo_url ? (
              <img
                src={b.logo_url}
                alt={b.name}
                className="h-10 w-14 sm:h-12 sm:w-16 object-contain transition-transform group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-muted grid place-items-center text-muted-foreground">
                <Car className="h-5 w-5" />
              </div>
            )}
            <span className="font-display text-xs sm:text-sm font-semibold uppercase tracking-wide text-ink text-center leading-tight">
              {b.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeadInline({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">{eyebrow}</div>
      <h2 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 text-ink">{title}</h2>
    </div>
  );
}
