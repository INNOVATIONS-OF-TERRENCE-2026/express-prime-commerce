/**
 * AI Picks Section - Hero section showcasing AI-curated products
 * 
 * Features:
 * - Animated product cards
 * - AI badge overlays
 * - Loading shimmer states
 * - Graceful fallback
 * 
 * @module AIPicksSection
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AIBadge, AIBadgeFloating, AIScoreBar } from './AIBadge';
import { useAIPicks } from '@/hooks/useAIRanking';
import type { ProductInput } from '@/ai';
import type { RankedProduct } from '@/ai/productRanker';

// ============================================================================
// TYPES
// ============================================================================

interface AIPicksSectionProps {
  products: ProductInput[];
  count?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIPicksSection({
  products,
  count = 4,
  title = 'AI Picks',
  subtitle = 'Curated by our intelligent recommendation engine',
  className,
}: AIPicksSectionProps) {
  const { picks, isLoading, error } = useAIPicks(products, count);

  // Don't render if no products
  if (products.length === 0) return null;

  return (
    <section className={cn('py-8 md:py-12', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Link to="/collections">
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* AI Status Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Brain className="w-4 h-4 animate-pulse" />
          <span>AI analyzing products...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          AI recommendations unavailable. Showing quality picks instead.
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {isLoading
          ? Array.from({ length: count }).map((_, i) => (
              <AIPickCardSkeleton key={i} />
            ))
          : picks.map((product, index) => (
              <AIPickCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
      </div>
    </section>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AIPickCardProps {
  product: RankedProduct;
  index: number;
}

function AIPickCard({ product, index }: AIPickCardProps) {
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
      )
    : 0;

  // Stagger animation based on index
  const animationDelay = `${index * 100}ms`;

  return (
    <Link to={`/product/${product.id}`}>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-1',
          'animate-in fade-in slide-in-from-bottom-4',
          'cursor-pointer'
        )}
        style={{ animationDelay, animationFillMode: 'backwards' }}
      >
        {/* AI Badge */}
        <AIBadgeFloating tier={product.aiTier} />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
            -{discountPercent}%
          </div>
        )}

        {/* Image */}
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={`https://picsum.photos/seed/${product.id}/400/400`}
            alt={product.title}
            className={cn(
              'w-full h-full object-cover',
              'transition-transform duration-500',
              'group-hover:scale-110'
            )}
            loading="lazy"
          />
        </div>

        <CardContent className="p-3 md:p-4">
          {/* Title */}
          <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-bold text-lg">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {/* AI Score */}
          <AIScoreBar score={product.aiScore} showLabel={false} />

          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1">
            {product.aiTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AIPickCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square" />
      <CardContent className="p-3 md:p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-1.5 w-full" />
      </CardContent>
    </Card>
  );
}

export default AIPicksSection;
