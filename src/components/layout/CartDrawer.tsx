import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    itemCount 
  } = useCart();

  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col",
        isOpen ? "animate-slide-in-right" : "animate-slide-out-right"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Your Cart</h2>
            <span className="text-sm text-muted-foreground">({itemCount} items)</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Free Shipping Progress */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Truck className={cn(
              "w-5 h-5",
              hasFreeShipping ? "text-green-600" : "text-primary"
            )} />
            {hasFreeShipping ? (
              <span className="text-sm font-medium text-green-600">
                🎉 You've unlocked FREE shipping!
              </span>
            ) : (
              <span className="text-sm">
                Add <span className="font-bold text-primary">${amountToFreeShipping.toFixed(2)}</span> more for free shipping
              </span>
            )}
          </div>
          <Progress value={shippingProgress} className="h-2" />
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Discover our AI-curated collection of premium products
            </p>
            <Button onClick={closeCart} asChild className="btn-glow">
              <Link to="/collections">
                Start Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-3 bg-muted/50 rounded-lg"
                    style={{ 
                      animation: `slide-in-right 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/product/${item.handle}`}
                        onClick={closeCart}
                        className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${item.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
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
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upsell Module */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-lg border border-[#D4AF37]/20">
                <h4 className="font-semibold text-sm mb-2">🤖 AI Recommendation</h4>
                <p className="text-xs text-muted-foreground">
                  Based on your cart, customers also love our best-selling accessories.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-primary"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/collections?tag=bestseller">
                    View Recommendations →
                  </Link>
                </Button>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 space-y-4 bg-white">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-lg">${subtotal.toFixed(2)}</span>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Shipping & taxes calculated at checkout
              </p>

              {/* Checkout Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold btn-glow"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/cart">View Full Cart</Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                <span>🔒 Secure Checkout</span>
                <span>📦 Free Returns</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
