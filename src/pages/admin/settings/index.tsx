import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Mail, Bell, Receipt, Truck, Settings } from "lucide-react";
import { PaymentGatewayTab } from "./tabs/PaymentGatewayTab";
import { EmailSmtpTab } from "./tabs/EmailSmtpTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { GstTab } from "./tabs/GstTab";
import { ShippingTab } from "./tabs/ShippingTab";

// Lazy-load the old advanced settings
import { SettingsTable } from "./components/SettingsTable";
import { SettingsEditor } from "./components/SettingsEditor";
import { useSettingsQuery } from "./hooks/useAdminSettings";
import type { SiteSettingRow } from "@/api/admin/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

function AdvancedSettingsTab() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SiteSettingRow | null>(null);
  const q = useSettingsQuery();

  const filtered = (q.data ?? []).filter((r) =>
    !search.trim() ? true : r.key.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings by key"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} settings</span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          New setting
        </Button>
      </div>
      <SettingsTable
        rows={filtered}
        loading={q.isLoading}
        onRowClick={(s) => { setEditing(s); setOpen(true); }}
        onCreate={() => { setEditing(null); setOpen(true); }}
      />
      <SettingsEditor open={open} onOpenChange={setOpen} setting={editing} />
    </div>
  );
}

const TABS = [
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "email", label: "Email / SMTP", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "gst", label: "GST", icon: Receipt },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "advanced", label: "Advanced", icon: Settings },
] as const;

const AdminSettings = () => {
  return (
    <Tabs defaultValue="payment" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2"
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="payment"><PaymentGatewayTab /></TabsContent>
      <TabsContent value="email"><EmailSmtpTab /></TabsContent>
      <TabsContent value="notifications"><NotificationsTab /></TabsContent>
      <TabsContent value="gst"><GstTab /></TabsContent>
      <TabsContent value="shipping"><ShippingTab /></TabsContent>
      <TabsContent value="advanced"><AdvancedSettingsTab /></TabsContent>
    </Tabs>
  );
};

export default AdminSettings;
