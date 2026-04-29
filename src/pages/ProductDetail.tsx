import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, FileText, ShieldCheck, Truck, Wrench, MessageCircle } from "lucide-react";
import { formatINR, discountPct } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*), categories(*)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.brand_id, product?.id],
    enabled: !!product,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*)")
        .eq("brand_id", product!.brand_id!)
        .neq("id", product!.id)
        .limit(4);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  if (isLoading) return <div className="container-x py-20 text-center">Loading…</div>;
  if (!product) return <div className="container-x py-20 text-center">Product not found.</div>;

  const dpct = discountPct(product.price, product.mrp);

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, slug: product.slug, sku: product.sku, price: product.price, image: product.primary_image_url });
    toast.success("Added to cart");
  };

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/shop" className="hover:text-primary">Shop</Link> / <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="bg-white border border-line aspect-square overflow-hidden">
          {product.primary_image_url && (
            <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-primary">{product.battery_brands?.name}</div>
          <h1 className="font-display-tight text-4xl font-bold mt-1">{product.name}</h1>
          <div className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</div>

          <div className="flex items-baseline gap-3 mt-5">
            <span className="font-display text-4xl font-bold">{formatINR(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatINR(product.mrp)}</span>
                <span className="badge-pill bg-primary text-white">{dpct}% Off</span>
              </>
            )}
          </div>

          <p className="text-base text-ink-soft mt-4">{product.short_description}</p>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            {product.warranty_months && (
              <div className="bg-white border border-line p-3">
                <div className="text-xs text-muted-foreground">Warranty</div>
                <div className="font-display font-bold">{product.warranty_months} mo</div>
              </div>
            )}
            {product.capacity_ah && (
              <div className="bg-white border border-line p-3">
                <div className="text-xs text-muted-foreground">Capacity</div>
                <div className="font-display font-bold">{product.capacity_ah} Ah</div>
              </div>
            )}
            <div className="bg-white border border-line p-3">
              <div className="text-xs text-muted-foreground">Stock</div>
              <div className="font-display font-bold">{product.stock > 0 ? "In Stock" : "Out"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button size="lg" onClick={handleAdd} disabled={product.stock <= 0}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/quote"><FileText className="h-4 w-4 mr-2" /> Request Quote</Link>
            </Button>
          </div>
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-2 h-11 bg-whatsapp text-white text-sm font-bold uppercase tracking-wider">
            <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
          </a>

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            <Trust Icon={ShieldCheck} label="Genuine" />
            <Trust Icon={Truck} label="Fast Dispatch" />
            <Trust Icon={Wrench} label="Free Install" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="desc" className="mt-12">
        <TabsList className="bg-transparent border-b border-line w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger value="desc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">Description</TabsTrigger>
          <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">Specs</TabsTrigger>
          <TabsTrigger value="warranty" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">Warranty</TabsTrigger>
        </TabsList>
        <TabsContent value="desc" className="prose prose-sm max-w-none py-6">
          {product.description || product.short_description}
        </TabsContent>
        <TabsContent value="specs" className="py-6">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specs ?? {}).map(([k, v]) => (
                <tr key={k} className="border-b border-line">
                  <td className="py-2 font-semibold capitalize w-1/3">{k.replace(/_/g, " ")}</td>
                  <td className="py-2 text-muted-foreground">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="warranty" className="py-6 text-sm text-ink-soft">
          {product.warranty_months ?? 0} months manufacturer warranty. Honored at all authorized service centers across India.
        </TabsContent>
      </Tabs>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display-tight text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

function Trust({ Icon, label }: { Icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="bg-white border border-line p-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

export default ProductDetail;
