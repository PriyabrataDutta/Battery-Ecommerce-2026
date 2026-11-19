import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  Award,
  Truck,
  Wrench,
  HeadphonesIcon,
  IndianRupee,
  Users,
  MapPin,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "10,000+", label: "Batteries Sold" },
  { value: "50+", label: "Cities Covered" },
  { value: "15+", label: "Brand Partners" },
  { value: "99%", label: "Customer Satisfaction" },
];

const values = [
  { Icon: ShieldCheck, title: "100% Genuine", desc: "Every battery is sourced directly from manufacturers with full traceability." },
  { Icon: IndianRupee, title: "Best Prices", desc: "Direct partnerships mean no middlemen. You get MRP discounts every day." },
  { Icon: Truck, title: "Free Shipping", desc: "Pan-India delivery with same-day dispatch for orders before 2 PM." },
  { Icon: Wrench, title: "Doorstep Installation", desc: "Trained technicians fit your battery at home and take the old one away." },
  { Icon: Award, title: "Full Warranty", desc: "Manufacturer warranty honored at authorized service centers across India." },
  { Icon: HeadphonesIcon, title: "Expert Support", desc: "Our battery specialists help you find the perfect fit for any vehicle." },
];

const About = () => (
  <>
    <Helmet>
      <title>About Us — Kachi Batteries</title>
      <meta name="description" content="Kachi Batteries is India's trusted source for genuine car batteries, inverter batteries and UPS systems with free shipping and installation." />
    </Helmet>

    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 bg-dots" aria-hidden />
      <div className="container-x relative pt-16 pb-28 sm:pt-24 sm:pb-36 max-w-3xl">
        <div className="eyebrow mb-3">
          About Us
        </div>
        <h1 className="font-display-tight text-3xl sm:text-5xl font-bold leading-tight">
          Powering India's Vehicles <br className="hidden sm:block" />
          & Homes Since Day One
        </h1>
        <p className="mt-6 text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
          Kachi Batteries is India's trusted source for genuine car batteries, inverter batteries
          and UPS systems. We work directly with manufacturers like Amaron, Exide, Power Zone and
          Elito to deliver authentic products at competitive prices — with free shipping and
          doorstep installation in major cities.
        </p>
      </div>
    </section>

    {/* Stats Strip */}
    <section className="container-x relative -mt-16 sm:-mt-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-line shadow-elevated text-center">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5 sm:p-7">
            <div className="font-display-tight text-3xl sm:text-4xl font-bold text-primary">{s.value}</div>
            <div className="text-xs font-medium text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Mission */}
    <section className="container-x py-14 sm:py-20 max-w-3xl text-center">
      <div className="eyebrow mb-2">
        Our Mission
      </div>
      <h2 className="font-display-tight text-2xl sm:text-3xl font-bold text-ink">
        Making Reliable Power Simple & Affordable
      </h2>
      <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        We believe every home, business and vehicle deserves dependable power. Our mission is to
        eliminate the hassle of battery buying — no confusing specs, no inflated prices, no waiting.
        Just genuine products delivered fast with professional installation.
      </p>
    </section>

    {/* Why Choose Us */}
    <section className="bg-muted/60 py-14 sm:py-20">
      <div className="container-x">
        <div className="text-center mb-10">
          <div className="eyebrow">
            Why Choose Kachi
          </div>
          <h2 className="font-display-tight text-2xl sm:text-3xl font-bold text-ink mt-1">
            The Kachi Advantage
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map(({ Icon, title, desc }) => (
            <div key={title} className="surface p-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-ink mt-4">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Who We Serve */}
    <section className="container-x py-14 sm:py-20">
      <div className="text-center mb-10">
        <div className="eyebrow">
          Who We Serve
        </div>
        <h2 className="font-display-tight text-2xl sm:text-3xl font-bold text-ink mt-1">
          Built for Everyone
        </h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 text-center">
        {[
          { Icon: Users, title: "Individual Customers", desc: "Car owners, homeowners — find the right battery at the best price, delivered free." },
          { Icon: Package, title: "B2B & Fleet", desc: "Bulk pricing, BOQ support and dedicated account management for businesses and fleet operators." },
          { Icon: MapPin, title: "Dealers & Distributors", desc: "Competitive dealer rates, reliable supply chain and marketing support for retail partners." },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="surface p-6">
            <div className="h-14 w-14 mx-auto rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-ink mt-4">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="container-x mb-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-white p-8 sm:p-14 text-center">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="relative">
        <h2 className="font-display-tight text-2xl sm:text-3xl font-bold">Ready to Get Started?</h2>
        <p className="text-white/80 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          Whether you need a single battery or a bulk order, we're here to help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="font-bold uppercase tracking-wider">
            <Link to="/shop">Shop Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-ink">
            <Link to="/quote">Request a Quote</Link>
          </Button>
        </div>
        </div>
      </div>
    </section>
  </>
);

export default About;
