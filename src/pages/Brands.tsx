import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Seo } from "@/components/Seo";
import { useBatteryBrands } from "@/hooks/queries/useBrands";
import { ArrowRight } from "lucide-react";

const Brands = () => {
  const { data: brands = [], isLoading } = useBatteryBrands();

  return (
    <>
        <Seo title="Battery Brands — Amaron, Exide, Power Zone, Elito" description="Shop genuine batteries from India's most trusted brands: Amaron, Exide, Power Zone and Elito. Manufacturer warranty, free standard delivery." path="/brands" breadcrumbs={[{ name: "Brands", path: "/brands" }]} />

      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative py-12 sm:py-16">
          <span className="eyebrow">Brands</span>
          <h1 className="font-display-tight text-3xl sm:text-4xl lg:text-5xl font-bold mt-2">Battery brands</h1>
          <p className="text-white/70 mt-3 max-w-xl text-sm sm:text-base">
            Genuine batteries from India's most trusted manufacturers. Every product carries full manufacturer warranty.
          </p>
        </div>
      </section>

      <div className="container-x py-8 sm:py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface p-8 animate-pulse space-y-3">
                <div className="h-16 w-16 bg-muted rounded-xl mx-auto" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {brands.map((b) => (
              <Link
                key={b.id}
                to={`/brand/${b.slug}`}
                className="group surface p-5 sm:p-8 text-center hover-lift flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="grid h-20 sm:h-24 w-full place-items-center rounded-xl bg-muted/60 mb-4">
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={b.name}
                      className="h-12 sm:h-16 w-auto max-w-[80%] object-contain group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-display font-bold text-2xl text-ink group-hover:text-primary transition-colors">
                      {b.name}
                    </span>
                  )}
                </div>
                <div className="font-display font-bold text-base sm:text-lg text-ink">{b.name}</div>
                {b.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                )}
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View products <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Brands;
