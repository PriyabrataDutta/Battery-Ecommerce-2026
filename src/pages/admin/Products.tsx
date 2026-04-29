import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatINR } from "@/lib/format";

const Products = () => {
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, sku, name, price, stock, status, primary_image_url, has_exchange, exchange_rebate, battery_brands(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} products in catalog</p>
        <Button asChild><Link to="/admin/products/new"><Plus className="h-4 w-4 mr-2" /> New Product</Link></Button>
      </div>

      <DataTable
        rows={rows as any}
        searchKeys={["name", "sku"]}
        columns={[
          {
            key: "img", header: "", className: "w-12",
            render: (r: any) => r.primary_image_url
              ? <img src={r.primary_image_url} alt="" className="h-10 w-10 object-contain bg-white border border-line" />
              : <div className="h-10 w-10 bg-muted" />
          },
          {
            key: "name", header: "Product",
            render: (r: any) => (
              <div>
                <Link to={`/admin/products/${r.id}`} className="font-semibold hover:text-primary">{r.name}</Link>
                <div className="text-[11px] text-muted-foreground">{r.battery_brands?.name ?? "—"} · SKU {r.sku}</div>
              </div>
            )
          },
          { key: "price", header: "Price", render: (r: any) => formatINR(r.price) },
          {
            key: "exchange", header: "Exchange",
            render: (r: any) => r.has_exchange && r.exchange_rebate > 0
              ? <span className="text-xs text-primary font-semibold">– {formatINR(r.exchange_rebate)}</span>
              : <span className="text-xs text-muted-foreground">—</span>
          },
          {
            key: "stock", header: "Stock",
            render: (r: any) => <span className={r.stock < 5 ? "text-primary font-bold" : ""}>{r.stock}</span>
          },
          { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
};

export default Products;
