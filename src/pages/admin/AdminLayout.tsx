import { Outlet, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RequireStaff } from "@/components/auth/RequireStaff";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink, LogOut, MessageSquare, Settings as SettingsIcon, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAdminSessionFlags } from "@/lib/adminSession";

const titleMap: Record<string, { title: string; subtitle?: string }> = {
  "/admin": { title: "Sales Dashboard" },
  "/admin/products": { title: "Products" },
  "/admin/brands": { title: "Brands" },
  "/admin/categories": { title: "Categories" },
  "/admin/fitment": { title: "Car Fitment" },
  "/admin/bulk-upload": { title: "Bulk Upload" },
  "/admin/media": { title: "Media Library" },
  "/admin/offers": { title: "Offers & Coupons" },
  "/admin/catalogs": { title: "PDF Catalogs" },
  "/admin/settings": { title: "Settings" },
  "/admin/overview": { title: "Overview" },
  "/admin/users": { title: "Users" },
  "/admin/orders": { title: "Orders" },
  "/admin/quotes": { title: "Quote Requests" },
  "/admin/callbacks": { title: "Callback Requests" },
  "/admin/messages": { title: "Contact Messages" },
  "/admin/content": { title: "Content" },
  "/admin/blog": { title: "Blog Posts" },
  "/admin/activity": { title: "Activity Log" },
  "/admin/system": { title: "System Monitor" },
};

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const { pathname } = useLocation();
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = (data ?? []).map((r: any) => r.role as string);
        const top = roles.includes("admin")
          ? "Super Admin"
          : roles.includes("staff")
          ? "Staff"
          : roles[0] ?? "";
        setRole(top);
      });
  }, [user]);

  const matched = Object.keys(titleMap)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));
  const meta = (matched && titleMap[matched]) || { title: "Admin" };

  return (
    <RequireStaff>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/40">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 relative">
            <header className="bg-card border-b border-line sticky top-0 z-20">
              <div className="flex items-start gap-3 px-6 py-4">
                <SidebarTrigger className="mt-1" />
                <div className="flex-1 min-w-0">
                  <h1 className="font-display-tight font-bold text-2xl md:text-3xl leading-tight tracking-tight">
                    {meta.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    {role && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        {role}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Test notification sent", { description: "Notification system is working." })}
                  >
                    <Bell className="h-3.5 w-3.5 mr-1.5" /> Test Notification
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                    <Link to="/" target="_blank" aria-label="View store"><ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Sign out from all devices" title="Sign out everywhere">
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sign out from all devices?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will revoke every active session for your admin account on every browser and device.
                          You'll need to sign in again everywhere.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              if (user) {
                                await supabase.rpc("admin_log", {
                                  _action: "admin.global_signout",
                                  _entity_type: "session",
                                  _entity_id: user.id,
                                  _diff: { user_id: user.id, at: new Date().toISOString() },
                                });
                              }
                            } catch (e) {
                              console.error("[AdminLayout] global signout audit failed", e);
                            }
                            await supabase.auth.signOut({ scope: "global" });
                            clearAdminSessionFlags();
                            toast.success("Signed out from all devices");
                          }}
                        >
                          Sign out everywhere
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await signOut();
                      clearAdminSessionFlags();
                    }}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 overflow-x-auto">
              <Outlet />
            </main>

            {/* Floating action stack */}
            <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2">
              <button
                aria-label="Quick settings"
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-elevated grid place-items-center hover:bg-primary-hover transition-colors"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
              <button
                aria-label="Messages"
                className="h-11 w-11 rounded-full bg-card border border-line shadow-card grid place-items-center hover:bg-muted"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </RequireStaff>
  );
};

export default AdminLayout;
