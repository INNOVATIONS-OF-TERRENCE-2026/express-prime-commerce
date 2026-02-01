/**
 * AI-Enhanced Cart Page with Checkout Psychology Layer
 * 
 * Integrates:
 * - Pre-Checkout Confidence Engine
 * - Hesitation Detector
 * - Loss Aversion Visuals (subtle)
 * - Trust Collapse Mechanism
 * - Checkout Handoff
 * 
 * NO popups. NO pressure. Pure psychology.
 */

import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight,
  Truck,
  Shield,
  Tag
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useProducts } from '@/hooks/useProducts';

// Checkout Psychology Components
import { 
  PreCheckoutConfidence,
  HesitationDetector,
  usePriceHoverTracking,
  useCheckoutHoverTracking,
  LossAversionVisual,
  TrustCollapse,
  InlineTrustBadges,
  CheckoutHandoff
} from '@/components/checkout';

export default function AICartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    itemCount,
    clearCart 
  } = useCart();
  const { products: upsellProducts } = useProducts({ tag: 'bestseller', limit: 4 });

  // Price hover tracking for hesitation detection
  const { onPriceEnter, onPriceLeave } = usePriceHoverTracking();
  const { onCheckoutHover } = useCheckoutHoverTracking();

  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const estimatedShipping = hasFreeShipping ? 0 : 5.99;
  const estimatedTotal = subtotal + estimatedShipping;

  // Calculate average item rating (simulated)
  const avgItemRating = 4.2;

  // Shopify checkout URL (would come from actual cart context)
  const checkoutUrl = '/checkout'; // Replace with actual Shopify checkout URL

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground/30 mb-6" />
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any items to your cart yet. 
              Start shopping to discover our AI-curated collection!
            </p>
            <Button asChild size="lg" className="btn-glow">
              <Link to="/collections">
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Recommended Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Popular Products</h2>
            <ProductGrid products={upsellProducts} columns={4} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hesitation Detector (invisible, monitors behavior) */}
      <HesitationDetector isCartPage={true} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Free Shipping Progress */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Truck className={hasFreeShipping ? "text-green-600" : "text-primary"} />
                {hasFreeShipping ? (
                  <span className="font-medium text-green-600">
                    🎉 You've unlocked FREE shipping!
                  </span>
                ) : (
                  <span>
                    Add <span className="font-bold text-primary">${amountToFreeShipping.toFixed(2)}</span> more for free shipping
                  </span>
                )}
              </div>
              <Progress value={shippingProgress} className="h-2" />
            </div>

            {/* Items List */}
            <div className="border rounded-lg divide-y">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {/* Product Image */}
                  <Link 
                    to={`/product/${item.handle}`}
                    className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0"
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.handle}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    
                    {/* Price with hover tracking */}
                    <div 
                      className="flex items-center gap-2 mt-1"
                      onMouseEnter={onPriceEnter}
                      onMouseLeave={onPriceLeave}
                    >
                      <span className="font-semibold text-primary">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${item.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Loss Aversion - Subtle availability hint (first 2 items only) */}
                    {index < 2 && (
                      <LossAversionVisual
                        inventoryLevel={15}
                        dailyViews={75}
                        variant="minimal"
                        className="mt-1"
                      />
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border rounded-md">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary with Psychology Layer */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pre-Checkout Confidence Engine */}
            <PreCheckoutConfidence
              cartValue={subtotal}
              itemCount={itemCount}
              avgItemRating={avgItemRating}
            />

            {/* Order Summary Card */}
            <div className="border rounded-lg p-6 sticky top-32">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              {/* Promo Code */}
              <div className="flex gap-2 mb-6">
                <Input placeholder="Promo code" />
                <Button variant="outline">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={hasFreeShipping ? "text-green-600" : ""}>
                    {hasFreeShipping ? "FREE" : `$${estimatedShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Estimated Total</span>
                  <span>${estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Handoff */}
              <div onMouseEnter={onCheckoutHover}>
                <CheckoutHandoff
                  checkoutUrl={checkoutUrl}
                  onCheckout={() => {
                    // Track checkout initiation
                    console.log('Checkout initiated');
                  }}
                />
              </div>

              {/* Trust Collapse - Inline, not modal */}
              <div className="mt-6 pt-6 border-t">
                <TrustCollapse variant="compact" />
              </div>
            </div>
          </div>
        </div>

        {/* Upsell Section */}
        <section className="mt-16 pt-16 border-t">
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <ProductGrid products={upsellProducts} columns={4} />
        </section>
      </div>
    </Layout>
  );
}
