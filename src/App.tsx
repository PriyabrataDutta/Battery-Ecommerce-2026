import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreLayout } from "@/components/layout/StoreLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import { PostLogoutRedirect } from "./components/auth/PostLogoutRedirect";
import { RequirePhoneVerified } from "./components/auth/RequirePhoneVerified";

// Lazy-loaded routes — keeps the initial Shop/Home bundle small.
const SearchResults = lazy(() => import("./pages/SearchResults"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const Brands = lazy(() => import("./pages/Brands"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Quote = lazy(() => import("./pages/Quote"));
const Contact = lazy(() => import("./pages/Contact"));
const SimplePages = lazy(() =>
  import("./pages/SimplePages").then((m) => ({ default: m.About })),
);
const About = lazy(() => import("./pages/SimplePages").then((m) => ({ default: m.About })));
const JumpStart = lazy(() => import("./pages/SimplePages").then((m) => ({ default: m.JumpStart })));
const Catalog = lazy(() => import("./pages/SimplePages").then((m) => ({ default: m.Catalog })));
const Blog = lazy(() => import("./pages/SimplePages").then((m) => ({ default: m.Blog })));
const Auth = lazy(() => import("./pages/Auth"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyPhone = lazy(() => import("./pages/VerifyPhone"));
const AddPhone = lazy(() => import("./pages/AddPhone"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/brand/:slug" element={<BrandPage />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route element={<RequirePhoneVerified />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<AccountLayout />} />
              </Route>
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/quote" element={<Quote />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/jump-start" element={<JumpStart />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-phone" element={<VerifyPhone />} />
              <Route path="/add-phone" element={<AddPhone />} />
            </Route>
            <Route element={<PostLogoutRedirect />}>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
