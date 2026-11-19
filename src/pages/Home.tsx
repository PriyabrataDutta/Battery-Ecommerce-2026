import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Wrench, ShieldCheck, IndianRupee } from "lucide-react";
import { FitmentSearch } from "@/components/products/FitmentSearch";
import { useBatteryBrands } from "@/hooks/queries/useBrands";
import { CarBrandGrid } from "@/components/home/CarBrandGrid";
import { ProductTabs } from "@/components/home/ProductTabs";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ShopByNeed, HowItWorks, ExchangeBand, BatteryHealth, VisitAndDelivery, HomeFaq } from "@/components/home/HomeSections";
import { MobileStickyBar } from "@/components/home/MobileStickyBar";
import heroCar from "@/assets/hero-car.jpg";
import batteryStack from "@/assets/battery-stack.png";
import { gsap } from "gsap";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/site";

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

  const { data: brands = [] } = useBatteryBrands();

  return (
    <>
      <Seo
        title="Buy Car & Inverter Batteries Online in India"
        description="Genuine Amaron, Exide, Power Zone and Elito car and inverter batteries. Find the battery that fits your car, free standard delivery, doorstep installation and old battery exchange."
        path="/"
        jsonLd={{
            "@context": "https://schema.org",
            "@type": ["LocalBusiness", "AutoPartsStore"],
            "@id": `${SITE_URL}/#store`,
            name: "Kachi Batteries",
            alternateName: "Manjunatha Batteries",
            url: SITE_URL,
            logo: `${SITE_URL}/og-default.jpg`,
            image: `${SITE_URL}/og-default.jpg`,
            telephone: "+91-81975-68707",
            email: "kachibatteries@gmail.com",
            priceRange: "₹₹",
            address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" },
            geo: { "@type": "GeoCoordinates", latitude: 12.9582934, longitude: 77.5336018 },
            hasMap: "https://maps.app.goo.gl/jFhiV7mrC53UrraL8",
            areaServed: "IN",
            paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking",
          }}
      />
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
        <img
          src={heroCar}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-luminosity"
          width={1920}
          height={1080}
        />
        <div className="container-x relative grid items-center gap-10 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20">
          <div>
            <div className="hero-line inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-volt" aria-hidden /> India's trusted battery store
            </div>
            <h1 className="mt-5 font-display-tight text-[2.6rem] font-extrabold sm:text-6xl lg:text-7xl">
              <span className="hero-line block">Power that</span>
              <span className="hero-line block">
                starts <span className="bg-gradient-to-r from-primary to-[hsl(14_95%_58%)] bg-clip-text text-transparent">every time.</span>
              </span>
            </h1>
            <p className="hero-line mt-5 max-w-lg text-base text-white/70 sm:text-lg">
              Genuine car and inverter batteries from Amaron, Exide, Power Zone and more. Free standard delivery,
              doorstep installation and old battery exchange.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="hero-cta">
                <Link to="/shop">Shop batteries <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="hero-cta border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-ink">
                <Link to="/quote">Request a call back</Link>
              </Button>
            </div>
            <dl className="hero-line mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { k: "Genuine", v: "Top brands only" },
                { k: "Free", v: "Standard delivery" },
                { k: "Doorstep", v: "Installation" },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt className="font-display text-lg font-bold sm:text-xl">{k}</dt>
                  <dd className="text-xs text-white/55 sm:text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <img src={batteryStack} alt="" aria-hidden className="hero-stack pointer-events-none absolute -right-10 -top-16 hidden w-[340px] opacity-90 drop-shadow-2xl xl:block" width={1024} height={1024} />
            <div className="absolute inset-6 rounded-full bg-primary/25 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl bg-white p-5 text-ink shadow-elevated sm:p-6 lg:mt-24">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">Find your battery</h2>
                <span className="text-xs text-muted-foreground">Takes 10 seconds</span>
              </div>
              <div className="mt-3"><FitmentSearch embedded /></div>
            </div>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="container-x relative z-10 -mt-6 grid grid-cols-2 gap-3 sm:-mt-8 sm:gap-4 lg:grid-cols-4">
        {[
          { Icon: IndianRupee, t: "Best prices", s: "Honest discounts on MRP" },
          { Icon: Truck, t: "Free delivery", s: "Standard, 3–5 business days" },
          { Icon: Wrench, t: "Doorstep installation", s: "With old battery pickup" },
          { Icon: ShieldCheck, t: "Genuine warranty", s: "Direct from the brands" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="surface flex items-center gap-3 p-3.5 sm:p-5">
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[13px] font-bold leading-tight text-ink sm:text-[15px]">{t}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">{s}</div>
            </div>
          </div>
        ))}
      </section>

      {/* SHOP BY NEED: car vs inverter */}
      <ShopByNeed />

      {/* PRODUCTS first: what most visitors came for */}
      <Band>
        <ProductTabs />
      </Band>

      {/* SHOP BY CAR BRAND */}
      <CarBrandGrid />

      <ExchangeBand />

      {/* SHOP BY BRAND — marquee */}
      <section className="mt-16 overflow-hidden py-4 sm:mt-24">
        <div className="container-x">
          <SectionHead eyebrow="Trusted brands" title="Shop by battery brand" link={{ to: "/brands", label: "All brands" }} />
        </div>
        <div className="relative mt-8 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee flex w-max gap-4">
            {[...brands, ...brands].map((b, i) => (
              <Link
                key={`${b.id}-${i}`}
                to={`/brand/${b.slug}`}
                className="surface flex h-20 min-w-[180px] items-center justify-center px-8 transition-colors hover:border-ink/20"
              >
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="h-9 object-contain sm:h-10" loading="lazy" />
                ) : (
                  <span className="font-display text-2xl font-extrabold text-ink-soft">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Band>
        <HowItWorks />
      </Band>

      <BatteryHealth />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      <Band>
        <VisitAndDelivery />
      </Band>

      <HomeFaq />

      {/* QUICK QUOTE CTA */}
      <section className="container-x mb-16 mt-16 sm:mt-24 lg:mb-4">
        <div className="relative grid items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
          <div>
            <div className="eyebrow">B2B pricing</div>
            <h2 className="mt-2 font-display-tight text-2xl font-bold sm:text-3xl lg:text-4xl">Need bulk pricing or a custom requirement?</h2>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">Get a personalised quote with dealer rates, BOQ support and a dedicated account manager.</p>
          </div>
          <Button asChild size="lg" className="w-full lg:w-auto">
            <Link to="/quote">Request a quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* MOBILE STICKY BAR */}
      <MobileStickyBar />
    </>
  );
};

/** Full-width white band; child sections drop their own top margin. */
function Band({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mt-16 rounded-none border-y border-line bg-white py-14 sm:mt-24 sm:py-20 [&>section]:mt-0 [&_.surface]:bg-background [&_.surface]:shadow-none`}>
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, title, dark, link }: { eyebrow: string; title: string; dark?: boolean; link?: { to: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className={`mt-2 font-display-tight text-3xl font-bold sm:text-4xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary">
          {link.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default Home;
