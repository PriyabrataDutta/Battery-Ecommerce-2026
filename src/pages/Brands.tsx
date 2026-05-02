import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useBatteryBrands } from "@/hooks/queries/useBrands";
import { ArrowRight } from "lucide-react";

const Brands = () => {
  const { data: brands = [], isLoading } = useBatteryBrands();

  return (
    <>
      <Helmet>
        <title>Battery Brands — Kachi Batteries</title>
        <meta name="description" content="Shop genuine batteries from India's most trusted brands — Amaron, Exide, Power Zone, Elito and more." />
      </Helmet>

      <div className="container-x py-12">
        <h1 className="font-display-tight text-4xl font-bold">Battery Brands</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Genuine batteries from India's most trusted manufacturers. Every product carries full manufacturer warranty.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-line p-8 animate-pulse space-y-3">
                <div className="h-16 w-16 bg-muted rounded mx-auto" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {brands.map((b) => (
              <Link
                key={b.id}
                to={`/brand/${b.slug}`}
                className="group bg-white border border-line p-6 sm:p-8 text-center hover-lift hover:border-ink transition-colors flex flex-col items-center"
              >
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    className="h-16 sm:h-20 w-auto object-contain mb-4 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-16 sm:h-20 flex items-center justify-center mb-4">
                    <span className="font-display font-bold text-3xl text-ink group-hover:text-primary transition-colors">
                      {b.name}
                    </span>
                  </div>
                )}
                <div className="font-display font-bold text-lg text-ink">{b.name}</div>
                {b.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                )}
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View Products <ArrowRight className="h-3.5 w-3.5" />
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
