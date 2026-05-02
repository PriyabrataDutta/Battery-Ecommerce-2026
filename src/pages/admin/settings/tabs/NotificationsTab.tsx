import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Bell } from "lucide-react";

type Role = "super_admin" | "admin" | "staff" | "customer";

interface NotificationEvent {
  id: string;
  label: string;
  category: "staff" | "customer";
  applicableRoles: Role[];
}

const EVENTS: NotificationEvent[] = [
  // Staff events
  { id: "new_order", label: "New Order Placed", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "order_confirmed", label: "Order Confirmed", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "order_shipped", label: "Order Shipped", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "order_delivered", label: "Order Delivered", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "order_cancelled", label: "Order Cancelled", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "new_customer", label: "New Customer Registration", category: "staff", applicableRoles: ["super_admin", "admin"] },
  { id: "new_quote", label: "New Quote Request", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "new_contact", label: "New Contact Message", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "new_callback", label: "New Callback Request", category: "staff", applicableRoles: ["super_admin", "admin", "staff"] },
  { id: "low_stock", label: "Low Stock Alert", category: "staff", applicableRoles: ["super_admin", "admin"] },
  { id: "payment_received", label: "Payment Received", category: "staff", applicableRoles: ["super_admin", "admin"] },
  { id: "payment_failed", label: "Payment Failed", category: "staff", applicableRoles: ["super_admin", "admin"] },
  // Customer events
  { id: "cust_order_confirmation", label: "Order Confirmation", category: "customer", applicableRoles: ["customer"] },
  { id: "cust_order_shipped", label: "Order Shipped", category: "customer", applicableRoles: ["customer"] },
  { id: "cust_order_delivered", label: "Order Delivered", category: "customer", applicableRoles: ["customer"] },
  { id: "cust_order_cancelled", label: "Order Cancelled / Refunded", category: "customer", applicableRoles: ["customer"] },
  { id: "cust_welcome", label: "Welcome Email (Account Created)", category: "customer", applicableRoles: ["customer"] },
  { id: "cust_quote_response", label: "Quote Response Ready", category: "customer", applicableRoles: ["customer"] },
];

type NotificationSettings = Record<string, Record<Role, boolean>>;

const buildDefaults = (): NotificationSettings => {
  const out: NotificationSettings = {};
  EVENTS.forEach((e) => {
    out[e.id] = {} as Record<Role, boolean>;
    e.applicableRoles.forEach((r) => {
      out[e.id][r] = true; // All on by default
    });
  });
  return out;
};

const SETTING_KEY = "notification_settings";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  customer: "Customer",
};

export function NotificationsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<NotificationSettings>(SETTING_KEY),
  });

  const [form, setForm] = useState<NotificationSettings>(buildDefaults);

  useEffect(() => {
    if (data) {
      const merged = buildDefaults();
      for (const [eventId, roles] of Object.entries(data)) {
        if (merged[eventId]) {
          for (const [role, val] of Object.entries(roles)) {
            if (role in merged[eventId]) merged[eventId][role as Role] = val as boolean;
          }
        }
      }
      setForm(merged);
    }
  }, [data]);

  const toggle = (eventId: string, role: Role) => {
    setForm((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [role]: !prev[eventId]?.[role] },
    }));
  };

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("Notification settings saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  const staffEvents = EVENTS.filter((e) => e.category === "staff");
  const customerEvents = EVENTS.filter((e) => e.category === "customer");
  const staffRoles: Role[] = ["super_admin", "admin", "staff"];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notification Settings</h3>
        <p className="text-sm text-muted-foreground">Control which notifications are sent to each role.</p>
      </div>

      {/* Staff Notifications */}
      <div>
        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Staff Notifications
        </h4>
        <div className="border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-muted/30">
                <th className="text-left px-3 py-2 font-medium text-xs">Event</th>
                {staffRoles.map((r) => (
                  <th key={r} className="text-center px-3 py-2 font-medium text-xs w-24">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffEvents.map((ev) => (
                <tr key={ev.id} className="border-b border-line last:border-0 hover:bg-muted/10">
                  <td className="px-3 py-2 text-sm">{ev.label}</td>
                  {staffRoles.map((r) => (
                    <td key={r} className="text-center px-3 py-2">
                      {ev.applicableRoles.includes(r) ? (
                        <Switch
                          checked={form[ev.id]?.[r] ?? false}
                          onCheckedChange={() => toggle(ev.id, r)}
                          className="mx-auto"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Notifications */}
      <div>
        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Customer Notifications
        </h4>
        <div className="border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-muted/30">
                <th className="text-left px-3 py-2 font-medium text-xs">Event</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-24">Customer</th>
              </tr>
            </thead>
            <tbody>
              {customerEvents.map((ev) => (
                <tr key={ev.id} className="border-b border-line last:border-0 hover:bg-muted/10">
                  <td className="px-3 py-2 text-sm">{ev.label}</td>
                  <td className="text-center px-3 py-2">
                    <Switch
                      checked={form[ev.id]?.customer ?? false}
                      onCheckedChange={() => toggle(ev.id, "customer")}
                      className="mx-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Notification Settings
      </Button>
    </div>
  );
}
