import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreLayout } from "@/components/layout/StoreLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Quote from "./pages/Quote";
import Contact from "./pages/Contact";
import Brands from "./pages/Brands";
import { About, JumpStart, Catalog, Blog } from "./pages/SimplePages";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import BulkUpload from "./pages/admin/BulkUpload";
import {
  Categories as AdminCategories,
  Brands as AdminBrands,
  Fitment as AdminFitment,
  Media as AdminMedia,
  Offers as AdminOffers,
  Catalogs as AdminCatalogs,
  Settings as AdminSettings,
  Overview as AdminOverview,
  Users as AdminUsers,
  Orders as AdminOrders,
  Quotes as AdminQuotes,
  Callbacks as AdminCallbacks,
  Messages as AdminMessages,
  Content as AdminContent,
  Blog as AdminBlog,
  ActivityLog as AdminActivity,
  SystemMonitor as AdminSystem,
} from "./pages/admin/StubPages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/brand/:slug" element={<BrandPage />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/jump-start" element={<JumpStart />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="bulk-upload" element={<BulkUpload />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="fitment" element={<AdminFitment />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="catalogs" element={<AdminCatalogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="quotes" element={<AdminQuotes />} />
            <Route path="callbacks" element={<AdminCallbacks />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
