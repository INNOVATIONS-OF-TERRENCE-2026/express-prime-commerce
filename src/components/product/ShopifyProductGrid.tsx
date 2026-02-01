import { ShopifyProductCard } from './ShopifyProductCard';
import { ProductCardSkeleton } from './ProductCard';
import { cn } from '@/lib/utils';
import { ShopifyProduct } from '@/lib/shopify';

interface ShopifyProductGridProps {
  products: ShopifyProduct[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  skeletonCount?: number;
}

export function ShopifyProductGrid({ 
  products, 
  isLoading = false, 
  columns = 4,
  className,
  skeletonCount = 4
}: ShopifyProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div 
            key={i} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div 
            key={i} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {products.map((product, i) => (
        <div 
          key={product.node.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <ShopifyProductCard 
            product={product}
            isAiPick={product.node.tags?.includes('ai-pick')}
            isTrending={product.node.tags?.includes('trending')}
            isBestSeller={product.node.tags?.includes('bestseller')}
            isNew={product.node.tags?.includes('new')}
          />
        </div>
      ))}
    </div>
  );
}
