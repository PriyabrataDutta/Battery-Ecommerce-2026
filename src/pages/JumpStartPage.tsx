import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Seo } from "@/components/Seo";
import {
  AlertTriangle, ArrowRight, BatteryWarning, Car, CheckCircle2, Clock, Gauge, Lightbulb, MapPin, MessageCircle,
  PhoneCall, ShieldAlert, Wrench, XCircle, Zap,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { contactInfo as c } from "@/components/layout/Header/lib/nav";
import { SITE_URL } from "@/lib/site";
import { faqJsonLd } from "@/lib/faq";

const IMG = "https://uzpzqkzkdkeboplmgowy.supabase.co/storage/v1/object/public/media/jump-start";
const WA = `${c.whatsappUrl}?text=${encodeURIComponent("Hi Kachi Batteries, I need a jump start in Bengaluru. My location: ")}`;

const FACTS = [
  { Icon: MapPin, t: "Bengaluru", s: "Service area" },
  { Icon: Clock, t: "30–60 min", s: "Usual arrival" },
  { Icon: Wrench, t: "Store hours", s: "When we're open" },
  { Icon: PhoneCall, t: "Call for charge", s: "Depends on distance" },
];

const BATTERY_SIGNS = [
  { Icon: Gauge, t: "Engine cranks slowly or just clicks", s: "A rapid clicking sound when you turn the key is the classic sign." },
  { Icon: Lightbulb, t: "Dim dashboard and headlights", s: "Lights glow weakly or fade when you try to start." },
  { Icon: AlertTriangle, t: "Battery warning light was on", s: "Often appears days before the battery gives up." },
  { Icon: BatteryWarning, t: "Car stood unused for days", s: "Long parking, or lights left on overnight, drains the battery." },
];

const NOT_BATTERY = [
  "No click at all and the lights are bright: more likely the starter motor or a fuse.",
  "Engine turns over normally but won't fire: more likely fuel or ignition.",
  "Battery is swollen, cracked or leaking: don't jump it. It needs replacing.",
];

const STEPS = [
  { n: "1", t: "Call or WhatsApp us", s: "Share your location pin, car model and what happens when you turn the key." },
  { n: "2", t: "A technician comes to you", s: "Usually within 30–60 minutes in Bengaluru, depending on traffic." },
  { n: "3", t: "Safe jump start", s: "We check the terminals and connections first, then start the car the right way." },
  { n: "4", t: "Honest advice", s: "If the battery is weak or old, we tell you, and help you choose the right replacement." },
];

const CHECKS = [
  "Battery terminals for corrosion and loose clamps",
  "Battery voltage before and after the start",
  "Whether the alternator is charging once the engine runs",
  "Signs the battery is near the end of its life",
];

const DIY = [
  { t: "Red to dead +", s: "Clamp red to the positive (+) terminal of the flat battery." },
  { t: "Red to donor +", s: "Other red clamp to the positive (+) of the working car's battery." },
  { t: "Black to donor −", s: "Black clamp to the negative (−) of the working battery." },
  { t: "Black to bare metal", s: "Last clamp to unpainted metal on the dead car's engine block, away from the battery." },
  { t: "Start and wait", s: "Run the donor car for a few minutes, then start the dead car." },
  { t: "Remove in reverse", s: "Take the clamps off in the exact reverse order, black first." },
];

const FAQ = [
  { q: "How much does a jump start cost?", a: "It depends on how far we need to travel, so please call us and we'll tell you the charge before we set out." },
  { q: "Which areas do you cover?", a: "We provide the jump start service across Bengaluru only." },
  { q: "When is the service available?", a: "During our store hours. Call or WhatsApp us and we'll confirm how soon a technician can reach you, usually within 30–60 minutes." },
  { q: "Will a jump start fix my battery?", a: "It gets you moving, but it doesn't repair a worn-out battery. If your battery keeps going flat or is more than 3–4 years old, it most likely needs replacing." },
  { q: "Can a jump start damage my car?", a: "Done in the correct order with proper cables, it's safe. Wrong connections can damage electronics, which is why we check everything before starting." },
  { q: "What should I keep ready?", a: "Your exact location (a map pin is best), the car make and model, and keys. A photo of the battery label helps us advise on a replacement." },
];

const JumpStartPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Car battery jump start service",
    serviceType: "Jump start",
    areaServed: { "@type": "City", name: "Bengaluru" },
    provider: { "@id": `${SITE_URL}/#store` },
  };

  return (
    <>
      <Seo
        title="Car Jump Start Service in Bengaluru"
        description="Dead car battery in Bengaluru? Our technician reaches you in about 30–60 minutes during store hours for a safe jump start. Call or WhatsApp Kachi Batteries."
        path="/jump-start"
        image={`${IMG}/hero.jpg`}
        breadcrumbs={[{ name: "Jump start", path: "/jump-start" }]}
        jsonLd={[jsonLd, faqJsonLd(FAQ)]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <img src={`${IMG}/hero.jpg`} alt="Red jumper cable clamped to a car battery terminal" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" aria-hidden />
        <div className="container-x relative py-16 sm:py-24 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold"><Zap className="h-3.5 w-3.5" /> Jump start service · Bengaluru</span>
            <h1 className="mt-5 font-display-tight text-4xl font-extrabold sm:text-6xl">Car won't start? We'll get you moving.</h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              A dead battery doesn't have to ruin your day. Call or WhatsApp us and a technician will come to you,
              usually within 30–60 minutes, to jump start your car safely.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={c.phoneTel} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold shadow-red hover:bg-primary-hover">
                <PhoneCall className="h-5 w-5" /> Call {c.phoneDisplay}
              </a>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-base font-semibold hover:brightness-95">
                <MessageCircle className="h-5 w-5" /> WhatsApp your location
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Facts */}
      <div className="container-x relative z-10 -mt-8">
        <ul className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-white shadow-elevated lg:grid-cols-4">
          {FACTS.map(({ Icon, t, s }, i) => (
            <li key={t} className={`flex items-center gap-3 p-4 sm:p-6 ${i % 2 === 0 ? "border-r border-line" : ""} ${i < 2 ? "border-b border-line lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block font-display text-base font-bold text-ink sm:text-lg">{t}</span>
                <span className="block text-xs text-muted-foreground sm:text-sm">{s}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Is it the battery? */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="overflow-hidden rounded-[2rem]">
            <img src={`${IMG}/signs.jpg`} alt="Warning triangle placed on a road at night beside a stopped car" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div>
            <div className="eyebrow">Know the signs</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">Is it really the battery?</h2>
            <p className="mt-3 text-muted-foreground">A jump start helps when the battery is flat. These signs usually point to the battery:</p>
            <ul className="mt-6 space-y-4">
              {BATTERY_SIGNS.map(({ Icon, t, s }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success"><Icon className="h-5 w-5" /></span>
                  <span>
                    <span className="block font-display font-bold text-ink">{t}</span>
                    <span className="block text-sm text-muted-foreground">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-muted/60 p-5">
              <div className="font-display font-bold text-ink">Probably not the battery if…</div>
              <ul className="mt-2 space-y-2">
                {NOT_BATTERY.map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-ink-soft"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16 border-y border-line bg-white py-14 sm:mt-24 sm:py-20">
        <div className="container-x">
          <div className="max-w-2xl">
            <div className="eyebrow">How it works</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">From stranded to started in four steps</h2>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ n, t, s }) => (
              <li key={n} className="relative rounded-3xl border border-line bg-background p-6">
                <span className="font-display text-5xl font-extrabold text-primary/20">{n}</span>
                <h3 className="mt-2 font-display text-lg font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What we check */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <div className="eyebrow">More than just cables</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">What our technician checks</h2>
            <p className="mt-3 text-muted-foreground">
              A car that dies once can die again tomorrow. Before and after the jump start, we look at why it happened,
              so you know whether you can keep driving on this battery.
            </p>
            <ul className="mt-6 space-y-3">
              {CHECKS.map((t) => (
                <li key={t} className="flex gap-3 text-ink"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> {t}</li>
              ))}
            </ul>
            <Link to="/shop/car-batteries" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-primary">
              <Car className="h-4 w-4" /> Need a new battery? Find one for your car <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 overflow-hidden rounded-[2rem] lg:order-2">
            <img src={`${IMG}/check.jpg`} alt="Technician connecting jumper cables under an open car bonnet" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </section>

      {/* DIY safety */}
      <section className="relative mt-16 overflow-hidden bg-gradient-hero py-14 text-white sm:mt-24 sm:py-20">
        <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
        <div className="container-x relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14">
          <div>
            <div className="eyebrow">Doing it yourself?</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold sm:text-4xl">Connect the cables in the right order</h2>
            <p className="mt-3 text-white/70">If another car and proper jumper cables are at hand, follow this order exactly. The wrong order can spark or damage electronics.</p>
            <div className="mt-6 overflow-hidden rounded-[2rem]">
              <img src={`${IMG}/diy.jpg`} alt="Hands holding red jumper cable clamps over a car engine" loading="lazy" className="aspect-[16/10] w-full object-cover" />
            </div>
          </div>
          <div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {DIY.map(({ t, s }, i) => (
                <li key={t} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-volt font-display text-sm font-bold text-ink">{i + 1}</span>
                    <span className="font-display font-bold">{t}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/65">{s}</p>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex gap-3 rounded-2xl bg-primary/20 p-4 text-sm">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-volt" />
              <span className="text-white/85">
                Never jump a swollen, cracked or leaking battery. Keep flames and sparks away, and check your owner's manual
                first for hybrid and electric cars. Not sure? Call us instead.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <div className="eyebrow">FAQ</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">Jump start questions</h2>
            <p className="mt-3 text-muted-foreground">Anything else? We're a call or a WhatsApp away.</p>
          </div>
          <Accordion type="single" collapsible defaultValue="q0" className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`q${i}`} className="surface border-b-0 px-5 sm:px-6">
                <AccordionTrigger className="py-5 text-left font-display text-base font-semibold text-ink hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-x mb-16 mt-16 sm:mt-24">
        <div className="relative grid gap-6 overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display-tight text-2xl font-bold sm:text-3xl">Stuck right now?</h2>
            <p className="mt-1 text-white/70">Call us or send your location on WhatsApp. We'll tell you the charge and how soon we can reach you.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={c.phoneTel} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-red hover:bg-primary-hover"><PhoneCall className="h-4 w-4" /> Call now</a>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold hover:brightness-95"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default JumpStartPage;
