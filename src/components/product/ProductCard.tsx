import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, TrendingUp, Star, Zap, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export interface ProductCardProps {
  id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  tags?: string[];
  productType?: string;
  vendor?: string;
  isNew?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isAiPick?: boolean;
}

export function ProductCard({
  id,
  handle,
  title,
  price,
  compareAtPrice,
  image,
  tags = [],
  productType,
  isNew,
  isTrending,
  isBestSeller,
  isAiPick,
}: ProductCardProps) {
  const { addItem } = useCart();

  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      title,
      price,
      compareAtPrice: compareAtPrice || undefined,
      quantity: 1,
      image,
      handle,
    });
  };

  const hasAiPick = isAiPick || tags?.includes('ai-pick');

  return (
    <div className="group relative card-premium rounded-2xl bg-card border border-border/50 overflow-hidden">
      <Link to={`/product/${handle}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
          {image ? (
            <img
              src={image}
              alt={title}
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

          {/* Quick Actions - Desktop */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <Button
              size="icon"
              className="bg-white/95 text-primary hover:bg-white hover:scale-110 shadow-xl transition-all duration-200 backdrop-blur-sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-white/95 hover:bg-white hover:scale-110 shadow-xl transition-all duration-200 backdrop-blur-sm border-0"
              asChild
            >
              <Link to={`/product/${handle}`}>
                <Eye className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          {productType && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {productType}
            </p>
          )}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {title}
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
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

// Premium skeleton for loading states
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <div className="aspect-square skeleton-gold" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton-gold rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-full skeleton-gold rounded-full" />
          <div className="h-4 w-2/3 skeleton-gold rounded-full" />
        </div>
        <div className="h-5 w-20 skeleton-gold rounded-full" />
      </div>
    </div>
  );
}
