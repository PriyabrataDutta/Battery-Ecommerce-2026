import { ReactNode } from "react";

export const StubPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) => (
  <div className="bg-card border border-line rounded-lg p-10 text-center">
    <h2 className="font-display-tight font-bold text-2xl mb-2">{title}</h2>
    {description && <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
    {children && <div className="mt-6">{children}</div>}
  </div>
);

export const Categories = () => (
  <StubPage title="Categories" description="Organize your product catalog into categories. CRUD coming next." />
);
export const Brands = () => (
  <StubPage title="Brands" description="Manage battery brand listings, logos, and sort order." />
);
export const Fitment = () => (
  <StubPage title="Car Fitment" description="Map products to car brands and models." />
);
export const Media = () => (
  <StubPage title="Media Library" description="Browse and upload product, brand, and blog images." />
);
export const Offers = () => (
  <StubPage title="Offers & Coupons" description="Create promotional offers and discount codes." />
);
export const Catalogs = () => (
  <StubPage title="PDF Catalogs" description="Upload and publish downloadable product catalogs." />
);
export const Settings = () => (
  <StubPage title="Settings" description="Store-wide configuration: branding, contacts, integrations." />
);
export const Overview = () => (
  <StubPage title="Overview" description="High-level summary of store activity." />
);
export const Users = () => (
  <StubPage title="Users" description="View customers and assign staff/admin roles." />
);
export const Orders = () => (
  <StubPage title="Orders" description="View, update status, and fulfill customer orders." />
);
export const Quotes = () => (
  <StubPage title="Quote Requests" description="Bulk and project quote requests from customers." />
);
export const Callbacks = () => (
  <StubPage title="Callback Requests" description="Customers requesting a phone callback." />
);
export const Messages = () => (
  <StubPage title="Contact Messages" description="Inbound contact form submissions." />
);
export const Content = () => (
  <StubPage title="Content" description="Manage static pages, banners, and homepage sections." />
);
export const Blog = () => (
  <StubPage title="Blog Posts" description="Write and publish articles for your store blog." />
);
export const ActivityLog = () => (
  <StubPage title="Activity Log" description="Audit trail of admin actions across the system." />
);
export const SystemMonitor = () => (
  <StubPage title="System Monitor" description="Health checks, edge function status, and database metrics." />
);
