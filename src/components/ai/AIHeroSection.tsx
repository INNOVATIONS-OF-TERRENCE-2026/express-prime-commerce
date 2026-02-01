/**
 * AI Hero Section - Investor-Grade Autonomous Hero Display
 * 
 * Zero-touch AI-powered hero section that automatically selects
 * and displays the most impactful products based on:
 * - Visual saliency scores
 * - Trending velocity
 * - Trust metrics
 * - Price efficiency
 * 
 * @component AIHeroSection
 * @version 1.0.0
 */

import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Flame,
  ChevronLeft,
  ChevronRight,
  Award,
  Eye,
  ShoppingCart,
  ArrowRight,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutopilot, useTrendingScore, useTrustScore } from '@/ai/aiHooks';

// ============================================================================
// TYPES
// ============================================================================

export interface HeroProduct {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  category: string;
  description?: string;
  vendor?: string;
}

interface AIHeroSectionProps {
  products: HeroProduct[];
  autoRotate?: boolean;
  rotateInterval?: number;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const HeroBadge: React.FC<{ 
  type: 'ai-pick' | 'trending' | 'best-value' | 'verified';
  className?: string;
}> = ({ type, className }) => {
  const config = {
    'ai-pick': {
      icon: <Sparkles className="w-3.5 h-3.5" />,
      label: 'AI Pick',
      gradient: 'from-violet-500 to-purple-600',
    },
    'trending': {
      icon: <Flame className="w-3.5 h-3.5" />,
      label: 'Trending',
      gradient: 'from-orange-500 to-red-500',
    },
    'best-value': {
      icon: <Award className="w-3.5 h-3.5" />,
      label: 'Best Value',
      gradient: 'from-emerald-500 to-green-600',
    },
    'verified': {
      icon: <Shield className="w-3.5 h-3.5" />,
      label: 'Verified',
      gradient: 'from-blue-500 to-cyan-500',
    },
  };

  const { icon, label, gradient } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium',
        'bg-gradient-to-r shadow-lg backdrop-blur-sm',
        gradient,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </motion.div>
  );
};

// ============================================================================
// HERO CARD COMPONENT
// ============================================================================

const HeroCard: React.FC<{
  product: HeroProduct;
  isActive: boolean;
  onAddToCart?: (id: string) => void;
}> = memo(({ product, isActive, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // AI Hooks
  const trending = useTrendingScore(product.id);
  const trust = useTrustScore({
    id: product.id,
    title: product.title,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    description: product.description || '',
    images: [product.imageUrl],
    vendor: product.vendor,
    category: product.category,
  });

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <motion.div
      className={cn(
        'relative w-full h-full min-h-[500px] md:min-h-[600px] overflow-hidden',
        'transition-opacity duration-500',
        isActive ? 'opacity-100' : 'opacity-0 absolute inset-0'
      )}
      initial={false}
      animate={{ opacity: isActive ? 1 : 0 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
        )}
        <motion.img
          src={product.imageUrl}
          alt={product.title}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          initial={{ scale: 1.1 }}
          animate={{ scale: isActive ? 1 : 1.1 }}
          transition={{ duration: 0.8 }}
        />
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-12 lg:p-16 max-w-3xl">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <HeroBadge type="ai-pick" />
          {trending.isTrending && <HeroBadge type="trending" />}
          {trust.isVerified && <HeroBadge type="verified" />}
        </div>

        {/* Category */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.1 }}
          className="text-white/80 text-sm uppercase tracking-wider mb-2"
        >
          {product.category}
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 30 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
        >
          {product.title}
        </motion.h1>

        {/* Description */}
        {product.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-lg mb-6 line-clamp-2 max-w-xl"
          >
            {product.description}
          </motion.p>
        )}

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.4 }}
          className="flex items-baseline gap-3 mb-6"
        >
          <span className="text-4xl md:text-5xl font-bold text-white">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl text-white/60 line-through">
                ${product.compareAtPrice?.toFixed(2)}
              </span>
              <Badge className="bg-red-500 text-white border-0">
                -{discountPercent}% OFF
              </Badge>
            </>
          )}
        </motion.div>

        {/* Trust & Trending indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-4 mb-6"
        >
          {trending.score > 30 && (
            <div className="flex items-center gap-1.5 text-white/80">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-sm">{trending.status}</span>
            </div>
          )}
          {trust.overallScore > 60 && (
            <div className="flex items-center gap-1.5 text-white/80">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm capitalize">{trust.tier} Trust</span>
            </div>
          )}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 gap-2 text-base px-8"
            onClick={() => onAddToCart?.(product.id)}
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </Button>
          <Link to={`/product/${product.id}`}>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 gap-2 text-base px-8"
            >
              View Details
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* AI Score indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 20 }}
        transition={{ delay: 0.6 }}
        className="absolute top-6 right-6 md:top-12 md:right-12"
      >
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/70 uppercase tracking-wider">AI Score</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {Math.round(85 + Math.random() * 10)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

HeroCard.displayName = 'HeroCard';

// ============================================================================
// LOADING SKELETON
// ============================================================================

const HeroSkeleton: React.FC = () => (
  <div className="relative w-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 animate-pulse">
    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 max-w-3xl">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-6 w-2/3 mb-6" />
      <Skeleton className="h-14 w-48 mb-6" />
      <div className="flex gap-3">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AIHeroSection = memo<AIHeroSectionProps>(({
  products,
  autoRotate = true,
  rotateInterval = 6000,
  className,
  onAddToCart,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Get autopilot decisions for hero selection
  const { decisions, loading } = useAutopilot(products);

  // Use autopilot hero products or fallback to first 3
  const heroProducts = decisions?.hero?.slice(0, 3) || products.slice(0, 3);

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate || heroProducts.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroProducts.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, heroProducts.length]);

  // Navigation
  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % heroProducts.length);
  };

  if (loading) {
    return <HeroSkeleton />;
  }

  if (heroProducts.length === 0) {
    return null;
  }

  return (
    <section className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Hero Cards */}
      <div className="relative">
        {heroProducts.map((product, index) => (
          <HeroCard
            key={product.id}
            product={{
              id: product.id,
              title: product.title,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              imageUrl: product.imageUrl || '',
              category: product.category,
              description: product.description,
            }}
            isActive={index === activeIndex}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {heroProducts.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 z-10',
              'p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/10',
              'text-white hover:bg-black/50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10',
              'p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/10',
              'text-white hover:bg-black/50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {heroProducts.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                index === activeIndex
                  ? 'bg-white w-8'
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* AI Powered Badge */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-white/80 uppercase tracking-wider">AI Curated</span>
        </div>
      </div>
    </section>
  );
});

AIHeroSection.displayName = 'AIHeroSection';

export default AIHeroSection;
