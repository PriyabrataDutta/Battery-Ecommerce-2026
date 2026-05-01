/**
 * DetailsTabs — Details / Specifications / Warranty / Delivery tab block.
 *
 * Pure presentation. Receives the full product so every tab can pull what
 * it needs without re-fetching.
 */
import { ShieldCheck, Truck, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpecRow } from "./SpecRow";

type Props = {
  product: {
    sku: string;
    description: string | null;
    short_description: string | null;
    warranty_months: number | null;
    capacity_ah: number | null;
    specs: Record<string, unknown> | null;
    battery_brands: { name: string } | null;
  };
};

export const DetailsTabs = ({ product }: Props) => {
  return (
    <Tabs defaultValue="desc" className="mt-10 sm:mt-12">
      <TabsList className="bg-transparent border-b border-line w-full justify-start rounded-none h-auto p-0 overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none">
        {[
          ["desc", "Details"],
          ["specs", "Specifications"],
          ["warranty", "Warranty"],
          ["delivery", "Delivery & Install"],
        ].map(([v, l]) => (
          <TabsTrigger
            key={v}
            value={v}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 sm:px-4 py-2.5 font-semibold uppercase tracking-wider text-[11px] sm:text-xs flex-shrink-0"
          >
            {l}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="desc" className="py-6">
        <div className="prose prose-sm max-w-none text-ink-soft">
          {product.description || product.short_description}
        </div>
      </TabsContent>

      <TabsContent value="specs" className="py-6">
        <table className="w-full text-sm border border-line">
          <tbody>
            <SpecRow label="Brand" value={product.battery_brands?.name} />
            <SpecRow label="Item Code / SKU" value={product.sku} />
            {product.capacity_ah && (
              <SpecRow label="Capacity" value={`${product.capacity_ah} Ah`} />
            )}
            {product.warranty_months && (
              <SpecRow label="Warranty" value={`${product.warranty_months} months`} />
            )}
            {Object.entries(product.specs ?? {}).map(([k, v]) => (
              <SpecRow key={k} label={k.replace(/_/g, " ")} value={String(v)} />
            ))}
          </tbody>
        </table>
      </TabsContent>

      <TabsContent value="warranty" className="py-6 text-sm text-ink-soft space-y-2">
        <p>
          <strong className="text-ink">{product.warranty_months ?? 0} months</strong>{" "}
          manufacturer warranty covering manufacturing defects.
        </p>
        <p>Honored at all authorized service centers across India.</p>
        <p>
          Old battery must be returned per Battery Management & Handling Rules (BMHR) of the
          Indian Government.
        </p>
      </TabsContent>

      <TabsContent value="delivery" className="py-6 text-sm text-ink-soft space-y-2">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" /> Free shipping pan-India.
        </p>
        <p className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> Free doorstep installation in serviceable cities.
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Genuine product with full manufacturer warranty.
        </p>
      </TabsContent>
    </Tabs>
  );
};
