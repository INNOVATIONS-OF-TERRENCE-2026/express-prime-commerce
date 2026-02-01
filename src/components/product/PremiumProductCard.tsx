/**
 * Premium AI-Powered Product Card
 * 
 * Investor-grade product card with integrated AI intelligence.
 * Features trust badges, trending indicators, intent-based nudges,
 * and visual saliency-driven hero treatment.
 * 
 * @component PremiumProductCard
 * @version 1.0.0
 */

import React, { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Shield, 
  Flame,
  Eye,
  ShoppingCart,
  Heart,
  Star,
  Check,
  Zap,
  Award,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrendingScore, useIntentPrediction, useTrustScore } from '@/ai/aiHooks';
import type { AutopilotBadge } from '@/ai';

// Alias for badge type
type ProductBadge = AutopilotBadge;
type BadgeType = ProductBadge['type'];

// ============================================================================
// TYPES
// ============================================================================

export interface PremiumProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  category: string;
  description?: string;
  vendor?: string;
  reviewCount?: number;
  avgRating?: number;
  inStock?: boolean;
  badges?: ProductBadge[];
  variant?: 'default' | 'hero' | 'featured' | 'compact';
  showAIFeatures?: boolean;
  onAddToCart?: (id: string) => void;
  onQuickView?: (id: string) => void;
  className?: string;
}

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

const AIBadgeIcon: React.FC<{ badge: ProductBadge }> = ({ badge }) => {
  const icons: Record<BadgeType, React.ReactNode> = {
    'ai-pick': <Sparkles className="w-3 h-3" />,
    'best-value': <Award className="w-3 h-3" />,
    'trending': <Flame className="w-3 h-3" />,
    'premium': <Eye className="w-3 h-3" />,
    'new': <BadgeCheck className="w-3 h-3" />,
    'deal': <TrendingUp className="w-3 h-3" />,
    'hot': <Flame className="w-3 h-3" />,
  };
  return <>{icons[badge.type] || <Star className="w-3 h-3" />}</>;
};

const AIBadgeColor: Record<BadgeType, string> = {
  'ai-pick': 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
  'best-value': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
  'trending': 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  'premium': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  'new': 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
  'deal': 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
  'hot': 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
};

// ============================================================================
// NUDGE COMPONENT
// ============================================================================

const IntentNudge: React.FC<{ nudge: string | null }> = ({ nudge }) => {
  if (!nudge) return null;

  const nudgeConfig: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    'social-proof': { 
      icon: <Eye className="w-3 h-3" />, 
      text: '12 others viewing',
      color: 'text-blue-600 dark:text-blue-400',
    },
    'scarcity-soft': { 
      icon: <Zap className="w-3 h-3" />, 
      text: 'Limited stock',
      color: 'text-amber-600 dark:text-amber-400',
    },
    'value-highlight': { 
      icon: <Award className="w-3 h-3" />, 
      text: 'Great value',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    'trust-signal': { 
      icon: <Shield className="w-3 h-3" />, 
      text: 'Verified seller',
      color: 'text-green-600 dark:text-green-400',
    },
    'momentum': { 
      icon: <Flame className="w-3 h-3" />, 
      text: 'Popular choice',
      color: 'text-orange-600 dark:text-orange-400',
    },
  };

  const config = nudgeConfig[nudge];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        config.color
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </motion.div>
  );
};

// ============================================================================
// TRUST INDICATOR
// ============================================================================

const TrustIndicator: React.FC<{ score: number; tier: string; tierColor: string }> = ({
  score,
  tier,
  tierColor,
}) => {
  if (tier === 'unverified' || tier === 'caution') return null;

  return (
    <div className="flex items-center gap-1">
      <Shield className="w-3 h-3" style={{ color: tierColor }} />
      <span 
        className="text-xs font-medium capitalize"
        style={{ color: tierColor }}
      >
        {tier}
      </span>
    </div>
  );
};

// ============================================================================
// TRENDING INDICATOR
// ============================================================================

const TrendingIndicator: React.FC<{ score: number; status: string }> = ({
  score,
  status,
}) => {
  if (score < 30) return null;

  const isExploding = status === 'Exploding';
  const isRising = status === 'Rising';

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isExploding ? 'text-red-500' : isRising ? 'text-orange-500' : 'text-amber-500'
      )}
    >
      {isExploding ? (
        <Flame className="w-3 h-3 animate-pulse" />
      ) : (
        <TrendingUp className="w-3 h-3" />
      )}
      <span>{status}</span>
    </motion.div>
  );
};

