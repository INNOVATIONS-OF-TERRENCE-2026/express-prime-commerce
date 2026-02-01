/**
 * Social Proof Section - Aggregated Behavior Only
 * 
 * "Customers like you chose…"
 * No fake reviews. No star overload.
 * Pure behavioral aggregation.
 * 
 * @component SocialProofSection
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface SocialProofProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  purchaseCount: number;
  category: string;
}

interface SocialProofSectionProps {
  products: SocialProofProduct[];
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// SOCIAL PROOF CARD
// ============================================================================

const SocialProofCard: React.FC<{
  product: SocialProofProduct;
  index: number;
}> = memo(({ product, index }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Format purchase count for display
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={`/product/${product.id}`}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-white dark:bg-gray-900',
          'border border-gray-100 dark:border-gray-800',
          'transition-all duration-300',
          'hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700'
        )}
      >
        {/* Image */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
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
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
            {product.category}
          </p>
          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
            {product.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatCount(product.purchaseCount)} chose this
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </Link>
    </motion.div>
  );
});

SocialProofCard.displayName = 'SocialProofCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const SocialProofSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
    <Skeleton className="w-16 h-16 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SocialProofSection = memo<SocialProofSectionProps>(({
  products,
  isLoading = false,
  className,
}) => {
  const displayProducts = products.slice(0, 4);

  if (!isLoading && displayProducts.length === 0) {
    return null;
  }

  return (
    <section className={cn(
      'py-12 md:py-16 bg-gray-50 dark:bg-gray-950/50',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Customers Like You Chose
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Based on aggregated purchase behavior
              </p>
            </div>
          </div>

          <Link to="/collections?sort=popular" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SocialProofSkeleton key={i} />)
            : displayProducts.map((product, index) => (
                <SocialProofCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))
          }
        </div>

        {/* Trust Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400"
        >
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Real purchase data • No paid reviews • Updated daily</span>
        </motion.div>
      </div>
    </section>
  );
});

SocialProofSection.displayName = 'SocialProofSection';

export default SocialProofSection;
