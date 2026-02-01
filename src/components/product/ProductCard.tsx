import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, TrendingUp, Star, Zap } from 'lucide-react';
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

  return (
    <div className="group relative card-tilt">
      <Link to={`/product/${handle}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover img-zoom"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white">
                -{discount}%
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-green-500 text-white">
                <Zap className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-[#D4AF37] text-black">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-primary text-white">
                <Star className="w-3 h-3 mr-1" />
                Best Seller
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="icon"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-white hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link to={`/product/${handle}`}>
                  <Eye className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {productType && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {productType}
            </p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
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
      <Button
        className="w-full mt-3 md:hidden btn-glow"
        size="sm"
        onClick={handleAddToCart}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>
    </div>
  );
}

// Skeleton for loading states
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-lg skeleton-gold" />
      <div className="space-y-2">
        <div className="h-3 w-16 skeleton-gold rounded" />
        <div className="h-4 w-full skeleton-gold rounded" />
        <div className="h-4 w-2/3 skeleton-gold rounded" />
        <div className="h-5 w-20 skeleton-gold rounded" />
      </div>
    </div>
  );
}
