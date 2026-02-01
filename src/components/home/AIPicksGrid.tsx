/**
 * AI Picks Grid - Core Differentiator Section
 * 
 * Replaces "Featured Products" with AI-decided ranking.
 * NO FILTERS. NO SORT OPTIONS. AI DECIDES.
 * 
 * Psychology: Remove decision paralysis, establish AI authority.
 * 
 * @component AIPicksGrid
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  Zap,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface AIPickProduct {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  category: string;
  aiScore: number;
  aiReason: string;
  trendVelocity?: number;
  trustScore?: number;
}

interface AIPicksGridProps {
  products: AIPickProduct[];
  isLoading?: boolean;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

// ============================================================================
// AI CONFIDENCE BADGE
// ============================================================================

const AIConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
  const getConfidenceLevel = (s: number) => {
    if (s >= 90) return { label: 'Exceptional', color: 'from-emerald-500 to-green-600' };
    if (s >= 80) return { label: 'Very High', color: 'from-violet-500 to-purple-600' };
    if (s >= 70) return { label: 'High', color: 'from-blue-500 to-cyan-600' };
    return { label: 'Good', color: 'from-amber-500 to-orange-600' };
  };

  const { label, color } = getConfidenceLevel(score);

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white',
      'bg-gradient-to-r shadow-sm',
      color
    )}>
      <Brain className="w-3 h-3" />
      <span>{score}% {label}</span>
    </div>
  );
};

// ============================================================================
// AI PICK CARD
// ============================================================================

const AIPickCard: React.FC<{
  product: AIPickProduct;
  rank: number;
  onAddToCart?: (id: string) => void;
}> = memo(({ product, rank, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.1 }}
      className={cn(
        'group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
        'border border-gray-100 dark:border-gray-800',
        'transition-all duration-300',
        'hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/5',
        'hover:border-violet-200 dark:hover:border-violet-800'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`}>
        {/* Rank Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            rank === 1 && 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
            rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
            rank === 3 && 'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
            rank > 3 && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}>
            #{rank}
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
          )}
          <motion.img
            src={product.imageUrl}
            alt={product.title}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            animate={{ scale: isHovered ? 1.05 : 1 }}
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">
              -{discountPercent}%
            </Badge>
          )}

          {/* Quick Add (on hover) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute bottom-3 left-3 right-3"
          >
            <Button
              size="sm"
              className="w-full bg-white/95 text-gray-900 hover:bg-white shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product.id);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* AI Confidence */}
          <AIConfidenceBadge score={product.aiScore} />

          {/* Category */}
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {product.category}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {product.title}
          </h3>

          {/* AI Reason (Why this product is ranked) */}
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 mt-0.5 text-violet-500 flex-shrink-0" />
            <span className="line-clamp-1">{product.aiReason}</span>
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compareAtPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Trust Signals */}
          {(product.trendVelocity || product.trustScore) && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {product.trendVelocity && product.trendVelocity > 1 && (
                <span className="flex items-center gap-1 text-orange-500">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
              {product.trustScore && product.trustScore > 80 && (
                <span className="flex items-center gap-1 text-green-500">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
});

AIPickCard.displayName = 'AIPickCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const AIPickCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
    <Skeleton className="aspect-square" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-6 w-20 mt-2" />
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AIPicksGrid = memo<AIPicksGridProps>(({
  products,
  isLoading = false,
  className,
  onAddToCart,
}) => {
  const displayProducts = products.slice(0, 6);

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Brain className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Chosen by Express Prime AI
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl">
              These products are ranked by buyer intent, trend velocity, and trust scores. 
              <span className="text-violet-600 dark:text-violet-400 font-medium"> No filters needed.</span>
            </p>
          </div>

          <Link to="/collections?filter=ai-picks" className="hidden sm:block">
            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-violet-600">
              View All AI Picks
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <AIPickCardSkeleton key={i} />)
            : displayProducts.map((product, index) => (
                <AIPickCard
                  key={product.id}
                  product={product}
                  rank={index + 1}
                  onAddToCart={onAddToCart}
                />
              ))
          }
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-6 text-center">
          <Link to="/collections?filter=ai-picks">
            <Button variant="outline" className="w-full gap-2">
              View All AI Picks
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* AI Attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400"
        >
          <Zap className="w-3 h-3" />
          <span>Rankings update in real-time based on user behavior</span>
        </motion.div>
      </div>
    </section>
  );
});

AIPicksGrid.displayName = 'AIPicksGrid';

export default AIPicksGrid;
