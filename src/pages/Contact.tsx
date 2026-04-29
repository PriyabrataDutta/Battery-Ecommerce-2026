import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5).max(2000),
});

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
    <div className="container-x py-12 grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display-tight text-4xl font-bold">Get in Touch</h1>
        <p className="text-muted-foreground mt-2">Questions, support, or partnership — we're happy to help.</p>
        <div className="mt-8 space-y-4 text-sm">
          <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> +91 99999 99999</div>
          <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> hello@kachibatteries.com</div>
          <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary mt-0.5" /> Mumbai · Pune · Bangalore · Delhi</div>
        </div>
      </div>
      {done ? (
        <div className="bg-white border border-line p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <h2 className="font-display-tight text-2xl font-bold mt-4">Message Sent</h2>
          <p className="text-muted-foreground mt-2">We'll be in touch shortly.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-white border border-line p-6 grid gap-4">
          <Input name="name" placeholder="Name *" required />
          <Input name="email" type="email" placeholder="Email *" required />
          <Input name="phone" placeholder="Phone" />
          <Input name="subject" placeholder="Subject" />
          <Textarea name="message" rows={5} placeholder="Message *" required />
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending..." : "Send Message"}</Button>
        </form>
      )}
    </div>
  );
};

export default Contact;
