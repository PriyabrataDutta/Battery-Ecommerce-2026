import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/adminLog";

type SiteSettings = {
  store: { name: string; tagline: string; phone: string; whatsapp: string; email: string; address: string; gst: string; footer_note: string };
  social: { facebook: string; instagram: string; youtube: string; linkedin: string };
};

const defaults: SiteSettings = {
  store: { name: "", tagline: "", phone: "", whatsapp: "", email: "", address: "", gst: "", footer_note: "" },
  social: { facebook: "", instagram: "", youtube: "", linkedin: "" },
};

const Settings = () => {
  const qc = useQueryClient();
  const [state, setState] = useState<SiteSettings>(defaults);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*").in("key", ["store", "social"])).data ?? [],
  });

  useEffect(() => {
    if (!data?.length) return;
    const next = { ...defaults };
    data.forEach((row: any) => {
      if (row.key === "store" || row.key === "social") (next as any)[row.key] = { ...(defaults as any)[row.key], ...row.value };
    });
    setState(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "store", value: state.store },
        { key: "social", value: state.social },
      ];
      const { error } = await supabase.from("site_settings").upsert(rows);
      if (error) throw error;
      await logActivity("settings.update", "site_settings", null, { keys: ["store", "social"] });
    },
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Store">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Store name"><Input value={state.store.name} onChange={(e) => setState({ ...state, store: { ...state.store, name: e.target.value } })} /></Field>
          <Field label="Tagline"><Input value={state.store.tagline} onChange={(e) => setState({ ...state, store: { ...state.store, tagline: e.target.value } })} /></Field>
          <Field label="Phone"><Input value={state.store.phone} onChange={(e) => setState({ ...state, store: { ...state.store, phone: e.target.value } })} /></Field>
          <Field label="WhatsApp"><Input value={state.store.whatsapp} onChange={(e) => setState({ ...state, store: { ...state.store, whatsapp: e.target.value } })} /></Field>
          <Field label="Email"><Input value={state.store.email} onChange={(e) => setState({ ...state, store: { ...state.store, email: e.target.value } })} /></Field>
          <Field label="GST number"><Input value={state.store.gst} onChange={(e) => setState({ ...state, store: { ...state.store, gst: e.target.value } })} /></Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={state.store.address} onChange={(e) => setState({ ...state, store: { ...state.store, address: e.target.value } })} /></Field>
        <Field label="Footer note"><Textarea rows={2} value={state.store.footer_note} onChange={(e) => setState({ ...state, store: { ...state.store, footer_note: e.target.value } })} /></Field>
      </Section>

      <Section title="Social Links">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Facebook"><Input value={state.social.facebook} onChange={(e) => setState({ ...state, social: { ...state.social, facebook: e.target.value } })} /></Field>
          <Field label="Instagram"><Input value={state.social.instagram} onChange={(e) => setState({ ...state, social: { ...state.social, instagram: e.target.value } })} /></Field>
          <Field label="YouTube"><Input value={state.social.youtube} onChange={(e) => setState({ ...state, social: { ...state.social, youtube: e.target.value } })} /></Field>
          <Field label="LinkedIn"><Input value={state.social.linkedin} onChange={(e) => setState({ ...state, social: { ...state.social, linkedin: e.target.value } })} /></Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Save Settings
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

export default Settings;
