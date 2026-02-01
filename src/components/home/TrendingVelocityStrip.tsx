/**
 * Trending Velocity Strip - Momentum Bias Exploitation
 * 
 * Horizontal carousel showing rank changes.
 * Psychology: Social proof through momentum indicators.
 * 
 * @component TrendingVelocityStrip
 * @version 1.0.0
 */

import React, { memo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronLeft, 
  ChevronRight,
  Flame,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface TrendingProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  rank: number;
  previousRank: number;
  velocity: number; // multiplier (e.g., 1.5x)
}

interface TrendingVelocityStripProps {
  products: TrendingProduct[];
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// RANK CHANGE INDICATOR
// ============================================================================

const RankChange: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const change = previous - current;
  
  if (change > 0) {
    return (
      <motion.span 
        className="inline-flex items-center text-emerald-500 text-xs font-semibold"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TrendingUp className="w-3 h-3 mr-0.5" />
        {change}
      </motion.span>
    );
  }
  
  if (change < 0) {
    return (
      <motion.span 
        className="inline-flex items-center text-red-500 text-xs font-semibold"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {Math.abs(change)}
      </motion.span>
    );
  }
  
  return (
    <span className="inline-flex items-center text-gray-400 text-xs">
      <Minus className="w-3 h-3" />
    </span>
  );
};

// ============================================================================
// TRENDING CARD
// ============================================================================

const TrendingCard: React.FC<{
  product: TrendingProduct;
  index: number;
}> = memo(({ product, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isHot = product.velocity >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex-shrink-0 w-[180px] md:w-[200px]"
    >
      <Link 
        to={`/product/${product.id}`}
        className={cn(
          'block bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
          'border border-gray-100 dark:border-gray-800',
          'transition-all duration-300 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800',
          isHot && 'ring-2 ring-orange-500/30'
        )}
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
          )}
          <img
            src={product.imageUrl}
            alt={product.title}
            className={cn(
              'w-full h-full object-cover transition-opacity',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Rank Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm">
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              #{product.rank}
            </span>
            <RankChange current={product.rank} previous={product.previousRank} />
          </div>

          {/* Hot Badge */}
          {isHot && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 animate-pulse">
              <Flame className="w-3 h-3 mr-1" />
              Hot
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {product.title}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            <span className={cn(
              'text-xs font-semibold flex items-center gap-0.5',
              product.velocity >= 2 ? 'text-orange-500' : 'text-gray-400'
            )}>
              <Zap className="w-3 h-3" />
              {product.velocity.toFixed(1)}x
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

TrendingCard.displayName = 'TrendingCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const TrendingCardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-[180px] md:w-[200px]">
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <Skeleton className="aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TrendingVelocityStrip = memo<TrendingVelocityStripProps>(({
  products,
  isLoading = false,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons);
      return () => el.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const displayProducts = products.slice(0, 12);

  return (
    <section className={cn('py-10 md:py-14', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Trending Faster Than Average
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Products with accelerating momentum
              </p>
            </div>
          </div>

          {/* Navigation Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <TrendingCardSkeleton key={i} />)
              : displayProducts.map((product, index) => (
                  <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
                    <TrendingCard product={product} index={index} />
                  </div>
                ))
            }
          </div>

          {/* Gradient Edges */}
          <div className="hidden md:block absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white dark:from-gray-950 to-transparent pointer-events-none" />
          <div className="hidden md:block absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-gray-950 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
});

TrendingVelocityStrip.displayName = 'TrendingVelocityStrip';

export default TrendingVelocityStrip;
