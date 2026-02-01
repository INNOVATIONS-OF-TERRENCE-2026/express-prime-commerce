/**
 * Smart Collections Renderer - Self-Organizing AI Product Groups
 * 
 * Renders dynamically generated product collections based on:
 * - Semantic similarity clustering
 * - Buyer intent signals
 * - Trend + trust scores
 * 
 * Collections auto-update based on real-time AI analysis.
 * 
 * @component SmartCollectionsRenderer
 * @version 1.0.0
 */

import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Award,
  Eye,
  Heart,
  Shield,
  Star,
  Zap,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  Layers,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSmartCollections } from '@/ai/aiHooks';
import type { SmartCollection, CollectionProduct } from '@/ai/smartCollections';

// ============================================================================
// TYPES
// ============================================================================

interface SmartCollectionsRendererProps {
  products: Array<{
    id: string;
    title: string;
    price: number;
    category: string;
    imageUrl?: string;
    compareAtPrice?: number;
  }>;
  maxCollections?: number;
  productsPerCollection?: number;
  layout?: 'tabs' | 'sections' | 'grid';
  showRefresh?: boolean;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

// ============================================================================
// COLLECTION ICONS
// ============================================================================

const CollectionIcon: React.FC<{ collectionId: string; className?: string }> = ({ 
  collectionId, 
  className 
}) => {
  const icons: Record<string, React.ReactNode> = {
    'ai-picks': <Sparkles className={className} />,
    'high-value-tech': <Zap className={className} />,
    'trending-home': <TrendingUp className={className} />,
    'premium-essentials': <Award className={className} />,
    'impulse-deals': <Flame className={className} />,
    'visual-standouts': <Eye className={className} />,
    'rising-stars': <Star className={className} />,
    'health-wellness': <Heart className={className} />,
  };

  return <>{icons[collectionId] || <Layers className={className} />}</>;
};

const CollectionGradient: Record<string, string> = {
  'ai-picks': 'from-violet-500 to-purple-600',
  'high-value-tech': 'from-blue-500 to-cyan-600',
  'trending-home': 'from-orange-500 to-red-500',
  'premium-essentials': 'from-amber-500 to-yellow-600',
  'impulse-deals': 'from-pink-500 to-rose-600',
  'visual-standouts': 'from-emerald-500 to-green-600',
  'rising-stars': 'from-indigo-500 to-blue-600',
  'health-wellness': 'from-red-500 to-pink-600',
};

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

const CollectionProductCard: React.FC<{
  product: CollectionProduct;
  onAddToCart?: (id: string) => void;
}> = memo(({ product, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = product.score && product.score > 0.7;

  return (
    <motion.div
      className={cn(
        'group relative bg-card rounded-xl overflow-hidden border border-border/50',
        'transition-all duration-300 hover:border-border hover:shadow-lg'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
    >
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
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
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Score badge */}
          {product.score && product.score > 0.6 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {Math.round(product.score * 100)}% Match
              </Badge>
            </div>
          )}

          {/* Quick add button */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-2 left-2 right-2"
              >
                <Button
                  size="sm"
                  className="w-full bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart?.(product.id);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Quick Add
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Great Value
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

CollectionProductCard.displayName = 'CollectionProductCard';

// ============================================================================
// COLLECTION SECTION COMPONENT
// ============================================================================

const CollectionSection: React.FC<{
  collection: SmartCollection;
  productsPerCollection: number;
  onAddToCart?: (id: string) => void;
}> = ({ collection, productsPerCollection, onAddToCart }) => {
  const gradient = CollectionGradient[collection.id] || 'from-gray-500 to-gray-600';

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-xl bg-gradient-to-br text-white',
            gradient
          )}>
            <CollectionIcon collectionId={collection.id} className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{collection.name}</h2>
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          </div>
        </div>

        <Link to={`/collections?filter=${collection.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {collection.products.slice(0, productsPerCollection).map((product) => (
          <CollectionProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5" />
          {collection.productCount} products
        </span>
        <span className="flex items-center gap-1">
          <Brain className="w-3.5 h-3.5" />
          {Math.round(collection.avgScore * 100)}% avg match
        </span>
      </div>
    </section>
  );
};

// ============================================================================
// TABS LAYOUT COMPONENT
// ============================================================================

const TabsLayout: React.FC<{
  collections: SmartCollection[];
  productsPerCollection: number;
  onAddToCart?: (id: string) => void;
}> = ({ collections, productsPerCollection, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState(collections[0]?.id || '');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Tab List */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <TabsList className="inline-flex gap-2 bg-transparent h-auto p-0">
          {collections.map((collection) => {
            const gradient = CollectionGradient[collection.id] || 'from-gray-500 to-gray-600';
            const isActive = activeTab === collection.id;

            return (
              <TabsTrigger
                key={collection.id}
                value={collection.id}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-full',
                  'text-sm font-medium transition-all duration-200',
                  'data-[state=active]:shadow-lg',
                  isActive
                    ? cn('bg-gradient-to-r text-white', gradient)
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <CollectionIcon collectionId={collection.id} className="w-4 h-4" />
                <span>{collection.name}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs px-1.5 py-0',
                    isActive ? 'bg-white/20 text-white' : 'bg-background'
                  )}
                >
                  {collection.productCount}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Tab Content */}
      {collections.map((collection) => (
        <TabsContent key={collection.id} value={collection.id} className="mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Description */}
              <p className="text-muted-foreground mb-6">{collection.description}</p>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collection.products.slice(0, productsPerCollection).map((product) => (
                  <CollectionProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {/* View All Link */}
              <div className="flex justify-center mt-8">
                <Link to={`/collections?filter=${collection.id}`}>
                  <Button variant="outline" size="lg" className="gap-2">
                    View All {collection.name}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      ))}
    </Tabs>
  );
};

// ============================================================================
// GRID LAYOUT COMPONENT
// ============================================================================

const GridLayout: React.FC<{
  collections: SmartCollection[];
  productsPerCollection: number;
  onAddToCart?: (id: string) => void;
}> = ({ collections, productsPerCollection, onAddToCart }) => (
  <div className="grid md:grid-cols-2 gap-8">
    {collections.map((collection) => {
      const gradient = CollectionGradient[collection.id] || 'from-gray-500 to-gray-600';

      return (
        <Card key={collection.id} className="overflow-hidden">
          {/* Header */}
          <div className={cn('p-4 bg-gradient-to-r text-white', gradient)}>
            <div className="flex items-center gap-3">
              <CollectionIcon collectionId={collection.id} className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">{collection.name}</h3>
                <p className="text-white/80 text-sm">{collection.productCount} products</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {collection.products.slice(0, Math.min(4, productsPerCollection)).map((product) => (
                <CollectionProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>

            <Link to={`/collections?filter=${collection.id}`} className="block mt-4">
              <Button variant="ghost" className="w-full gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

// ============================================================================
// LOADING SKELETON
// ============================================================================

const CollectionsSkeleton: React.FC<{ layout: 'tabs' | 'sections' | 'grid' }> = ({ layout }) => {
  if (layout === 'tabs') {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SmartCollectionsRenderer = memo<SmartCollectionsRendererProps>(({
  products,
  maxCollections = 4,
  productsPerCollection = 5,
  layout = 'sections',
  showRefresh = true,
  className,
  onAddToCart,
}) => {
  const { collections, loading, refresh } = useSmartCollections(products);

  // Filter and limit collections
  const displayCollections = collections
    .filter((c) => c.products.length >= 2)
    .slice(0, maxCollections);

  if (loading) {
    return (
      <section className={cn('py-8', className)}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Collections</h2>
              <p className="text-sm text-muted-foreground">AI-powered product groupings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing products...</span>
          </div>
        </div>
        <CollectionsSkeleton layout={layout} />
      </section>
    );
  }

  if (displayCollections.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-8', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Smart Collections</h2>
            <p className="text-sm text-muted-foreground">AI-powered product groupings that update automatically</p>
          </div>
        </div>

        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Render based on layout */}
      {layout === 'tabs' && (
        <TabsLayout
          collections={displayCollections}
          productsPerCollection={productsPerCollection}
          onAddToCart={onAddToCart}
        />
      )}

      {layout === 'sections' && (
        <div className="space-y-12">
          {displayCollections.map((collection) => (
            <CollectionSection
              key={collection.id}
              collection={collection}
              productsPerCollection={productsPerCollection}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {layout === 'grid' && (
        <GridLayout
          collections={displayCollections}
          productsPerCollection={productsPerCollection}
          onAddToCart={onAddToCart}
        />
      )}

      {/* AI Attribution */}
      <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-sm text-muted-foreground">
          Collections curated by Express Prime AI
        </span>
      </div>
    </section>
  );
});

SmartCollectionsRenderer.displayName = 'SmartCollectionsRenderer';

export default SmartCollectionsRenderer;
