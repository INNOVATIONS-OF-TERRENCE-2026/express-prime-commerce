import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Contexts
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Hooks
import { useCartSync } from "@/hooks/useCartSync";

// Cart sync wrapper component
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}
// Layout wrapper for lazy loading
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load pages for better performance
const HomePage = lazy(() => import("@/pages/HomePage"));
const CollectionsPage = lazy(() => import("@/pages/CollectionsPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const OrderTrackingPage = lazy(() => import("@/pages/OrderTrackingPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));
const PolicyPage = lazy(() => import("@/pages/PolicyPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Auth pages
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

// Additional pages
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminAIDecisions = lazy(() => import("@/pages/admin/AdminAIDecisions"));
const AdminBulkImport = lazy(() => import("@/pages/admin/AdminBulkImport"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <CartSyncProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/sign-in" element={<SignInPage />} />
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/sign-up" element={<SignUpPage />} />
                  <Route path="/register" element={<SignUpPage />} />
                  <Route path="/create-account" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  
                  {/* Additional Info Pages */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  
                  {/* Public Storefront Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/collections/:collection" element={<CollectionsPage />} />
                  <Route path="/product/:handle" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/order-tracking" element={<OrderTrackingPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/policies/:type" element={<PolicyPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/ai-decisions" element={<AdminAIDecisions />} />
                  <Route path="/admin/bulk-import" element={<AdminBulkImport />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  
                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartSyncProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
