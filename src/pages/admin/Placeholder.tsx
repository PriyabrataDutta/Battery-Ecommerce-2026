import { Card } from "@/components/ui/card";

/**
 * Generic placeholder card kept around for any future "coming soon"
 * section. All admin panels are now real feature folders:
 *
 *   src/pages/admin/products/
 *   src/pages/admin/orders/
 *   src/pages/admin/brands/
 *   src/pages/admin/categories/
 *   src/pages/admin/users/
 *   src/pages/admin/quotes/
 *   src/pages/admin/messages/
 *   src/pages/admin/settings/
 */
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
