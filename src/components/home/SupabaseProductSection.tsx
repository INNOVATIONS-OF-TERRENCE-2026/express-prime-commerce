import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCardProps } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';

// Supabase product section interface
interface SupabaseProductSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: ProductCardProps[];
  isLoading: boolean;
  viewAllLink: string;
  bgColor?: string;
  gradient?: boolean;
}

// Main Supabase product section component
export function SupabaseProductSection({ 
  title, 
  subtitle, 
  icon, 
  products, 
  isLoading, 
  viewAllLink,
  bgColor = 'bg-background',
  gradient = false,
}: SupabaseProductSectionProps) {
  return (
    <section className={cn(
      'py-16 md:py-20 relative',
      bgColor,
      gradient && 'bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]'
    )}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10">
                {icon}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                {title}
              </h2>
            </div>
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          </div>
          
          <Button 
            asChild 
            variant="ghost" 
            className="hidden md:flex group text-primary hover:text-primary font-semibold"
          >
            <Link to={viewAllLink}>
              View All
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} isLoading={isLoading} />

        {/* Mobile View All */}
        <div className="text-center mt-10 md:hidden">
          <Button asChild variant="outline" className="btn-glow">
            <Link to={viewAllLink}>
              View All {title}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Featured AI Section with special styling
interface SupabaseAISectionProps {
  products: ProductCardProps[];
  isLoading: boolean;
}

export function SupabaseAISection({ products, isLoading }: SupabaseAISectionProps) {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 left-0 right-0 h-px gradient-line" />
      <div className="absolute bottom-0 left-0 right-0 h-px gradient-line" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-5 py-2.5 mb-6 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-semibold text-primary">AI-Powered Recommendations</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Curated <span className="text-gradient-gold">Just For You</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our intelligent algorithm selects trending products based on real-time demand signals and customer preferences.
          </p>
        </div>

        {/* Products */}
        <ProductGrid products={products} isLoading={isLoading} />

        {/* CTA */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="btn-glow bg-primary hover:bg-primary/90">
            <Link to="/collections">
              Explore AI Picks
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
