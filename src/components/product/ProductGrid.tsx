import { ProductCard, ProductCardSkeleton, ProductCardProps } from './ProductCard';
import { cn } from '@/lib/utils';
import { PackageSearch } from 'lucide-react';

interface ProductGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  showEmptyState?: boolean;
}

export function ProductGrid({ 
  products, 
  isLoading = false, 
  columns = 4,
  className,
  showEmptyState = false
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:gap-6 stagger-children', gridCols[columns], className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Never show "No products found" publicly - always show skeleton or loading
  if (products.length === 0) {
    if (!showEmptyState) {
      // Show loading skeletons instead of empty state
      return (
        <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      );
    }
    
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <PackageSearch className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Curating products...</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our AI is selecting the best products for you. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:gap-6 stagger-children', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          {...product} 
          isAiPick={product.tags?.includes('ai-pick')}
        />
      ))}
    </div>
  );
}
