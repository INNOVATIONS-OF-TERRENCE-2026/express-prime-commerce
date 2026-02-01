/**
 * Trending Products Section - AI-Powered Velocity Detection
 * 
 * Displays products ranked by trending velocity with:
 * - Real-time trend indicators
 * - Animated rank movements
 * - Exploding/Rising/Stable/Cooling states
 * 
 * @component TrendingSection
 * @version 1.0.0
 */

import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  ShoppingCart,
  Clock,
  Zap,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopTrending, useTrendingScore } from '@/ai/aiHooks';
import type { TrendingSignal } from '@/ai/trendingDetector';

// ============================================================================
// TYPES
// ============================================================================

interface TrendingSectionProps {
  products: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    category: string;
  }>;
  limit?: number;
  showRankChange?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

interface TrendingProductWithData {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  category: string;
  signal: TrendingSignal | null;
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const TrendStatusBadge: React.FC<{ status: string; score: number }> = ({ status, score }) => {
  const config: Record<string, { icon: React.ReactNode; color: string; bg: string; animate?: boolean }> = {
    'Exploding': { 
      icon: <Flame className="w-3 h-3" />, 
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      animate: true,
    },
    'Rising': { 
      icon: <TrendingUp className="w-3 h-3" />, 
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    'Stable': { 
      icon: <Minus className="w-3 h-3" />, 
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    'Cooling': { 
      icon: <TrendingDown className="w-3 h-3" />, 
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-500/10',
    },
  };

  const { icon, color, bg, animate } = config[status] || config['Stable'];

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'gap-1 font-medium',
        bg,
        color,
        animate && 'animate-pulse'
      )}
    >
      {icon}
      <span>{status}</span>
      <span className="opacity-70">({score})</span>
    </Badge>
  );
};

// ============================================================================
// RANK INDICATOR COMPONENT
// ============================================================================

