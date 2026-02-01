import { ProductCard, ProductCardSkeleton, ProductCardProps } from './ProductCard';
import { cn } from '@/lib/utils';
import { PackageSearch, Loader2 } from 'lucide-react';

interface ProductGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  showEmptyState?: boolean;
  skeletonCount?: number;
}

export function ProductGrid({ 
  products, 
  isLoading = false, 
  columns = 4,
  className,
  showEmptyState = false,
  skeletonCount = 4
}: ProductGridProps) {
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

  // Always show skeletons instead of empty state publicly
  if (products.length === 0) {
    if (showEmptyState) {
      return (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
            <PackageSearch className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Curating products...</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Our AI is selecting the best products for you. Check back soon!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading inventory</span>
          </div>
        </div>
      );
    }
    
    // Show premium skeletons instead of empty state
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
          key={product.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <ProductCard 
            {...product} 
            isAiPick={product.tags?.includes('ai-pick')}
          />
        </div>
      ))}
    </div>
  );
}
