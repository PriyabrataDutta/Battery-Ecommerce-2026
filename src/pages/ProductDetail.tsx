import { useParams, Link } from "react-router-dom";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingCart,
  FileText,
  ShieldCheck,
  Truck,
  Wrench,
  MessageCircle,
  Minus,
  Plus,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { formatINR, discountPct } from "@/lib/format";
import { getProductImage } from "@/lib/productImage";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import gsap from "gsap";
import {
  useProductBySlug,
  useProductImages,
  useRelatedProducts,
} from "@/hooks/queries/useProducts";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [withExchange, setWithExchange] = useState(false);
  const [pin, setPin] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: gallery = [] } = useProductImages(product?.id);
  const { data: related = [] } = useRelatedProducts(product?.brand_id, product?.id);

  const allImages = useMemo(() => {
    if (!product) return [] as string[];
    const fromGallery = gallery.map((g) => g.url);
    const set = new Set<string>();
    if (product.primary_image_url) set.add(product.primary_image_url);
    fromGallery.forEach((u) => set.add(u));
    if (set.size === 0) {
      set.add(getProductImage(null, product.battery_brands?.name));
    }
    return Array.from(set);
  }, [product, gallery]);

  useEffect(() => {
    if (!activeImage && allImages.length) setActiveImage(allImages[0]);
  }, [allImages, activeImage]);

  // GSAP fade on image change
  useEffect(() => {
    if (mainImgRef.current && activeImage) {
      gsap.fromTo(
        mainImgRef.current,
        { opacity: 0, scale: 1.02 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [activeImage]);

  if (isLoading) return <div className="container-x py-20 text-center">Loading…</div>;
  if (!product) return <div className="container-x py-20 text-center">Product not found.</div>;

  const dpct = discountPct(product.price, product.mrp);
  const showExchange = product.has_exchange && product.exchange_rebate > 0;
  const exchangeUnit = product.price - product.exchange_rebate;
  const effectiveUnit = withExchange ? exchangeUnit : product.price;
  const lineTotal = effectiveUnit * qty;
  const baseTotal = (product.mrp ?? product.price) * qty;
  const discountAmt = Math.max(0, baseTotal - product.price * qty);
  const totalSaving = discountAmt + (withExchange ? product.exchange_rebate * qty : 0);

  const handleCheckPin = () => {
    if (!/^\d{6}$/.test(pin)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    toast.success(`Delivery available to ${pin}`, {
      description: "Estimated 2–4 business days. Free shipping & installation.",
    });
  };

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        image: product.primary_image_url,
        withExchange,
        exchangeRebate: product.exchange_rebate,
      },
      qty
    );
    toast.success("Added to cart", {
      description: withExchange ? "With old battery exchange" : "Without exchange",
    });
  };

  return (
    <div className="container-x py-5 sm:py-8 pb-24 lg:pb-8">
      <nav className="text-xs text-muted-foreground mb-4 sm:mb-5 overflow-x-auto whitespace-nowrap scrollbar-none">
        <Link to="/" className="hover:text-primary">Home</Link>
        {" / "}
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        {product.categories?.slug && (
          <>
            {" / "}
            <Link to={`/category/${product.categories.slug}`} className="hover:text-primary">
              {product.categories.name}
            </Link>
          </>
        )}
        {" / "}<span className="text-ink">{product.name}</span>
      </nav>

      {/* Top: 12-col grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Gallery */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white border border-line aspect-square overflow-hidden">
            {activeImage && (
              <img
                ref={mainImgRef}
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            )}
          </div>
          {allImages.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {allImages.slice(0, 5).map((url) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(url)}
                  className={`bg-white border aspect-square overflow-hidden ${
                    activeImage === url ? "border-primary ring-1 ring-primary" : "border-line"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="col-span-12 lg:col-span-4">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            {product.battery_brands?.name}
          </div>
          <h1 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 leading-tight">
            {product.name}
          </h1>
          <div className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</div>

          {/* Without exchange */}
          <div className="mt-4 sm:mt-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Without Exchange
            </div>
            <div className="flex items-baseline gap-2 sm:gap-3 mt-1 flex-wrap">
              <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
                {formatINR(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="text-sm sm:text-base text-muted-foreground line-through">
                    {formatINR(product.mrp)}
                  </span>
                  <span className="badge-pill bg-primary text-white text-[10px]">{dpct}% Off</span>
                </>
              )}
              <span className="text-xs text-muted-foreground">(Per unit)</span>
            </div>
          </div>

          {/* With exchange */}
          {showExchange && (
            <div className="mt-3 border border-primary/30 bg-primary/5 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                With Old Battery Exchange
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-2xl font-bold text-primary">
                  {formatINR(exchangeUnit)}
                </span>
                <span className="text-xs text-ink-soft">
                  Save {formatINR(product.exchange_rebate)} on return of similar old battery
                </span>
              </div>
            </div>
          )}

          <p className="text-sm text-ink-soft mt-4">{product.short_description}</p>

          {/* Qty + stock */}
          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center border border-line">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-10 w-10 grid place-items-center hover:bg-muted"
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-10 w-10 grid place-items-center hover:bg-muted"
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              className={`text-xs font-bold uppercase tracking-wider ${
                product.stock > 0 ? "text-success" : "text-primary"
              }`}
            >
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </div>
          </div>

          {/* Pincode */}
          <div className="mt-5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Check Delivery
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit pincode"
                className="h-11"
              />
              <Button variant="outline" className="h-11" onClick={handleCheckPin}>
                Check
              </Button>
            </div>
          </div>

          {/* Old battery return toggle */}
          {showExchange && (
            <label className="mt-4 flex items-start gap-3 p-3 border border-line bg-white cursor-pointer hover:border-ink transition-colors">
              <Checkbox
                checked={withExchange}
                onCheckedChange={(v) => setWithExchange(Boolean(v))}
                className="mt-0.5"
              />
              <div>
                <div className="font-semibold text-sm">I will return my old battery</div>
                <div className="text-xs text-muted-foreground">
                  Get {formatINR(product.exchange_rebate)} rebate. As per BMHR govt rule, returning
                  old batteries is recommended.
                </div>
              </div>
            </label>
          )}

          {/* CTAs */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button size="lg" onClick={handleAdd} disabled={product.stock <= 0}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/quote">
                <FileText className="h-4 w-4 mr-2" /> Request Quote
              </Link>
            </Button>
          </div>
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener"
            className="mt-3 flex items-center justify-center gap-2 h-11 bg-whatsapp text-white text-sm font-bold uppercase tracking-wider"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
          </a>

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            <Trust Icon={Zap} label="Zero Maintenance" />
            <Trust Icon={ShieldCheck} label={`${product.warranty_months ?? 0} mo Warranty`} />
            <Trust Icon={BadgeCheck} label="Genuine & Secured" />
          </div>
        </div>

        {/* Price breakup card */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-muted/40 border border-line p-5 sticky top-28">
            <div className="space-y-2.5 text-sm">
              <Row label="Base Price" sub="(Inclusive of GST)" value={formatINR(baseTotal)} />
              {discountAmt > 0 && (
                <Row label="Special Discount" value={`– ${formatINR(discountAmt)}`} accent />
              )}
              <div className="border-t border-line pt-2.5">
                <Row label="Total Price" sub="(Inclusive of GST)" value={formatINR(product.price * qty)} bold />
              </div>
              <Row label="Shipping Charge" value={<span className="text-success">FREE</span>} />
              {withExchange && (
                <Row
                  label="Old Battery Rebate"
                  value={`– ${formatINR(product.exchange_rebate * qty)}`}
                  accent
                />
              )}
              <div className="border-t-2 border-ink pt-2.5">
                <Row label="Total Amount to be Paid" value={formatINR(lineTotal)} bold accent />
              </div>
              {!withExchange && showExchange && (
                <div className="text-[11px] text-muted-foreground bg-white border border-dashed border-line p-2 mt-2">
                  + upto {formatINR(product.exchange_rebate)} rebate on return of similar old battery
                </div>
              )}
            </div>
            {totalSaving > 0 && (
              <div className="mt-4 bg-success/10 border border-success/30 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-success">
                  Total Saving
                </span>
                <span className="font-display font-bold text-success">{formatINR(totalSaving)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
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
              {product.capacity_ah && <SpecRow label="Capacity" value={`${product.capacity_ah} Ah`} />}
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
            <strong className="text-ink">{product.warranty_months ?? 0} months</strong> manufacturer
            warranty covering manufacturing defects.
          </p>
          <p>Honored at all authorized service centers across India.</p>
          <p>
            Old battery must be returned per Battery Management & Handling Rules (BMHR) of the
            Indian Government.
          </p>
        </TabsContent>

        <TabsContent value="delivery" className="py-6 text-sm text-ink-soft space-y-2">
          <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free shipping pan-India.</p>
          <p className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Free doorstep installation in serviceable cities.</p>
          <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Genuine product with full manufacturer warranty.</p>
        </TabsContent>
      </Tabs>

      {related.length > 0 && (
        <section className="mt-12 sm:mt-14">
          <h2 className="font-display-tight text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Related Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Sticky mobile bottom action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.1)] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
            {withExchange ? "With exchange" : "Total"}
          </div>
          <div className="font-display text-lg font-bold text-ink truncate">
            {formatINR(lineTotal)}
          </div>
        </div>
        <Button
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="h-11 px-4 flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
        </Button>
      </div>
    </div>
  );
};

function Trust({ Icon, label }: { Icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="bg-white border border-line p-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="font-semibold text-[11px] leading-tight">{label}</span>
    </div>
  );
}

const Row = forwardRef<
  HTMLDivElement,
  {
    label: string;
    sub?: string;
    value: React.ReactNode;
    bold?: boolean;
    accent?: boolean;
  }
>(function Row({ label, sub, value, bold, accent }, ref) {
  return (
    <div ref={ref} className="flex items-start justify-between gap-2">
      <div className="text-muted-foreground">
        <div className={bold ? "text-ink font-semibold" : ""}>{label}</div>
        {sub && <div className="text-[10px]">{sub}</div>}
      </div>
      <div
        className={`text-right ${bold ? "font-display font-bold text-base" : "font-semibold"} ${
          accent ? "text-primary" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
});

const SpecRow = forwardRef<
  HTMLTableRowElement,
  { label: string; value?: string | null }
>(function SpecRow({ label, value }, ref) {
  if (!value) return null;
  return (
    <tr ref={ref} className="border-b border-line">
      <td className="py-2.5 px-3 font-semibold capitalize w-1/3 bg-muted/30">{label}</td>
      <td className="py-2.5 px-3 text-ink-soft">{value}</td>
    </tr>
  );
});

export default ProductDetail;
