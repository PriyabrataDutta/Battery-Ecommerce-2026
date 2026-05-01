import { Card } from "@/components/ui/card";

export function AdminPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="p-8">
      <h2 className="font-display-tight text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">
        {description ?? "This section is protected and only visible to staff. Content coming soon."}
      </p>
    </Card>
  );
}

// AdminProducts and AdminOrders are now real feature folders:
//   src/pages/admin/products/  and  src/pages/admin/orders/
// The other panels below are still placeholders awaiting build-out.
export const AdminUsers = () => <AdminPlaceholder title="Users" />;
export const AdminBrands = () => <AdminPlaceholder title="Brands" />;
export const AdminCategories = () => <AdminPlaceholder title="Categories" />;
export const AdminQuotes = () => <AdminPlaceholder title="Quote Requests" />;
export const AdminMessages = () => <AdminPlaceholder title="Contact Messages" />;
export const AdminSettings = () => <AdminPlaceholder title="Settings" />;
