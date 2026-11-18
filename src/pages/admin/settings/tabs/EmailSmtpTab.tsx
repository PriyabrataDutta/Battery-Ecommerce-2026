import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Send, Mail } from "lucide-react";

/** Sender identity for Resend. The API key is a Supabase function secret (RESEND_API_KEY). */
interface EmailSettings {
  from_name: string;
  from_email: string;
}

const DEFAULTS: EmailSettings = { from_name: "Kachi Batteries", from_email: "" };
const SETTING_KEY = "email_settings";

export function EmailSmtpTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<EmailSettings>(SETTING_KEY),
  });

  const [form, setForm] = useState<EmailSettings>(DEFAULTS);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("Email settings saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("send-test-email", {
        body: { to: testEmail },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => toast.success("Test email sent — check the inbox"),
    onError: (e: Error) => toast.error(`Test failed: ${e.message}`),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Email</h3>
        <p className="text-sm text-muted-foreground">
          Transactional emails are sent through Resend. The API key is stored as a Supabase secret, not here.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Sender Identity</CardTitle>
          <CardDescription className="text-xs">
            The From address must be on a domain verified in Resend (e.g. orders@kachibatteries.com).
            Leave it blank to use Resend's test sender, which only delivers to your Resend account's email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From Name</Label>
              <Input value={form.from_name} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} placeholder="Kachi Batteries" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Email</Label>
              <Input type="email" value={form.from_email} onChange={(e) => setForm((p) => ({ ...p, from_email: e.target.value.trim() }))} placeholder="orders@kachibatteries.com" className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Email Settings
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Test Email</CardTitle>
          <CardDescription className="text-xs">Send a test email to check delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-9 text-sm flex-1"
              type="email"
            />
            <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending || !testEmail}>
              {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
