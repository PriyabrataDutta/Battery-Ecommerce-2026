import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Car, BatteryCharging } from "lucide-react";
import Shop from "../Shop";
import { INVERTER_SLUGS } from "./inverterKinds";
import { Seo } from "@/components/Seo";

/**
 * /shop — with no filters, asks "car or inverter?"; old /shop?type=… and
 * /shop?car_brand=… links are redirected to the matching dedicated shop.
 */
export default function ShopEntry() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const rest = new URLSearchParams(params);
  rest.delete("type");
  const qs = rest.toString() ? `?${rest}` : "";

  if (type === "car-batteries" || (!type && (params.has("car_brand") || params.has("car_model")))) {
    return <Navigate to={`/shop/car-batteries${qs}`} replace />;
  }
  if (type && INVERTER_SLUGS.includes(type as (typeof INVERTER_SLUGS)[number])) {
    if (type !== "inverter-ups") rest.set("kind", type);
    return <Navigate to={`/shop/inverter-batteries${rest.toString() ? `?${rest}` : ""}`} replace />;
  }
  if ([...params.keys()].length > 0) return <Shop />;

  const tiles = [
    { to: "/shop/car-batteries", Icon: Car, title: "Car batteries", text: "Choose your car brand and model and see only the batteries that fit.", cta: "Find by vehicle" },
    { to: "/shop/inverter-batteries", Icon: BatteryCharging, title: "Inverter & home backup", text: "Tubular, SMF and lithium batteries, with a calculator to pick the right size.", cta: "Find by backup need" },
  ];

  return (
    <div>
      <Seo title="Shop Batteries: Car & Inverter" description="Shop genuine car batteries by vehicle or inverter and home backup batteries by capacity. Free standard delivery and old battery exchange." path="/shop" breadcrumbs={[{ name: "Shop", path: "/shop" }]} />
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative pb-28 pt-12 sm:pt-16">
          <span className="eyebrow">Shop</span>
          <h1 className="mt-2 font-display-tight text-4xl font-bold sm:text-5xl">What do you need a battery for?</h1>
          <p className="mt-3 max-w-xl text-white/70">Pick one and we'll guide you to the right battery.</p>
        </div>
      </section>
      <div className="container-x -mt-20 grid gap-4 sm:grid-cols-2 sm:gap-6">
        {tiles.map(({ to, Icon, title, text, cta }) => (
          <Link key={to} to={to} className="group surface relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-red">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-display-tight text-2xl font-bold sm:text-3xl">{title}</h2>
            <p className="mt-2 text-muted-foreground">{text}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">
              {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
      <div className="container-x mt-6 text-center text-sm text-muted-foreground">
        Looking for something else? <Link to="/shop?all=1" className="font-semibold text-ink underline underline-offset-4">Browse all products</Link>
      </div>
    </div>
  );
}
