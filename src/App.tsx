import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreLayout } from "@/components/layout/StoreLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { PostLogoutRedirect } from "./components/auth/PostLogoutRedirect";
import { PendingCartAction } from "./components/cart/PendingCartAction";
import { RequirePhoneVerified } from "./components/auth/RequirePhoneVerified";

// Lazy-loaded routes — keeps the initial Shop/Home bundle small. Store pages
// are pre-downloaded once the first page has loaded (see prefetchStorePages),
// so menu clicks don't wait for a download.
const storePages = {
  // Most-visited after Home: prefetched first.
  Shop: () => import("./pages/Shop"),
  ShopEntry: () => import("./pages/shop/ShopEntry"),
  ProductDetail: () => import("./pages/product-detail"),
  Cart: () => import("./pages/Cart"),
  SearchResults: () => import("./pages/SearchResults"),
  CategoryPage: () => import("./pages/CategoryPage"),
  BrandPage: () => import("./pages/BrandPage"),
  Brands: () => import("./pages/Brands"),
  Checkout: () => import("./pages/checkout"),
  OrderConfirmation: () => import("./pages/order-confirmation"),
  Quote: () => import("./pages/Quote"),
  Contact: () => import("./pages/Contact"),
  About: () => import("./pages/AboutPage"),
  SimplePages: () => import("./pages/SimplePages"),
  Catalog: () => import("./pages/CatalogPage"),
  BlogListing: () => import("./pages/BlogListing"),
  BlogPost: () => import("./pages/BlogPost"),
  Auth: () => import("./pages/Auth"),
  AccountLayout: () => import("./pages/account/AccountLayout"),
  ResetPassword: () => import("./pages/ResetPassword"),
  VerifyPhone: () => import("./pages/VerifyPhone"),
  AddPhone: () => import("./pages/AddPhone"),
};
const SearchResults = lazy(storePages.SearchResults);
const CategoryPage = lazy(storePages.CategoryPage);
const BrandPage = lazy(storePages.BrandPage);
const Brands = lazy(storePages.Brands);
const Checkout = lazy(storePages.Checkout);
const OrderConfirmation = lazy(storePages.OrderConfirmation);
const Quote = lazy(storePages.Quote);
const Contact = lazy(storePages.Contact);
const About = lazy(storePages.About);
const JumpStart = lazy(() => import("./pages/JumpStartPage"));
const PrivacyPolicy = lazy(() => storePages.SimplePages().then((m) => ({ default: m.PrivacyPolicy })));
const RefundPolicy = lazy(() => storePages.SimplePages().then((m) => ({ default: m.RefundPolicy })));
const Catalog = lazy(storePages.Catalog);
const BlogListing = lazy(storePages.BlogListing);
const BlogPost = lazy(storePages.BlogPost);
const Auth = lazy(storePages.Auth);
const AccountLayout = lazy(storePages.AccountLayout);
const ResetPassword = lazy(storePages.ResetPassword);
const VerifyPhone = lazy(storePages.VerifyPhone);
const AddPhone = lazy(storePages.AddPhone);
const Shop = lazy(storePages.Shop);
const ShopEntry = lazy(storePages.ShopEntry);
const ProductDetail = lazy(storePages.ProductDetail);
const Cart = lazy(storePages.Cart);
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));

/**
 * Download the other store pages in the background once the first page is
 * interactive, so menu clicks are instant. Skipped on Data Saver / 2G; on 3G only
 * the shop, product and cart pages are fetched.
 */
function prefetchStorePages() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;
  const loaders = Object.values(storePages);
  const list = conn?.effectiveType === "3g" ? loaders.slice(0, 4) : loaders;
  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    const go = () => list.forEach((load) => load().catch(() => {}));
    if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 3000 });
    else go();
  };
  // Start on the visitor's first interaction (or after 15 s), never during the first paint.
  for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.addEventListener(ev, run, { once: true, passive: true });
  setTimeout(run, 15000);
}
if (typeof window !== "undefined") window.addEventListener("load", prefetchStorePages, { once: true });

// Data stays fresh for a minute, so revisiting a page shows it instantly
// instead of refetching (and showing loaders) on every navigation.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

const PageLoader = () => (
  <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PendingCartAction />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<ShopEntry />} />
              <Route path="/shop/car-batteries" element={<Shop variant="car" />} />
              <Route path="/shop/inverter-batteries" element={<Shop variant="inverter" />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/brand/:slug" element={<BrandPage />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route element={<RequirePhoneVerified />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<AccountLayout />} />
                <Route path="/account/:tab" element={<AccountLayout />} />
              </Route>
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/quote" element={<Quote />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/jump-start" element={<JumpStart />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/blog" element={<BlogListing />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-phone" element={<VerifyPhone />} />
              <Route path="/add-phone" element={<AddPhone />} />
            </Route>
            <Route element={<PostLogoutRedirect />}>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />} />
              <Route path="/admin/:tab" element={<AdminLayout />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
