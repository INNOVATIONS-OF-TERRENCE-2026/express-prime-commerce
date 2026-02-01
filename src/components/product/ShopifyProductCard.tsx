import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, TrendingUp, Star, Zap, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { ShopifyProduct } from '@/lib/shopify';
import { cn } from '@/lib/utils';

interface ShopifyProductCardProps {
  product: ShopifyProduct;
  isNew?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isAiPick?: boolean;
}

export function ShopifyProductCard({
  product,
  isNew,
  isTrending,
  isBestSeller,
  isAiPick,
}: ShopifyProductCardProps) {
  const { addItem, isLoading } = useCartStore();
  const node = product.node;
  
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const firstVariant = node.variants.edges[0]?.node;
  const compareAtPrice = firstVariant?.compareAtPrice?.amount 
    ? parseFloat(firstVariant.compareAtPrice.amount) 
    : undefined;
  const image = node.images.edges[0]?.node?.url;

  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!firstVariant) return;

    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || [],
    });
  };

  const hasAiPick = isAiPick || node.tags?.includes('ai-pick');

  return (
    <div className="group relative card-premium rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Image Container - wrapped in Link */}
      <Link to={`/product/${node.handle}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
          {image ? (
            <img
              src={image}
              alt={node.title}
              className="w-full h-full object-cover img-zoom"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Premium overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white font-bold shadow-lg">
                -{discount}%
              </Badge>
            )}
            {hasAiPick && (
              <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg ai-badge-glow">
                <Bot className="w-3 h-3 mr-1" />
                AI Pick
              </Badge>
            )}
            {isTrending && !hasAiPick && (
              <Badge className="bg-accent text-accent-foreground font-semibold shadow-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {isBestSeller && !isTrending && !hasAiPick && (
              <Badge className="bg-primary text-primary-foreground shadow-lg">
                <Star className="w-3 h-3 mr-1" />
                Best Seller
              </Badge>
            )}
            {isNew && !isTrending && !isBestSeller && !hasAiPick && (
              <Badge className="bg-emerald-500 text-white shadow-lg">
                <Zap className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Actions - Desktop (outside Link to avoid nesting) */}
      <div className="absolute top-0 left-0 right-0 aspect-square flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none">
        <Button
          size="icon"
          className="bg-white/95 text-primary hover:bg-white hover:scale-110 shadow-xl transition-all duration-200 backdrop-blur-sm pointer-events-auto"
          onClick={handleAddToCart}
          disabled={isLoading || !firstVariant}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-white/95 hover:bg-white hover:scale-110 shadow-xl transition-all duration-200 backdrop-blur-sm border-0 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/product/${node.handle}`;
          }}
        >
          <Eye className="w-5 h-5" />
        </Button>
      </div>

      {/* Product Info - wrapped in Link */}
      <Link to={`/product/${node.handle}`} className="block">
        <div className="p-4 space-y-2">
          {node.productType && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {node.productType}
            </p>
          )}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {node.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              ${price.toFixed(2)}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile Add to Cart */}
      <div className="p-4 pt-0 md:hidden">
        <Button
          className="w-full btn-glow bg-primary hover:bg-primary/90"
          size="sm"
          onClick={handleAddToCart}
          disabled={isLoading || !firstVariant}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
