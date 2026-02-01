/**
 * Curated Carousel - Sticky AI-curated product carousel
 * 
 * Features:
 * - Smooth scrolling carousel
 * - AI tier badges
 * - Auto-scroll option
 * - Touch/swipe support
 * 
 * @module CuratedCarousel
 * @version 1.0.0
 */

import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AIBadge } from './AIBadge';
import { useCuratedCarousel } from '@/hooks/useAIRanking';
import type { ProductInput } from '@/ai';
import type { RankedProduct } from '@/ai/productRanker';

// ============================================================================
// TYPES
// ============================================================================

interface CuratedCarouselProps {
  products: ProductInput[];
  count?: number;
  title?: string;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CuratedCarousel({
  products,
  count = 8,
  title = 'Curated by AI',
  autoScroll = false,
  autoScrollInterval = 5000,
  className,
}: CuratedCarouselProps) {
  const { products: carouselProducts, isLoading } = useCuratedCarousel(
    products,
    count
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || isLoading || carouselProducts.length === 0) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        // Reset to start
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scroll('right');
      }
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, isLoading, carouselProducts.length]);

  // Update buttons on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();

    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [carouselProducts]);

  if (products.length === 0) return null;

  return (
    <section className={cn('py-6 md:py-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <Cpu className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              analyzing...
            </span>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-4 overflow-x-auto scroll-smooth',
          'px-4 md:px-0 pb-2',
          'scrollbar-hide', // Tailwind plugin or custom CSS
          '[&::-webkit-scrollbar]:hidden',
          '[-ms-overflow-style:none]',
          '[scrollbar-width:none]'
        )}
      >
        {isLoading
          ? Array.from({ length: count }).map((_, i) => (
              <CarouselCardSkeleton key={i} />
            ))
          : carouselProducts.map((product, index) => (
              <CarouselCard key={product.id} product={product} index={index} />
            ))}
      </div>
    </section>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CarouselCardProps {
  product: RankedProduct;
  index: number;
}

function CarouselCard({ product, index }: CarouselCardProps) {
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Link to={`/product/${product.id}`} className="flex-shrink-0">
      <Card
        className={cn(
          'w-40 md:w-48 overflow-hidden',
          'transition-all duration-300',
          'hover:shadow-md hover:-translate-y-1',
          'animate-in fade-in slide-in-from-right-4',
          'cursor-pointer'
        )}
        style={{
          animationDelay: `${index * 50}ms`,
          animationFillMode: 'backwards',
        }}
      >
        {/* Image with Badge */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.aiTier !== 'Standard' && (
            <div className="absolute top-2 left-2 z-10">
              <AIBadge tier={product.aiTier} size="sm" />
            </div>
          )}
          <img
            src={`https://picsum.photos/seed/${product.id}/200/200`}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-2.5">
          <h3 className="font-medium text-sm line-clamp-1 mb-1">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Mini Score Indicator */}
          <div className="mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{ width: `${product.aiScore * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CarouselCardSkeleton() {
  return (
    <Card className="w-40 md:w-48 flex-shrink-0 overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="p-2.5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-1 w-full" />
      </div>
    </Card>
  );
}

// ============================================================================
// STICKY VARIANT
// ============================================================================

/**
 * Sticky version of the carousel that stays visible while scrolling
 */
export function StickyCuratedCarousel(props: CuratedCarouselProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-100px 0px 0px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sectionRef} />
      <div
        className={cn(
          'transition-all duration-300',
          isSticky && 'fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm'
        )}
      >
        <div className="container max-w-7xl mx-auto">
          <CuratedCarousel {...props} />
        </div>
      </div>
      {/* Spacer when sticky */}
      {isSticky && <div className="h-48" />}
    </>
  );
}

export default CuratedCarousel;
