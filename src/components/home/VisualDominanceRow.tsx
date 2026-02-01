/**
 * Visual Dominance Row - Emotional Capture Section
 * 
 * Display products with highest VISUAL SALIENCY scores.
 * Purpose: Capture attention emotionally, not logically.
 * 
 * @component VisualDominanceRow
 * @version 1.0.0
 */

import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface VisualProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  visualScore: number;
}

interface VisualDominanceRowProps {
  products: VisualProduct[];
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// VISUAL CARD
// ============================================================================

const VisualCard: React.FC<{
  product: VisualProduct;
  size: 'large' | 'medium';
  index: number;
}> = memo(({ product, size, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        'group transition-all duration-500',
        size === 'large' ? 'aspect-[4/5]' : 'aspect-square'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block w-full h-full">
        {/* Image */}
        <div className="absolute inset-0">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
          )}
          <motion.img
            src={product.imageUrl}
            alt={product.title}
            className={cn(
              'w-full h-full object-cover transition-all duration-700',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            animate={{ scale: isHovered ? 1.08 : 1 }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0 transition-opacity duration-300',
          'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
          isHovered ? 'opacity-100' : 'opacity-80'
        )} />

        {/* Visual Score Badge */}
        <div className="absolute top-4 right-4">
          <Badge 
            className="bg-white/90 text-gray-900 backdrop-blur-sm border-0 shadow-lg"
          >
            <Eye className="w-3 h-3 mr-1" />
            {product.visualScore}
          </Badge>
        </div>

        {/* Content (minimal) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-5"
          initial={false}
          animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0.9 }}
        >
          <p className={cn(
            'font-semibold text-white line-clamp-2 mb-2',
            size === 'large' ? 'text-xl' : 'text-base'
          )}>
            {product.title}
          </p>
          <p className={cn(
            'font-bold text-white',
            size === 'large' ? 'text-2xl' : 'text-lg'
          )}>
            ${product.price.toFixed(2)}
          </p>
        </motion.div>

        {/* Hover Indicator */}
        <motion.div
          className="absolute inset-0 border-2 border-white/0 rounded-2xl"
          animate={{ borderColor: isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0)' }}
        />
      </Link>
    </motion.div>
  );
});

VisualCard.displayName = 'VisualCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const VisualSkeleton: React.FC<{ size: 'large' | 'medium' }> = ({ size }) => (
  <Skeleton className={cn(
    'rounded-2xl',
    size === 'large' ? 'aspect-[4/5]' : 'aspect-square'
  )} />
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VisualDominanceRow = memo<VisualDominanceRowProps>(({
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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Visual Standouts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Products that capture attention
            </p>
          </div>
        </div>

        {/* Grid - Asymmetric layout for visual interest */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            <>
              <div className="col-span-2 row-span-2">
                <VisualSkeleton size="large" />
              </div>
              <VisualSkeleton size="medium" />
              <VisualSkeleton size="medium" />
            </>
          ) : (
            <>
              {displayProducts[0] && (
                <div className="col-span-2 row-span-2">
                  <VisualCard product={displayProducts[0]} size="large" index={0} />
                </div>
              )}
              {displayProducts.slice(1, 4).map((product, index) => (
                <VisualCard 
                  key={product.id} 
                  product={product} 
                  size="medium" 
                  index={index + 1} 
                />
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
});

VisualDominanceRow.displayName = 'VisualDominanceRow';

export default VisualDominanceRow;
