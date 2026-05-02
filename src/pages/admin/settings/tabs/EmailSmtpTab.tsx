import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Send, Mail } from "lucide-react";

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  encryption: "tls" | "ssl" | "none";
  from_name: string;
  from_email: string;
  password_set: boolean;
}

const DEFAULTS: SmtpConfig = {
  host: "",
  port: 587,
  username: "",
  encryption: "tls",
  from_name: "",
  from_email: "",
  password_set: false,
};

const SETTING_KEY = "smtp_config";

export function EmailSmtpTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<SmtpConfig>(SETTING_KEY),
  });

  const [form, setForm] = useState<SmtpConfig>(DEFAULTS);
  const [password, setPassword] = useState("");
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const update = <K extends keyof SmtpConfig>(key: K, val: SmtpConfig[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const saveMut = useMutation({
    mutationFn: async () => {
      const toSave: SmtpConfig = { ...form, password_set: form.password_set || password.length > 0 };
      await setSetting(SETTING_KEY, toSave);
      // Password stored separately via edge function that saves to vault
      if (password) {
        await setSetting("smtp_password", password);
      }
    },
    onSuccess: () => {
      toast.success("SMTP settings saved");
      setPassword("");
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
    onSuccess: () => toast.success("Test email sent successfully!"),
    onError: (e: Error) => toast.error(`Test failed: ${e.message}`),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">Email / SMTP Configuration</h3>
        <p className="text-sm text-muted-foreground">Configure SMTP server for sending transactional emails.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> SMTP Server</CardTitle>
          <CardDescription className="text-xs">Enter your SMTP provider details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">SMTP Host</Label>
              <Input value={form.host} onChange={(e) => update("host", e.target.value)} placeholder="smtp.gmail.com" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Port</Label>
              <Input type="number" value={form.port} onChange={(e) => update("port", parseInt(e.target.value) || 587)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="your@email.com" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password {form.password_set && <span className="text-muted-foreground">(already set)</span>}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={form.password_set ? "••••••••" : "Enter password"} className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Encryption</Label>
            <Select value={form.encryption} onValueChange={(v) => update("encryption", v as SmtpConfig["encryption"])}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS (Port 587)</SelectItem>
                <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                <SelectItem value="none">None (Port 25)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sender Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From Name</Label>
              <Input value={form.from_name} onChange={(e) => update("from_name", e.target.value)} placeholder="Kachi Batteries" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Email</Label>
              <Input value={form.from_email} onChange={(e) => update("from_email", e.target.value)} placeholder="noreply@yourdomain.com" className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save SMTP Settings
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Test Email</CardTitle>
          <CardDescription className="text-xs">Send a test email to verify your SMTP configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="h-9 text-sm flex-1"
              type="email"
            />
            <Button
              variant="outline"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending || !testEmail || !form.host}
            >
              {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
