import { Link } from "react-router-dom";
import { useBatteryBrands } from "@/hooks/queries/useBrands";

const Brands = () => {
  const { data: brands = [] } = useBatteryBrands();

  return (
    <div className="container-x py-12">
      <h1 className="font-display-tight text-4xl font-bold">Battery Brands</h1>
      <p className="text-muted-foreground mt-2">Genuine batteries from India's most trusted brands.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {brands.map((b) => (
          <Link key={b.id} to={`/brand/${b.slug}`} className="bg-white border border-line p-8 text-center hover-lift hover:border-ink">
            <div className="font-display font-bold text-2xl">{b.name}</div>
            {b.description && <p className="text-sm text-muted-foreground mt-2">{b.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Brands;
