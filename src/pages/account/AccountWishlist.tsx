import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/products/ProductCard";
import { Heart } from "lucide-react";
import type { Product } from "@/types/catalog";

const AccountWishlist = () => {
  const { user } = useAuth();
  const { items } = useWishlist();

  const productIds = items.map((i) => i.product_id);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*), categories(*)")
        .in("id", productIds);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    enabled: productIds.length > 0,
    staleTime: 60_000,
  });

  return (
    <section className="bg-white border border-line p-6">
      <div className="flex items-center gap-3 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-2xl font-bold">Wishlist</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Products you've saved for later. Click the heart to remove.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
          Your wishlist is empty. Browse the shop and tap the heart icon on products you like.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default AccountWishlist;
