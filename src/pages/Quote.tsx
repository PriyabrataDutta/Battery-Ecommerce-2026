import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Name required").max(100),
  company: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(7, "Valid phone required").max(20),
  email: z.string().trim().email("Valid email required").max(255),
  requirement: z.string().trim().min(5, "Tell us what you need").max(2000),
});

const Quote = () => {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("quote_requests").insert(parsed.data as never);
    setBusy(false);
    if (error) {
      toast.error("Could not submit. Try again.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="container-x py-12 max-w-3xl">
      <h1 className="font-display-tight text-4xl font-bold">Request a Quote</h1>
      <p className="text-muted-foreground mt-2">B2B pricing, bulk orders, BOQ support — we'll get back within 1 business hour.</p>

      {submitted ? (
        <div className="bg-white border border-line p-10 text-center mt-8">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <h2 className="font-display-tight text-2xl font-bold mt-4">Request Received</h2>
          <p className="text-muted-foreground mt-2">Our team will call you back shortly.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-white border border-line p-6 mt-8 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name *" name="name" required />
            <Field label="Company" name="company" />
            <Field label="Phone *" name="phone" required />
            <Field label="Email *" name="email" type="email" required />
          </div>
          <div>
            <label className="text-sm font-semibold">Requirement *</label>
            <Textarea name="requirement" rows={5} required className="mt-1" placeholder="Tell us product, quantity, delivery location..." />
          </div>
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Submitting..." : "Submit Request"}</Button>
        </form>
      )}
    </div>
  );
};

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <Input name={name} type={type} required={required} className="mt-1" />
    </div>
  );
}

export default Quote;
