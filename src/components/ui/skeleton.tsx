import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse';
}

function Skeleton({ className, variant = 'shimmer', ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-md",
        variant === 'shimmer' && "skeleton-gold",
        variant === 'pulse' && "animate-pulse bg-muted",
        variant === 'default' && "bg-muted",
        className
      )} 
      {...props} 
    />
  );
}

// Premium product card skeleton with enhanced shimmer
function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl bg-card border border-border/50 overflow-hidden",
      className
    )}>
      {/* Image skeleton with gradient overlay */}
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 skeleton-gold" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        
        {/* Badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-20 rounded-full" />
        
        {/* Title - two lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full opacity-50" />
        </div>
      </div>
    </div>
  );
}

// Grid of product skeletons
function ProductGridSkeleton({ 
  count = 4, 
  columns = 4 
}: { 
  count?: number; 
  columns?: 2 | 3 | 4 
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
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

// Section skeleton for full product sections
function ProductSectionSkeleton({ bgColor = 'bg-background' }: { bgColor?: string }) {
  return (
    <section className={cn('py-16 md:py-20', bgColor)}>
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-64 rounded-full" />
          </div>
          <Skeleton className="hidden md:block h-10 w-24 rounded-lg" />
        </div>

        {/* Grid skeleton */}
        <ProductGridSkeleton count={4} />
      </div>
    </section>
  );
}

// Trust badge skeleton
function TrustBadgeSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
    </div>
  );
}

// Hero section skeleton
function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Skeleton className="h-10 w-72 rounded-full mx-auto mb-8" variant="pulse" />
          <Skeleton className="h-16 w-full max-w-2xl rounded-lg mx-auto mb-4" variant="pulse" />
          <Skeleton className="h-16 w-3/4 rounded-lg mx-auto mb-8" variant="pulse" />
          <Skeleton className="h-6 w-96 rounded-full mx-auto mb-10" variant="pulse" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-14 w-40 rounded-lg" variant="pulse" />
            <Skeleton className="h-14 w-44 rounded-lg" variant="pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

export { 
  Skeleton, 
  ProductCardSkeleton, 
  ProductGridSkeleton, 
  ProductSectionSkeleton,
  TrustBadgeSkeleton,
  HeroSkeleton
};
