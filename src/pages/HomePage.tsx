import { TrendingUp, Star, Zap, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductSection, AIRecommendedSection } from '@/components/home/ProductSection';
import { CTASection } from '@/components/home/CTASection';
import { TrustBadges, TrustStrip } from '@/components/trust/TrustBadges';
import { useAllProducts, useProductsByType, useProductsByTag } from '@/hooks/useProducts';

export default function HomePage() {
  // Fetch all products from Supabase
  const { products, isLoading } = useAllProducts(50);
  
  // Fetch category-specific products
  const { products: electronics } = useProductsByType('Electronics', 4);
  const { products: healthWellness } = useProductsByType('Health & Wellness', 4);
  const { products: homeProducts } = useProductsByType('Home & Living', 4);
  const { products: kitchenProducts } = useProductsByType('Kitchen Gadgets', 4);

  // Featured products - first 4 products
  const featuredProducts = products.slice(0, 4);

  // AI Recommended - tagged products or fallback to next 4
  const { products: aiPicks } = useProductsByTag('ai-pick', 4);
  const aiRecommended = aiPicks.length > 0 ? aiPicks : products.slice(4, 8);
  
  // Combine home-related products
  const allHomeProducts = homeProducts.length > 0 
    ? homeProducts 
    : kitchenProducts.length > 0 
      ? kitchenProducts 
      : featuredProducts;

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

      {/* Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Hot products flying off the shelves"
        icon={<TrendingUp className="w-6 h-6 text-accent" />}
        products={featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections"
      />

      {/* Electronics & Smart Tech */}
      <ProductSection
        title="Electronics & Smart Tech"
        subtitle="Innovation meets everyday convenience"
        icon={<Star className="w-6 h-6 text-accent" />}
        products={electronics.length > 0 ? electronics : featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections?category=electronics"
        bgColor="bg-muted/20"
      />

      {/* Health & Wellness */}
      <ProductSection
        title="Health & Wellness"
        subtitle="Take care of yourself with premium essentials"
        icon={<Zap className="w-6 h-6 text-emerald-500" />}
        products={healthWellness.length > 0 ? healthWellness : featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections?category=health-wellness"
      />

      {/* Home & Living */}
      <ProductSection
        title="Home & Living"
        subtitle="Upgrade your living space"
        icon={<Sparkles className="w-6 h-6 text-primary" />}
        products={allHomeProducts}
        isLoading={isLoading}
        viewAllLink="/collections?category=home-living"
        bgColor="bg-muted/20"
      />

      {/* AI Recommended Section */}
      <AIRecommendedSection 
        products={aiRecommended.length > 0 ? aiRecommended : featuredProducts}
        isLoading={isLoading}
      />

      {/* CTA Section */}
      <CTASection />
    </Layout>
  );
}
