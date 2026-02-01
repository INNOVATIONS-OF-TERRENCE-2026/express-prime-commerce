import { TrendingUp, Star, Zap, Sparkles, Bot } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductSection, AIRecommendedSection } from '@/components/home/ProductSection';
import { CTASection } from '@/components/home/CTASection';
import { TrustBadges, TrustStrip } from '@/components/trust/TrustBadges';
import { useProducts } from '@/hooks/useProducts';

export default function HomePage() {
  const { products, isLoading } = useProducts();

  // Filter products by tags with fallback to show some products
  const trendingProducts = products
    .filter(p => p.tags?.includes('trending'))
    .slice(0, 4);
  
  const bestSellers = products
    .filter(p => p.tags?.includes('bestseller'))
    .slice(0, 4);
  
  const newArrivals = products
    .filter(p => p.tags?.includes('new'))
    .slice(0, 4);

  const smartTech = products
    .filter(p => p.tags?.includes('smart-tech'))
    .slice(0, 4);

  const aiRecommended = products
    .filter(p => p.tags?.includes('ai-pick'))
    .slice(0, 4);

  // Fallback products if no tagged products exist
  const fallbackProducts = products.slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection productsCount={products.length} />

      {/* Trust Strip - Immediately under hero */}
      <section className="py-4 border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <TrustStrip />
        </div>
      </section>

      {/* Trust Badges - Full Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <TrustBadges />
        </div>
      </section>

      {/* Trending Now */}
      <ProductSection
        title="Trending Now"
        subtitle="Hot products flying off the shelves"
        icon={<TrendingUp className="w-6 h-6 text-accent" />}
        products={trendingProducts.length > 0 ? trendingProducts : fallbackProducts}
        isLoading={isLoading}
        viewAllLink="/collections?tag=trending"
      />

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Customer favorites you'll love"
        icon={<Star className="w-6 h-6 text-accent" />}
        products={bestSellers.length > 0 ? bestSellers : fallbackProducts}
        isLoading={isLoading}
        viewAllLink="/collections?tag=bestseller"
        bgColor="bg-muted/20"
      />

      {/* New Drops */}
      <ProductSection
        title="New Drops"
        subtitle="Fresh additions to our collection"
        icon={<Zap className="w-6 h-6 text-emerald-500" />}
        products={newArrivals.length > 0 ? newArrivals : fallbackProducts}
        isLoading={isLoading}
        viewAllLink="/collections?tag=new"
      />

      {/* Smart Tech Finds */}
      <ProductSection
        title="Smart Tech Finds"
        subtitle="Innovation meets everyday convenience"
        icon={<Sparkles className="w-6 h-6 text-primary" />}
        products={smartTech.length > 0 ? smartTech : fallbackProducts}
        isLoading={isLoading}
        viewAllLink="/collections?tag=smart-tech"
        bgColor="bg-muted/20"
      />

      {/* AI Recommended Section */}
      <AIRecommendedSection 
        products={aiRecommended.length > 0 ? aiRecommended : fallbackProducts}
        isLoading={isLoading}
      />

      {/* CTA Section */}
      <CTASection />
    </Layout>
  );
}