const RankIndicator: React.FC<{ rank: number; previousRank?: number }> = ({ rank, previousRank }) => {
  const change = previousRank ? previousRank - rank : 0;
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="flex items-center gap-1">
      <span className={cn(
        'text-2xl font-bold',
        rank === 1 && 'text-amber-500',
        rank === 2 && 'text-slate-400',
        rank === 3 && 'text-orange-600',
        rank > 3 && 'text-muted-foreground'
      )}>
        #{rank}
      </span>
      {change !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: isUp ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center text-xs font-medium',
            isUp && 'text-emerald-600',
            isDown && 'text-red-600'
          )}
        >
          {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{Math.abs(change)}</span>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// VELOCITY METER COMPONENT
// ============================================================================

const VelocityMeter: React.FC<{ velocity: number }> = ({ velocity }) => {
  const normalizedVelocity = Math.min(velocity * 20, 100); // Scale for display

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Velocity</span>
        <span className="font-medium">{velocity.toFixed(1)}x</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            normalizedVelocity > 70 && 'bg-red-500',
            normalizedVelocity > 40 && normalizedVelocity <= 70 && 'bg-orange-500',
            normalizedVelocity <= 40 && 'bg-blue-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${normalizedVelocity}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// TRENDING CARD COMPONENT
// ============================================================================

const TrendingProductCard: React.FC<{
  product: TrendingProductWithData;
  rank: number;
  previousRank?: number;
  showRankChange?: boolean;
  onAddToCart?: (id: string) => void;
}> = memo(({ product, rank, previousRank, showRankChange = true, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const signal = product.signal;
  const trendScore = signal?.trendingScore || 0;
  const velocity = signal?.velocity || 0;
  const status = signal?.status || 'Stable';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group relative bg-card rounded-xl border border-border/50',
        'transition-all duration-300 hover:border-border hover:shadow-lg',
        rank === 1 && 'ring-2 ring-amber-500/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`}>
        <div className="flex gap-4 p-4">
          {/* Rank */}
          {showRankChange && (
            <div className="flex-shrink-0 w-12 flex flex-col items-center justify-center">
              <RankIndicator rank={rank} previousRank={previousRank} />
            </div>
          )}

          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
            )}
            <motion.img
              src={product.imageUrl || '/placeholder.svg'}
              alt={product.title}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Rank 1 crown */}
            {rank === 1 && (
              <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full shadow-lg">
                <Flame className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.category}
              </p>
              <TrendStatusBadge status={status} score={trendScore} />
            </div>

            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
              <VelocityMeter velocity={velocity} />
            </div>
          </div>

          {/* Quick Add Button (on hover) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Button
                  size="sm"
                  className="shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart?.(product.id);
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
});

TrendingProductCard.displayName = 'TrendingProductCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const TrendingSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border border-border/50 rounded-xl">
        <Skeleton className="w-12 h-12" />
        <Skeleton className="w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// STATS BAR COMPONENT
// ============================================================================

const TrendingStatsBar: React.FC<{ products: TrendingProductWithData[] }> = ({ products }) => {
  const exploding = products.filter(p => p.signal?.status === 'Exploding').length;
  const rising = products.filter(p => p.signal?.status === 'Rising').length;
  const avgVelocity = products.reduce((sum, p) => sum + (p.signal?.velocity || 0), 0) / products.length;

  return (
    <div className="flex items-center gap-6 py-3 px-4 rounded-xl bg-muted/50">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-red-500" />
        <span className="text-sm">
          <span className="font-semibold">{exploding}</span>
          <span className="text-muted-foreground ml-1">Exploding</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <span className="text-sm">
          <span className="font-semibold">{rising}</span>
          <span className="text-muted-foreground ml-1">Rising</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm">
          <span className="font-semibold">{avgVelocity.toFixed(1)}x</span>
          <span className="text-muted-foreground ml-1">Avg Velocity</span>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TrendingSection = memo<TrendingSectionProps>(({
  products,
  limit = 5,
  showRankChange = true,
  autoRefresh = true,
  refreshInterval = 30000,
  className,
  onAddToCart,
}) => {
  const [trendingProducts, setTrendingProducts] = useState<TrendingProductWithData[]>([]);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get trending signals
  const topTrending = useTopTrending(limit);

  // Map products with trending data
  useEffect(() => {
    if (products.length === 0) {
      setIsLoading(false);
      return;
    }

    // Create a map of product data
    const productMap = new Map(products.map(p => [p.id, p]));

    // Merge trending signals with product data
    const merged: TrendingProductWithData[] = topTrending
      .filter(signal => productMap.has(signal.productId))
      .map(signal => ({
        ...productMap.get(signal.productId)!,
        signal,
      }));

    // If we don't have enough trending products, add some from the product list
    if (merged.length < limit) {
      const existingIds = new Set(merged.map(p => p.id));
      const remaining = products
        .filter(p => !existingIds.has(p.id))
        .slice(0, limit - merged.length)
        .map(p => ({ ...p, signal: null }));
      merged.push(...remaining);
    }

    // Store previous ranks
    const newPreviousRanks: Record<string, number> = {};
    trendingProducts.forEach((p, i) => {
      newPreviousRanks[p.id] = i + 1;
    });
    setPreviousRanks(newPreviousRanks);

    setTrendingProducts(merged.slice(0, limit));
    setIsLoading(false);
  }, [products, topTrending, limit]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger re-render to get updated trending data
      setTrendingProducts(prev => [...prev]);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (isLoading) {
    return (
      <section className={cn('py-8', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <p className="text-sm text-muted-foreground">Products gaining momentum</p>
          </div>
        </div>
        <TrendingSkeleton count={limit} />
      </section>
    );
  }

  if (trendingProducts.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-5 h-5" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">🔥 Trending Now</h2>
            <p className="text-sm text-muted-foreground">Products with explosive momentum</p>
          </div>
        </div>

        <Link to="/collections?sort=trending">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <TrendingStatsBar products={trendingProducts} />

      {/* Product List */}
      <div className="mt-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {trendingProducts.map((product, index) => (
            <TrendingProductCard
              key={product.id}
              product={product}
              rank={index + 1}
              previousRank={previousRanks[product.id]}
              showRankChange={showRankChange}
              onAddToCart={onAddToCart}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border/50">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Velocity calculated from view-to-purchase momentum • Updates every 30s
        </span>
      </div>
    </section>
  );
});

TrendingSection.displayName = 'TrendingSection';

export default TrendingSection;
