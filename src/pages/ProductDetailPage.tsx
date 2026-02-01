import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  Star,
  ChevronRight,
  Bot
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ProductGrid } from '@/components/product/ProductGrid';
import { TrustBadgesCompact } from '@/components/trust/TrustBadges';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { handle } = useParams<{ handle: string }>();
  const { product, isLoading } = useProduct(handle || '');
  const { products: relatedProducts } = useProducts({ limit: 4 });
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square skeleton-gold rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 skeleton-gold rounded" />
              <div className="h-6 w-1/4 skeleton-gold rounded" />
              <div className="h-24 skeleton-gold rounded" />
              <div className="h-12 w-full skeleton-gold rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/collections">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = product.images && Array.isArray(product.images) 
    ? product.images as string[]
    : product.image_url 
      ? [product.image_url] 
      : [];

  const discount = product.compare_at_price && product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price || 0,
      compareAtPrice: product.compare_at_price || undefined,
      quantity,
      image: product.image_url || undefined,
      handle: product.handle || product.id,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/collections" className="hover:text-primary">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors",
                      selectedImage === i ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.tags?.includes('trending') && (
                <Badge className="bg-[#D4AF37] text-black">🔥 Trending</Badge>
              )}
              {product.tags?.includes('bestseller') && (
                <Badge className="bg-primary">⭐ Best Seller</Badge>
              )}
              {product.tags?.includes('new') && (
                <Badge className="bg-green-500">✨ New</Badge>
              )}
              {product.tags?.includes('ai-pick') && (
                <Badge variant="outline" className="gap-1">
                  <Bot className="w-3 h-3" />
                  AI Pick
                </Badge>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                {product.vendor || 'Express Prime'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.title}</h1>
              
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  ${product.price?.toFixed(2)}
                </span>
                {product.compare_at_price && product.compare_at_price > (product.price || 0) && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500">-{discount}%</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-y">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-green-600" />
                <span>Free shipping over $49</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>30-day guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Easy returns</span>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-semibold btn-glow"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Product Details Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping Information</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Free standard shipping on orders over $49</li>
                    <li>• Standard shipping: 5-7 business days</li>
                    <li>• Express shipping: 2-3 business days (+$9.99)</li>
                    <li>• Ships from our US fulfillment center</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger>Returns & Refunds</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 30-day hassle-free returns</li>
                    <li>• Full refund for unused items in original packaging</li>
                    <li>• Free return shipping on defective items</li>
                    <li>• Contact support@expressprime.com for assistance</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq">
                <AccordionTrigger>FAQ</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium">Is this product covered by warranty?</p>
                      <p className="text-muted-foreground">Yes, all Express Prime products include a 1-year manufacturer warranty.</p>
                    </div>
                    <div>
                      <p className="font-medium">Can I track my order?</p>
                      <p className="text-muted-foreground">Absolutely! You'll receive tracking information via email once your order ships.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* AI Recommended Products */}
        <section className="mt-16 pt-16 border-t">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">AI-Recommended Pairings</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Customers who viewed this also loved these products
          </p>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      </div>
    </Layout>
  );
}
