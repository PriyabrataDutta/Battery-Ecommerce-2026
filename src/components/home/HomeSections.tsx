import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BatteryCharging, BatteryWarning, CalendarClock, Car, Clock, Gauge, Lightbulb, MapPin, MessageCircle,
  PhoneCall, RefreshCw, Search, ShoppingCart, Truck, Wrench, Zap,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCarBrands } from "@/hooks/queries/useBrands";
import { useProducts } from "@/hooks/queries/useProducts";
import { contactInfo as c } from "@/components/layout/Header/lib/nav";
import { formatINR } from "@/lib/format";

const rupees = (n: number) => formatINR(Math.round(n)).replace(/\.00$/, "");

function Head({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Two entry points: car (by vehicle) and inverter (by backup need). */
export function ShopByNeed() {
  const { data: carBrands = [] } = useCarBrands();
  return (
    <section className="container-x mt-16 sm:mt-24">
      <Head eyebrow="Shop by need" title="Two kinds of power. One trusted store." />
      <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Link to="/shop/car-batteries" className="group relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white sm:p-10">
          <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary shadow-red"><Car className="h-6 w-6" /></span>
            <h3 className="mt-6 font-display-tight text-3xl font-bold sm:text-4xl">Car batteries</h3>
            <p className="mt-2 max-w-sm text-white/70">Pick your car brand and model. We show only the batteries that fit.</p>
            <div className="mt-6 flex -space-x-2">
              {carBrands.slice(0, 7).map((b) => (
                <span key={b.id} className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white" title={b.name}>
                  {b.logo_url ? <img src={b.logo_url} alt="" className="h-6 w-7 object-contain" loading="lazy" /> : <Car className="h-4 w-4 text-ink" />}
                </span>
              ))}
              {carBrands.length > 7 && <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white/15 text-xs font-semibold">+{carBrands.length - 7}</span>}
            </div>
            <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors group-hover:bg-primary group-hover:text-white">
              Find by vehicle <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
        <Link to="/shop/inverter-batteries" className="group relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-volt/25 blur-3xl" aria-hidden />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-volt"><BatteryCharging className="h-6 w-6" /></span>
            <h3 className="mt-6 font-display-tight text-3xl font-bold text-ink sm:text-4xl">Inverter & home backup</h3>
            <p className="mt-2 max-w-sm text-muted-foreground">Tubular, SMF and lithium. Tell us what you run and for how long, and we'll size it.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Tubular", "SMF / VRLA", "Lithium", "Backup calculator"].map((t, i) => (
                <span key={t} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i === 3 ? "bg-volt text-ink" : "bg-muted text-ink"}`}>{t}</span>
              ))}
            </div>
            <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-primary">
              Find by backup need <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

const STEPS = [
  { Icon: Search, t: "Find your battery", s: "By car model or by the backup you need." },
  { Icon: ShoppingCart, t: "Order your way", s: "Pay online or cash on delivery." },
  { Icon: Truck, t: "Delivered or installed", s: "Free standard delivery, or doorstep installation." },
  { Icon: RefreshCw, t: "Old battery exchanged", s: "Hand over the old one and pay the exchange price." },
];

export function HowItWorks() {
  return (
    <section className="container-x mt-16 sm:mt-24">
      <Head eyebrow="How it works" title="From search to switched on" center />
      <ol className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent lg:block" aria-hidden />
        {STEPS.map(({ Icon, t, s }, i) => (
          <li key={t} className="relative text-center">
            <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-line bg-white shadow-card">
              <Icon className="h-6 w-6 text-primary" />
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
            </div>
            <h3 className="mt-4 font-display font-bold text-ink">{t}</h3>
            <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted-foreground">{s}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Exchange savings computed from live product prices. */
export function ExchangeBand() {
  const { data: products = [] } = useProducts({});
  const { max, typical } = useMemo(() => {
    const s = products
      .filter((p) => p.has_exchange)
      .map((p) => Number(p.price_without_exchange || p.price) - Number(p.price_with_exchange || 0))
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    return { max: s.at(-1) ?? 0, typical: s[Math.floor(s.length / 2)] ?? 0 };
  }, [products]);
  if (!max) return null;
  return (
    <section className="relative mt-16 overflow-hidden bg-volt text-ink sm:mt-24">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/30 blur-3xl" aria-hidden />
      <div className="container-x relative grid items-center gap-6 py-14 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/70">Exchange & save</div>
          <h2 className="mt-2 font-display-tight text-3xl font-extrabold sm:text-5xl">Your old battery is worth up to {rupees(max)}</h2>
          <p className="mt-3 max-w-lg text-ink/75">
            Choose the exchange price and hand over your old battery at delivery. It's recycled as the Battery Waste Management Rules require.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink p-5 text-white">
            <div className="font-display text-2xl font-extrabold sm:text-3xl">{rupees(typical)}</div>
            <div className="mt-1 text-sm text-white/65">typical saving</div>
          </div>
          <div className="rounded-2xl bg-white/70 p-5">
            <div className="font-display text-2xl font-extrabold sm:text-3xl">{rupees(max)}</div>
            <div className="mt-1 text-sm text-ink/65">highest saving</div>
          </div>
          <Link to="/shop" className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-primary">
            See exchange prices <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const SIGNS = [
  { Icon: Gauge, t: "Slow engine crank", s: "Needs several tries to start" },
  { Icon: Lightbulb, t: "Dim headlights", s: "Especially when idling" },
  { Icon: AlertTriangle, t: "Warning light", s: "Battery icon on the dashboard" },
  { Icon: BatteryWarning, t: "Swelling or corrosion", s: "Bulging case, crusty terminals" },
  { Icon: CalendarClock, t: "Over 3 years old", s: "Most car batteries last 3–5 years" },
];

export function BatteryHealth() {
  return (
    <section className="relative mt-16 overflow-hidden bg-gradient-hero text-white sm:mt-24">
      <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
      <div className="container-x relative py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-stretch">
          <div>
            <div className="eyebrow">Battery health</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold sm:text-4xl">Is your car battery about to give up?</h2>
            <p className="mt-3 max-w-xl text-white/65">Notice two or more of these? Replace it before it leaves you stranded.</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {SIGNS.map(({ Icon, t, s }, i) => (
                <li key={t} className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur ${i === SIGNS.length - 1 ? "sm:col-span-2" : ""}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-volt/15 text-volt"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-bold">{t}</span>
                    <span className="block text-xs text-white/55">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-gradient-red p-6 shadow-red sm:p-8">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Zap className="h-6 w-6" /></span>
              <h3 className="mt-5 font-display-tight text-2xl font-bold sm:text-3xl">Car won't start right now?</h3>
              <p className="mt-2 text-white/80">Our jump start service gets you moving, and we'll help you pick the right replacement.</p>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <a href={c.phoneTel} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-white/90">
                <PhoneCall className="h-4 w-4" /> Call {c.phoneDisplay}
              </a>
              <Link to="/jump-start" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/50 px-5 py-3 text-sm font-semibold hover:bg-white/10">
                Jump start service <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const DELIVERY = [
  { Icon: Truck, t: "Standard delivery", s: "3–5 business days", p: "Free" },
  { Icon: Clock, t: "Express delivery", s: "1–2 business days", p: "₹299" },
  { Icon: Wrench, t: "Doorstep installation", s: "Includes old battery pickup", p: "₹499" },
];

export function VisitAndDelivery() {
  return (
    <section className="container-x mt-16 sm:mt-24">
      <Head eyebrow="Delivery & store" title="Delivered to your door, or visit us" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:gap-6">
        <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          <h3 className="relative font-display text-xl font-bold">Choose at checkout</h3>
          <ul className="relative mt-5 space-y-3">
            {DELIVERY.map(({ Icon, t, s, p }) => (
              <li key={t} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><Icon className="h-5 w-5 text-volt" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold">{t}</span>
                  <span className="block text-sm text-white/55">{s}</span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${p === "Free" ? "bg-volt text-ink" : "bg-white/10 text-white"}`}>{p}</span>
              </li>
            ))}
          </ul>
          <p className="relative mt-auto pt-5 text-sm text-white/55">Cash on delivery available on every order.</p>
        </div>
        <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-line bg-white shadow-card sm:min-h-[340px]">
          <iframe title={`${c.storeName} on Google Maps`} src={c.mapEmbedUrl} className="h-56 w-full border-0 sm:absolute sm:inset-0 sm:h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <div className="flex flex-col gap-3 p-4 sm:absolute sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:bg-white/95 sm:p-5 sm:shadow-elevated sm:backdrop-blur">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-display font-bold text-ink"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {c.storeName}</div>
              <div className="text-sm text-muted-foreground">{c.storeCity} · Kachi Batteries is its sister concern</div>
            </div>
            <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary">
              Get directions <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export const HOME_FAQ = [
  { q: "Are your prices inclusive of GST?", a: "Prices on the site exclude GST. The GST for each product is added in your cart and at checkout, so you see the full amount before you pay." },
  { q: "How does the old battery exchange work?", a: "Choose the exchange price on the product page and hand over your old battery when the new one is delivered or installed. Old batteries are recycled as required by the Battery Waste Management Rules, 2022." },
  { q: "Is installation included?", a: "Standard delivery is free. Doorstep installation, including old battery pickup, can be chosen at checkout for ₹499. Express delivery (1–2 business days) is ₹299." },
  { q: "Can I pay cash on delivery?", a: "Yes. You can pay online (UPI, cards, net banking) or choose cash on delivery and pay the delivery partner in cash or UPI." },
  { q: "What warranty do I get?", a: "Every battery carries the manufacturer's warranty shown on its product page. Claims are handled by the brand's authorised service centres, and we help you raise them." },
  { q: "Can I return a battery?", a: "Unused, uninstalled batteries in original packaging can be returned within 7 days of delivery. Report transit damage within 48 hours. See our Return & Refund Policy for details." },
];