// ============================================================================
// PRICE DISPLAY
// ============================================================================

const PriceDisplay: React.FC<{ 
  price: number; 
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
}> = ({ price, compareAtPrice, size = 'md' }) => {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={cn('font-bold text-foreground', sizeClasses[size])}>
        ${price.toFixed(2)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            ${compareAtPrice.toFixed(2)}
          </span>
          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            -{discountPercent}%
          </Badge>
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PremiumProductCard = memo<PremiumProductCardProps>(({
  id,
  title,
  price,
  compareAtPrice,
  imageUrl,
  category,
  description,
  vendor,
  reviewCount,
  avgRating,
  inStock = true,
  badges = [],
  variant = 'default',
  showAIFeatures = true,
  onAddToCart,
  onQuickView,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // AI Hooks
  const trending = useTrendingScore(id, { autoTrack: showAIFeatures });
  const intent = useIntentPrediction(id, { enableTracking: showAIFeatures });
  const trust = useTrustScore(showAIFeatures ? {
    id,
    title,
    price,
    compareAtPrice,
    description: description || '',
    images: [imageUrl],
    vendor,
    reviewCount,
    avgRating,
    category,
  } : null);

  // Handlers
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(id);
  }, [id, onAddToCart]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(id);
  }, [id, onQuickView]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(prev => !prev);
  }, []);

  // Variant styles
  const isHero = variant === 'hero';
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  return (
    <motion.div
      className={cn(
        'group relative bg-card rounded-xl overflow-hidden border border-border/50',
        'transition-all duration-300 ease-out',
        'hover:border-border hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/5',
        isHero && 'md:col-span-2 md:row-span-2',
        isFeatured && 'ring-2 ring-primary/20',
        className
      )}
      onMouseEnter={() => {
        setIsHovered(true);
        intent.handlers.onMouseEnter();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        intent.handlers.onMouseLeave();
      }}
      onClick={intent.handlers.onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/product/${id}`} className="block">
        {/* Image Container */}
        <div className={cn(
          'relative overflow-hidden bg-muted',
          isHero ? 'aspect-[4/3]' : isCompact ? 'aspect-square' : 'aspect-[4/3]'
        )}>
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {/* Product Image */}
          <motion.img
            src={imageUrl}
            alt={title}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
            {badges.map((badge) => (
              <motion.div
                key={badge.type}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm',
                  AIBadgeColor[badge.type]
                )}
              >
                <AIBadgeIcon badge={badge} />
                <span>{badge.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Wishlist button */}
          <motion.button
            className={cn(
              'absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm',
              'shadow-sm border border-border/50',
              'transition-colors duration-200',
              isWishlisted 
                ? 'text-red-500' 
                : 'text-muted-foreground hover:text-red-500'
            )}
            onClick={handleWishlist}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </motion.button>

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white text-black font-semibold">
                Out of Stock
              </Badge>
            </div>
          )}

          {/* Quick action buttons (on hover) */}
          <AnimatePresence>
            {isHovered && inStock && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-3 left-3 right-3 flex gap-2"
              >
                <Button
                  size="sm"
                  className="flex-1 bg-white text-black hover:bg-white/90 shadow-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Add to Cart
                </Button>
                {onQuickView && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={handleQuickView}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className={cn('p-4', isCompact && 'p-3')}>
          {/* Category & Trust */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {category}
            </span>
            {showAIFeatures && (
              <TrustIndicator 
                score={trust.overallScore} 
                tier={trust.tier} 
                tierColor={trust.tierColor} 
              />
            )}
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors',
            isHero ? 'text-xl' : isCompact ? 'text-sm' : 'text-base'
          )}>
            {title}
          </h3>

          {/* Rating */}
          {avgRating && reviewCount && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3.5 h-3.5',
                      i < Math.floor(avgRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <PriceDisplay 
            price={price} 
            compareAtPrice={compareAtPrice}
            size={isHero ? 'lg' : isCompact ? 'sm' : 'md'}
          />

          {/* AI Indicators */}
          {showAIFeatures && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <TrendingIndicator score={trending.score} status={trending.status} />
              <AnimatePresence>
                <IntentNudge nudge={intent.nudge} />
              </AnimatePresence>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
});

PremiumProductCard.displayName = 'PremiumProductCard';

export default PremiumProductCard;
