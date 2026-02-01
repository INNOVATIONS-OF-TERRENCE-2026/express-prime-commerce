/**
 * Hero Decision Remover - Amazon-Killer Hero Section
 * 
 * Purpose: Remove guesswork, surface AI-winning products
 * Psychology: Curated, calm, confident, predictive
 * 
 * @component HeroDecisionRemover
 * @version 1.0.0
 */

import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface HeroProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  aiScore: number;
  trendStatus?: 'rising' | 'hot' | 'stable';
}

interface HeroDecisionRemoverProps {
  products: HeroProduct[];
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// FLOATING PRODUCT CARD
// ============================================================================

const FloatingProductCard: React.FC<{
  product: HeroProduct;
  index: number;
  isActive: boolean;
}> = memo(({ product, index, isActive }) => {
  const positions = [
    { x: '10%', y: '20%', rotate: -5 },
    { x: '60%', y: '15%', rotate: 3 },
    { x: '75%', y: '55%', rotate: -2 },
  ];

  const pos = positions[index] || positions[0];

  return (
    <motion.div
      className={cn(
        'absolute w-48 md:w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden',
        'border border-gray-100 dark:border-gray-800',
        'transition-all duration-500'
      )}
      style={{ left: pos.x, top: pos.y }}
      initial={{ opacity: 0, scale: 0.8, rotate: pos.rotate }}
      animate={{ 
        opacity: isActive ? 1 : 0.3, 
        scale: isActive ? 1 : 0.9,
        rotate: pos.rotate,
        y: isActive ? 0 : 10,
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, rotate: 0 }}
    >
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {/* AI Score Badge */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              {product.aiScore}%
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {product.title}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.trendStatus === 'hot' && (
              <span className="text-xs text-orange-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Hot
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

FloatingProductCard.displayName = 'FloatingProductCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HeroDecisionRemover = memo<HeroDecisionRemoverProps>(({
  products,
  isLoading = false,
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const heroProducts = products.slice(0, 3);

  // Rotate active product
  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroProducts.length]);

  return (
    <section className={cn(
      'relative min-h-[600px] md:min-h-[700px] overflow-hidden',
      'bg-gradient-to-br from-slate-50 via-white to-violet-50',
      'dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/30',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08),transparent_50%)]" />
      </div>

      {/* Floating Product Cards (Desktop) */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full max-w-7xl mx-auto pointer-events-auto">
          {!isLoading && heroProducts.map((product, index) => (
            <FloatingProductCard
              key={product.id}
              product={product}
              index={index}
              isActive={index === activeIndex}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-2xl">
          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge 
              variant="secondary" 
              className="mb-6 px-4 py-2 text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-violet-200 dark:border-violet-800"
            >
              <Zap className="w-4 h-4 mr-2 text-violet-600" />
              Powered by Express Prime AI
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
          >
            The Smartest Way to Shop —{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            Express Prime removes guesswork by surfacing the products that are{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              actually winning right now
            </span>
            .
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link to="/collections?filter=ai-picks">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Shop AI Picks
              </Button>
            </Link>
            <Link to="/collections?filter=trending">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                See Why These Are Trending
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Micro-Copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI analyzing {products.length}+ products in real-time
          </motion.p>
        </div>
      </div>

      {/* Mobile Product Preview */}
      <div className="lg:hidden px-4 pb-8">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-40 h-52 rounded-xl flex-shrink-0" />
            ))
          ) : (
            heroProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="w-40 flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800"
              >
                <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-violet-600 text-white text-xs">
                    {product.aiScore}%
                  </Badge>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-1">{product.title}</p>
                  <p className="text-sm font-bold mt-1">${product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
});

HeroDecisionRemover.displayName = 'HeroDecisionRemover';

export default HeroDecisionRemover;