export function HomeFaq() {
  return (
    <section className="container-x mt-16 sm:mt-24">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div className="lg:sticky lg:top-44 lg:self-start">
          <Head eyebrow="FAQ" title="Questions, answered" />
          <div className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white">
            <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
            <div className="relative">
              <h3 className="font-display text-xl font-bold">Still unsure?</h3>
              <p className="mt-1 text-sm text-white/65">Talk to a battery expert. We reply fast on WhatsApp.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white">
                  <MessageCircle className="h-4 w-4" /> WhatsApp us
                </a>
                <a href={c.phoneTel} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
                  <PhoneCall className="h-4 w-4" /> Call
                </a>
              </div>
              <Link to="/refund-policy" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-volt hover:underline">
                Read the return & refund policy <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <Accordion type="single" collapsible defaultValue="q0" className="space-y-3">
          {HOME_FAQ.map(({ q, a }, i) => (
            <AccordionItem key={q} value={`q${i}`} className="surface border-b-0 px-5 transition-shadow data-[state=open]:shadow-elevated sm:px-6">
              <AccordionTrigger className="gap-4 py-5 text-left font-display text-base font-semibold text-ink hover:no-underline [&>svg]:h-8 [&>svg]:w-8 [&>svg]:rounded-full [&>svg]:bg-muted [&>svg]:p-2 [&[data-state=open]>svg]:bg-ink [&[data-state=open]>svg]:text-white">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pr-10 text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
