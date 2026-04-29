import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  Car,
  ShoppingBag,
  FileText,
  PhoneCall,
  Mail,
  Newspaper,
  FileDown,
  Upload,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Battery Brands", url: "/admin/brands", icon: Tags },
      { title: "Categories", url: "/admin/categories", icon: FolderTree },
      { title: "Car Fitment", url: "/admin/fitment", icon: Car },
      { title: "Bulk Upload", url: "/admin/bulk-upload", icon: Upload },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
      { title: "Quotes", url: "/admin/quotes", icon: FileText },
      { title: "Callbacks", url: "/admin/callbacks", icon: PhoneCall },
      { title: "Messages", url: "/admin/messages", icon: Mail },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Blog", url: "/admin/blog", icon: Newspaper },
      { title: "Catalogs (PDF)", url: "/admin/catalogs", icon: FileDown },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-line">
        <NavLink to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 grid place-items-center bg-primary text-primary-foreground font-display-tight font-bold">
            K
          </div>
          {!collapsed && (
            <div>
              <div className="font-display-tight font-bold leading-tight">KACHI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((s) => (
          <SidebarGroup key={s.label}>
            {!collapsed && <SidebarGroupLabel>{s.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {s.items.map((item) => {
                  const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
