import { ProductCard, ProductCardSkeleton, ProductCardProps } from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({ 
  products, 
  isLoading = false, 
  columns = 4,
  className 
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
