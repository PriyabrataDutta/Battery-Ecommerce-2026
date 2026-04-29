import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/adminLog";

type Hero = { headline: string; subhead: string; cta_label: string; cta_link: string };
type WhyItem = { title: string; desc: string };
type WhyUs = { items: WhyItem[] };

const heroDefault: Hero = { headline: "", subhead: "", cta_label: "Shop Now", cta_link: "/shop" };
const whyDefault: WhyUs = { items: [] };

const Content = () => {
  const qc = useQueryClient();
  const [hero, setHero] = useState<Hero>(heroDefault);
  const [why, setWhy] = useState<WhyUs>(whyDefault);

  const { data, isLoading } = useQuery({
    queryKey: ["content-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*").in("key", ["hero", "why_us"])).data ?? [],
  });

  useEffect(() => {
    if (!data?.length) return;
    data.forEach((row: any) => {
      if (row.key === "hero") setHero({ ...heroDefault, ...row.value });
      if (row.key === "why_us") setWhy({ ...whyDefault, ...row.value });
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert([
        { key: "hero", value: hero },
        { key: "why_us", value: why },
      ]);
      if (error) throw error;
      await logActivity("content.update", "site_settings", null, { keys: ["hero", "why_us"] });
    },
    onSuccess: () => { toast.success("Content saved"); qc.invalidateQueries({ queryKey: ["content-settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Homepage Hero">
        <Field label="Headline"><Input value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} /></Field>
        <Field label="Subhead"><Textarea rows={2} value={hero.subhead} onChange={(e) => setHero({ ...hero, subhead: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA label"><Input value={hero.cta_label} onChange={(e) => setHero({ ...hero, cta_label: e.target.value })} /></Field>
          <Field label="CTA link"><Input value={hero.cta_link} onChange={(e) => setHero({ ...hero, cta_link: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Why Us — bullets">
        <ul className="space-y-2">
          {why.items.map((it, i) => (
            <li key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
              <Input value={it.title} placeholder="Title" onChange={(e) => { const next = [...why.items]; next[i] = { ...it, title: e.target.value }; setWhy({ items: next }); }} />
              <Input value={it.desc} placeholder="Description" onChange={(e) => { const next = [...why.items]; next[i] = { ...it, desc: e.target.value }; setWhy({ items: next }); }} />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setWhy({ items: why.items.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" onClick={() => setWhy({ items: [...why.items, { title: "", desc: "" }] })}>
          <Plus className="h-4 w-4 mr-1" /> Add bullet
        </Button>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Save Content
        </Button>
      </div>
    </div>
  );
};

const Section = ({ title, children }: any) => (
  <div className="bg-card border border-line rounded-lg p-5 space-y-3">
    <h3 className="font-display-tight font-bold text-lg">{title}</h3>
    {children}
  </div>
);
const Field = ({ label, children }: any) => (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);

export default Content;
