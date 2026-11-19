import { Link } from "react-router-dom";
import { useCarBrands } from "@/hooks/queries/useBrands";
import { Car } from "lucide-react";

export function CarBrandGrid() {
  const { data: brands = [] } = useCarBrands();
  const displayed = brands.slice(0, 12);

  if (displayed.length === 0) return null;

  return (
    <section className="container-x mt-16 sm:mt-24">
      <SectionHeadInline eyebrow="Find your fit" title="Shop by car brand" />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
        {displayed.map((b) => (
          <Link
            key={b.id}
            to={`/shop/car-batteries?car_brand=${b.slug}`}
            className="group surface flex flex-col items-center gap-3 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-elevated"
          >
            {b.logo_url ? (
              <img
                src={b.logo_url}
                alt=""
                className="h-10 w-14 sm:h-12 sm:w-16 object-contain transition-transform group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted grid place-items-center text-muted-foreground">
                <Car className="h-5 w-5" />
              </div>
            )}
            <span className="font-display text-xs sm:text-sm font-semibold text-ink text-center leading-tight">
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
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="font-display-tight text-3xl sm:text-4xl font-bold mt-2 text-ink">{title}</h2>
    </div>
  );
}
