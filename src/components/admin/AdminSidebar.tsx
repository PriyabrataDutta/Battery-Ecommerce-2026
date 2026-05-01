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
import { Link } from "react-router-dom";
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
import { useAdminTab, type AdminTab } from "@/stores/dashboardTabs";

type Item = { title: string; tab: AdminTab; icon: any };
type Section = { label: string; items: Item[] };

const sections: Section[] = [
  {
    label: "Catalog",
    items: [
      { title: "Dashboard", tab: "dashboard", icon: LayoutDashboard },
      { title: "Products", tab: "products", icon: Package },
      { title: "Brands", tab: "brands", icon: Tags },
      { title: "Categories", tab: "categories", icon: FolderTree },
      { title: "Settings", tab: "settings", icon: Settings },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", tab: "users", icon: Users },
      { title: "Orders", tab: "orders", icon: ShoppingBag },
      { title: "Quotes", tab: "quotes", icon: FileText },
      { title: "Messages", tab: "messages", icon: Mail },
    ],
  },
  {
    label: "Super Admin",
    items: [
      { title: "Audit Log", tab: "audit-log", icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { tab, setTab } = useAdminTab();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center px-3">
        <Link
          to="/admin"
          onClick={() => setTab("dashboard")}
          className="flex items-center gap-2.5 w-full"
        >
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
        </Link>
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
                  const active = tab === item.tab;
                  return (
                    <SidebarMenuItem key={item.tab}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="h-10 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold hover:bg-sidebar-accent/60"
                      >
                        <Link to={`/admin/${item.tab}`} onClick={() => setTab(item.tab)}>
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </Link>
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
