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
  { Icon: Wrench, title: "Free Installation", desc: "Trained technicians install at your doorstep in 30+ major cities." },
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
    <section className="bg-ink text-white">
      <div className="container-x py-16 sm:py-24 max-w-3xl">
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
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
    <section className="-mt-1 bg-primary text-white py-8">
      <div className="container-x grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display-tight text-3xl sm:text-4xl font-bold">{s.value}</div>
            <div className="text-xs uppercase tracking-wider text-white/80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Mission */}
    <section className="container-x py-14 sm:py-20 max-w-3xl text-center">
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">
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
    <section className="bg-muted/50 border-y border-line py-14 sm:py-20">
      <div className="container-x">
        <div className="text-center mb-10">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Why Choose Kachi
          </div>
          <h2 className="font-display-tight text-2xl sm:text-3xl font-bold text-ink mt-1">
            The Kachi Advantage
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white border border-line p-6">
              <div className="h-11 w-11 rounded-md bg-primary/10 text-primary grid place-items-center">
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
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary">
          Who We Serve
        </div>
        <h2 className="font-display-tight text-2xl sm:text-3xl font-bold text-ink mt-1">
          Built for Everyone
        </h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-6 text-center">
        {[
          { Icon: Users, title: "Individual Customers", desc: "Car owners, homeowners — find the right battery at the best price with free installation." },
          { Icon: Package, title: "B2B & Fleet", desc: "Bulk pricing, BOQ support and dedicated account management for businesses and fleet operators." },
          { Icon: MapPin, title: "Dealers & Distributors", desc: "Competitive dealer rates, reliable supply chain and marketing support for retail partners." },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="bg-white border border-line p-6">
            <div className="h-14 w-14 mx-auto rounded-md bg-primary/10 text-primary grid place-items-center">
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
      <div className="bg-ink text-white p-8 sm:p-12 text-center">
        <h2 className="font-display-tight text-2xl sm:text-3xl font-bold">Ready to Get Started?</h2>
        <p className="text-white/80 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          Whether you need a single battery or a bulk order, we're here to help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="font-bold uppercase tracking-wider">
            <Link to="/shop">Shop Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-ink font-bold uppercase tracking-wider">
            <Link to="/quote">Request a Quote</Link>
          </Button>
        </div>
      </div>
    </section>
  </>
);

export default About;
