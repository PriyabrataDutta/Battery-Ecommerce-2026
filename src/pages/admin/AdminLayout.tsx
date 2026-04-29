import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RequireStaff } from "@/components/auth/RequireStaff";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/brands": "Battery Brands",
  "/admin/categories": "Categories",
  "/admin/fitment": "Car Fitment",
  "/admin/bulk-upload": "Bulk Upload",
  "/admin/orders": "Orders",
  "/admin/quotes": "Quote Requests",
  "/admin/callbacks": "Callback Requests",
  "/admin/messages": "Contact Messages",
  "/admin/blog": "Blog Posts",
  "/admin/catalogs": "PDF Catalogs",
};

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const { pathname } = useLocation();
  const matched = Object.keys(titles)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));
  const title = (matched && titles[matched]) || "Admin";

  return (
    <RequireStaff>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 bg-white border-b border-line flex items-center px-4 gap-3 sticky top-0 z-20">
              <SidebarTrigger />
              <h1 className="font-display-tight font-bold text-lg flex-1 truncate">{title}</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/" target="_blank"><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Store</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
              </Button>
            </header>
            <main className="flex-1 p-6 overflow-x-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RequireStaff>
  );
};

export default AdminLayout;
