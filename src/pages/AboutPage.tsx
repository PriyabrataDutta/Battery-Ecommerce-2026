import { Helmet } from "react-helmet-async";
import { Seo } from "@/components/Seo";
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

// Verifiable facts only (see /refund-policy and checkout): no unconfirmed sales or coverage numbers.
const stats = [
  { value: "4", label: "Battery brands" },
  { value: "Free", label: "Standard delivery" },
  { value: "₹499", label: "Doorstep installation" },
  { value: "7 days", label: "Returns on unused batteries" },
];

const values = [
  { Icon: ShieldCheck, title: "Genuine brands", desc: "Amaron, Exide, Power Zone and Elito batteries, sold with an invoice and the manufacturer's warranty." },
  { Icon: IndianRupee, title: "Clear prices", desc: "Prices exclude GST, which is shown per product in your cart. Choose the exchange price to save on your old battery." },
  { Icon: Truck, title: "Free standard delivery", desc: "Standard delivery is free (3–5 business days). Express delivery in 1–2 business days is ₹299." },
  { Icon: Wrench, title: "Doorstep installation", desc: "For ₹499 we fit your new battery at home and take the old one away for recycling." },
  { Icon: Award, title: "Manufacturer warranty", desc: "Warranty claims are handled by the brand's authorised service centres, and we help you raise them." },
  { Icon: HeadphonesIcon, title: "Help choosing", desc: "Call or WhatsApp us with your car or inverter details and we'll suggest the right battery." },
];

const About = () => (
  <>
      <Seo title="About Us — Genuine Batteries from Bengaluru" description="Kachi Batteries, a sister concern of Manjunatha Batteries in Bengaluru, sells genuine car, inverter and UPS batteries with free standard delivery and doorstep installation." path="/about" breadcrumbs={[{ name: "About", path: "/about" }]} />

    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 bg-dots" aria-hidden />
      <div className="container-x relative pt-16 pb-28 sm:pt-24 sm:pb-36 max-w-3xl">
        <div className="eyebrow mb-3">
          About Us
        </div>
        <h1 className="font-display-tight text-3xl sm:text-5xl font-bold leading-tight">
          Genuine batteries from <br className="hidden sm:block" />
          a Bengaluru battery store
        </h1>
        <p className="mt-6 text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
          Kachi Batteries is the online store of Manjunatha Batteries, a battery shop in Bengaluru.
          We sell genuine car and inverter batteries from Amaron, Exide, Power Zone and Elito, with
          free standard delivery, optional doorstep installation and old battery exchange.
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
        Buying a battery shouldn't mean guessing. Pick your car to see batteries listed as fitting it,
        size an inverter battery with our backup calculator, and see the exchange and non-exchange price
        before you pay. If you're unsure, our store team will help by phone or WhatsApp.
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
          { Icon: Users, title: "Car owners & homes", desc: "Replacement car batteries and inverter batteries, delivered free with optional installation." },
          { Icon: Package, title: "Businesses & fleets", desc: "Bulk orders for offices, shops and vehicle fleets. Request a quote and we'll get back to you." },
          { Icon: MapPin, title: "Bengaluru customers", desc: "Visit Manjunatha Batteries, or use our jump start service in Bengaluru during store hours." },
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
