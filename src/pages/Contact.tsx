import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, CheckCircle2, MessageCircle, ArrowRight, Package, RotateCcw, FileText } from "lucide-react";
import { contactInfo as c } from "@/components/layout/Header/lib/nav";
import { Seo } from "@/components/Seo";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, "Please write a short message").max(2000),
});

const channels = [
  { Icon: Phone, title: "Call us", value: c.phoneDisplay, href: c.phoneTel, note: "Talk to a battery expert" },
  { Icon: MessageCircle, title: "WhatsApp", value: c.phoneDisplay, href: c.whatsappUrl, note: "Send your vehicle or inverter details", external: true },
  { Icon: Mail, title: "Email", value: c.email, href: `mailto:${c.email}`, note: "We reply within 1 working day" },
];

const quickHelp = [
  { Icon: Package, label: "Track my order", to: "/account/orders" },
  { Icon: RotateCcw, label: "Returns & refunds", to: "/refund-policy" },
  { Icon: FileText, label: "Bulk / B2B quote", to: "/quote" },
];

const Contact = () => {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(fd);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data as never);
    setBusy(false);
    if (error) { toast.error("Could not send. Try again."); return; }
    setDone(true);
  };

  return (
    <div>
      <Seo title="Contact Us — Call, WhatsApp or Visit" description="Contact Kachi Batteries: call or WhatsApp +91 81975 68707, email kachibatteries@gmail.com, or visit our store, Manjunatha Batteries in Bengaluru." path="/contact" breadcrumbs={[{ name: "Contact", path: "/contact" }]} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative py-14 md:py-20 pb-20 md:pb-24">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-3 font-display-tight text-4xl md:text-5xl font-bold">We're here to help</h1>
          <p className="mt-3 max-w-xl text-white/75">
            Choosing a battery, tracking an order or need help after installation? Reach us the way that suits you.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="container-x relative -mt-10 grid gap-4 md:grid-cols-3">
        {channels.map(({ Icon, title, value, href, note, external }) => (
          <a
            key={title}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group flex items-start gap-4 surface p-5 hover-lift"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
              <span className="mt-0.5 block truncate font-semibold text-ink group-hover:text-primary">{value}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{note}</span>
            </span>
          </a>
        ))}
      </section>

      {/* Form + store */}
      <section className="container-x py-14 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="font-display-tight text-2xl font-bold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">Fields marked * are required.</p>
          {done ? (
            <div className="mt-6 surface p-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h3 className="mt-4 font-display-tight text-2xl font-bold">Message sent</h3>
              <p className="mt-2 text-muted-foreground">Thanks! We'll get back to you within 1 working day.</p>
              <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-4 surface p-6 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="c-name">Name *</Label>
                <Input id="c-name" name="name" autoComplete="name" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-email">Email *</Label>
                <Input id="c-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-phone">Phone</Label>
                <Input id="c-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-subject">Subject</Label>
                <Input id="c-subject" name="subject" placeholder="e.g. Battery for Swift 2019" maxLength={200} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="c-message">Message *</Label>
                <Textarea id="c-message" name="message" rows={5} maxLength={2000} required />
              </div>
              <Button type="submit" size="lg" disabled={busy} className="sm:col-span-2 sm:justify-self-start">
                {busy ? "Sending..." : "Send message"}
              </Button>
            </form>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden surface">
            <iframe
              title={`${c.storeName} on Google Maps`}
              src={c.mapEmbedUrl}
              className="h-56 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Visit our store
              </p>
              <p className="mt-2 font-semibold text-ink">{c.storeName}</p>
              <p className="text-sm text-muted-foreground">{c.storeCity}</p>
              <p className="mt-1 text-sm text-muted-foreground">Kachi Batteries is a sister concern of {c.storeName}.</p>
              <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Get directions <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick help</p>
            <ul className="mt-3 divide-y divide-line">
              {quickHelp.map(({ Icon, label, to }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-3 py-3 text-sm font-medium text-ink hover:text-primary">
                    <Icon className="h-4 w-4 text-primary" /> {label}
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Contact;
