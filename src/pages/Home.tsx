import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Wrench, ShieldCheck, Award, IndianRupee, HeadphonesIcon, Package } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { FitmentSearch } from "@/components/products/FitmentSearch";
import { useProducts } from "@/hooks/queries/useProducts";
import { useBatteryBrands } from "@/hooks/queries/useBrands";
import { useCategories } from "@/hooks/queries/useCategories";
import heroCar from "@/assets/hero-car.jpg";
import batteryStack from "@/assets/battery-stack.png";
import { gsap } from "gsap";

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
      gsap.from(".hero-cta", { y: 20, opacity: 0, duration: 0.6, delay: 0.6, stagger: 0.1, ease: "power2.out" });
      gsap.from(".hero-stack", { x: 60, opacity: 0, duration: 1.0, delay: 0.3, ease: "power3.out" });
      gsap.to(".hero-stack", { y: -10, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const { data: featured = [] } = useProducts({ isFeatured: true, limit: 8 });
  const { data: brands = [] } = useBatteryBrands();
  const { data: categories = [] } = useCategories();

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative bg-ink text-white overflow-hidden">
        <img
          src={heroCar}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />

        <div className="container-x relative pt-10 pb-32 sm:pt-16 sm:pb-40 lg:pt-24 lg:pb-52 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="hero-line text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary mb-3 sm:mb-4">
              India's Trusted Battery Store
            </div>
            <h1 className="font-display-tight text-[2.25rem] leading-[1.05] sm:text-5xl sm:leading-[0.95] md:text-6xl lg:text-7xl font-bold">
              <span className="hero-line block">Best Prices.</span>
              <span className="hero-line block">Free Shipping.</span>
              <span className="hero-line block text-primary">Free Installation.</span>
            </h1>
            <p className="hero-line mt-4 sm:mt-6 text-sm sm:text-base text-white/80 max-w-md">
              Genuine car & inverter batteries from Amaron, Exide, Power Zone and more.
              Same-day dispatch. Doorstep installation in major cities.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              <Button asChild size="lg" className="hero-cta font-bold uppercase tracking-wider w-full sm:w-auto">
                <Link to="/quote">Request Call Back</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="hero-cta bg-transparent text-white border-white/30 hover:bg-white hover:text-ink font-bold uppercase tracking-wider w-full sm:w-auto">
                <Link to="/shop">Shop Now <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex justify-end">
            <img src={batteryStack} alt="" className="hero-stack w-[500px] max-w-full object-contain" width={1024} height={1024} />
          </div>
        </div>
      </section>

      {/* FITMENT SEARCH (overlapping) */}
      <section className="-mt-20 sm:-mt-24 relative z-10">
        <FitmentSearch />
      </section>

      {/* PERKS STRIP */}
      <section className="container-x mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { Icon: IndianRupee, t: "Best Prices", s: "Genuine MRP discounts" },
          { Icon: Truck, t: "Free Shipping", s: "Across major cities" },
          { Icon: Wrench, t: "Free Installation", s: "By trained technicians" },
          { Icon: ShieldCheck, t: "Genuine Warranty", s: "Direct from brands" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="bg-white border border-line rounded-lg p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-md grid place-items-center bg-primary/10 text-primary flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-[13px] sm:text-sm uppercase tracking-wide truncate">{t}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{s}</div>
            </div>
          </div>
        ))}
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-x mt-12 sm:mt-20">
        <SectionHead eyebrow="Browse" title="Shop by Category" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group relative bg-white border border-line p-6 hover:border-ink hover-lift overflow-hidden"
            >
              <div className="font-display font-bold text-xl text-ink">{c.name}</div>
              {c.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SHOP BY BRAND */}
      <section className="mt-12 sm:mt-20 bg-white border-y border-line py-8 sm:py-12 overflow-hidden">
        <div className="container-x">
          <SectionHead eyebrow="Trusted Brands" title="Shop by Brand" />
        </div>
        <div className="mt-8 flex gap-12 marquee whitespace-nowrap">
          {[...brands, ...brands].map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              to={`/brand/${b.slug}`}
              className="font-display font-bold text-3xl text-ink-soft hover:text-primary transition-colors px-8"
            >
              {b.name.toUpperCase()}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container-x mt-12 sm:mt-20">
        <SectionHead eyebrow="Top Picks" title="Featured Products" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-10">
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">View All Products <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      {/* B2B TRUST */}
      <section className="mt-12 sm:mt-20 bg-ink text-white py-10 sm:py-16">
        <div className="container-x">
          <SectionHead eyebrow="Why Kachi" title="Built for B2B" dark />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {[
              { Icon: Award, t: "Genuine Products", s: "100% original, sourced direct from manufacturers" },
              { Icon: IndianRupee, t: "Competitive Pricing", s: "Bulk discounts & dealer-friendly rates" },
              { Icon: Package, t: "Fast Dispatch", s: "Same-day shipping for in-stock items" },
              { Icon: HeadphonesIcon, t: "Technical Support", s: "Expert advice for the right fit" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="text-center">
                <div className="h-14 w-14 mx-auto grid place-items-center bg-primary text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-display font-bold text-lg mt-4">{t}</div>
                <p className="text-sm text-white/70 mt-1">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK QUOTE CTA */}
      <section className="container-x mt-12 sm:mt-20">
        <div className="bg-gradient-red text-white p-6 sm:p-10 lg:p-14 grid lg:grid-cols-[1fr_auto] items-center gap-5 sm:gap-6">
          <div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-2 sm:mb-3">B2B Pricing</div>
            <h2 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">Need bulk pricing or custom requirement?</h2>
            <p className="mt-2 text-sm sm:text-base text-white/85 max-w-xl">Get a personalized quote with dealer rates, BOQ support and dedicated account management.</p>
          </div>
          <Button asChild size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-ink hover:text-white hover:border-ink font-bold uppercase tracking-wider w-full lg:w-auto">
            <Link to="/quote">Request a Quote <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
};

function SectionHead({ eyebrow, title, dark }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] ${dark ? "text-primary" : "text-primary"}`}>{eyebrow}</div>
        <h2 className={`font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      </div>
    </div>
  );
}

export default Home;
