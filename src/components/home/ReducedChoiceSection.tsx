/**
 * Reduced Choice Section - "One Good Option"
 * 
 * Shows exactly ONE product per category:
 * - Best Value
 * - Premium Pick
 * - Fast Moving
 * 
 * Psychology: Reduce decision paralysis through curation.
 * No alternatives. No comparison table.
 * 
 * @component ReducedChoiceSection
 * @version 1.0.0
 */

import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Award, 
  Crown, 
  Zap, 
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface ChoiceProduct {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  category: string;
  reason: string;
}

interface ReducedChoiceSectionProps {
  bestValue?: ChoiceProduct;
  premiumPick?: ChoiceProduct;
  fastMoving?: ChoiceProduct;
  isLoading?: boolean;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

type ChoiceType = 'best-value' | 'premium' | 'fast-moving';

// ============================================================================
// CHOICE CONFIG
// ============================================================================

const CHOICE_CONFIG: Record<ChoiceType, {
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
  borderColor: string;
}> = {
  'best-value': {
    icon: <Award className="w-5 h-5" />,
    label: 'Best Value',
    description: 'Maximum value for your money',
    gradient: 'from-emerald-500 to-green-600',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  'premium': {
    icon: <Crown className="w-5 h-5" />,
    label: 'Premium Pick',
    description: 'Top-tier quality, no compromises',
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  'fast-moving': {
    icon: <Zap className="w-5 h-5" />,
    label: 'Fast Moving',
    description: 'Selling faster than average',
    gradient: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
};

// ============================================================================
// CHOICE CARD
// ============================================================================

const ChoiceCard: React.FC<{
  product: ChoiceProduct;
  type: ChoiceType;
  index: number;
  onAddToCart?: (id: string) => void;
}> = memo(({ product, type, index, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const config = CHOICE_CONFIG[type];

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const savings = hasDiscount ? (product.compareAtPrice! - product.price).toFixed(2) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={cn(
        'relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
        'border-2 transition-all duration-300',
        config.borderColor,
        'hover:shadow-xl hover:scale-[1.02]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Type Badge */}
      <div className={cn(
        'absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-semibold',
        'bg-gradient-to-r shadow-lg',
        config.gradient
      )}>
        {config.icon}
        <span>{config.label}</span>
      </div>

      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-800 overflow-hidden">
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
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {product.category}
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
            {product.title}
          </h3>

          {/* AI Reason */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{product.reason}</span>
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ${product.compareAtPrice?.toFixed(2)}
                </span>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  Save ${savings}
                </Badge>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Button
          className={cn(
            'w-full gap-2 bg-gradient-to-r text-white',
            config.gradient
          )}
          onClick={(e) => {
            e.preventDefault();
            onAddToCart?.(product.id);
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
});

ChoiceCard.displayName = 'ChoiceCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const ChoiceCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-800">
    <Skeleton className="aspect-[4/3]" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReducedChoiceSection = memo<ReducedChoiceSectionProps>(({
  bestValue,
  premiumPick,
  fastMoving,
  isLoading = false,
  className,
  onAddToCart,
}) => {
  const choices: { product?: ChoiceProduct; type: ChoiceType }[] = [
    { product: bestValue, type: 'best-value' },
    { product: premiumPick, type: 'premium' },
    { product: fastMoving, type: 'fast-moving' },
  ];

  const hasAnyChoice = bestValue || premiumPick || fastMoving;

  if (!isLoading && !hasAnyChoice) {
    return null;
  }

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 mb-4"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Curated by AI • One Clear Choice Per Category
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3"
          >
            Skip the Comparison. We Did It For You.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Three products. Three clear purposes. Zero decision fatigue.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ChoiceCardSkeleton key={i} />)
            : choices.map(({ product, type }, index) => 
                product && (
                  <ChoiceCard
                    key={product.id}
                    product={product}
                    type={type}
                    index={index}
                    onAddToCart={onAddToCart}
                  />
                )
              )
          }
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <Link to="/collections">
            <Button variant="outline" size="lg" className="gap-2">
              Explore All Categories
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

ReducedChoiceSection.displayName = 'ReducedChoiceSection';

export default ReducedChoiceSection;
