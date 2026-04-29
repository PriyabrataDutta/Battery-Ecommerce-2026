import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  ShoppingBag,
  FileText,
  Mail,
  Settings,
  Users,
  Activity,
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
import logo from "@/assets/kachi-logo.png";

type Item = { title: string; url: string; icon: any; end?: boolean };
type Section = { label: string; items: Item[] };

const sections: Section[] = [
  {
    label: "Catalog",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Brands", url: "/admin/brands", icon: Tags },
      { title: "Categories", url: "/admin/categories", icon: FolderTree },
      { title: "Car Fitment", url: "/admin/fitment", icon: Car },
      { title: "Bulk Upload", url: "/admin/bulk-upload", icon: Upload },
      { title: "Media", url: "/admin/media", icon: ImageIcon },
      { title: "Offers", url: "/admin/offers", icon: BadgePercent },
      { title: "Catalogs", url: "/admin/catalogs", icon: FileDown },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Overview", url: "/admin/overview", icon: LayoutGrid },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
      { title: "Quotes", url: "/admin/quotes", icon: FileText },
      { title: "Callbacks", url: "/admin/callbacks", icon: PhoneCall },
      { title: "Messages", url: "/admin/messages", icon: Mail },
      { title: "Content", url: "/admin/content", icon: FileBox },
      { title: "Blog", url: "/admin/blog", icon: Newspaper },
    ],
  },
  {
    label: "Super Admin",
    items: [
      { title: "Activity Log", url: "/admin/activity", icon: Activity },
      { title: "System Monitor", url: "/admin/system", icon: MonitorCheck },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center px-3">
        <NavLink to="/admin" className="flex items-center gap-2.5 w-full">
          <div className="h-9 w-9 shrink-0 rounded bg-white grid place-items-center p-1">
            <img src={logo} alt="Kachi" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display-tight font-bold text-sidebar-foreground text-base tracking-wide">
                KACHI Admin
              </div>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        {sections.map((s) => (
          <SidebarGroup key={s.label} className="mb-1">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50 px-2 mb-1">
                {s.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {s.items.map((item) => {
                  const active = item.end
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="h-10 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold hover:bg-sidebar-accent/60"
                      >
                        <NavLink to={item.url} end={item.end} className="flex items-center gap-3">
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
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
