import { TrendingUp, Star, Zap, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductSection, AIRecommendedSection } from '@/components/home/ProductSection';
import { CTASection } from '@/components/home/CTASection';
import { TrustBadges, TrustStrip } from '@/components/trust/TrustBadges';
import { useShopifyProducts, transformShopifyProduct } from '@/hooks/useShopifyProducts';

export default function HomePage() {
  const { data: shopifyProducts = [], isLoading } = useShopifyProducts({ limit: 50 });

  // Transform Shopify products to display format
  const products = shopifyProducts.map(transformShopifyProduct);

  // Filter products by product type for different sections
  const electronics = products
    .filter(p => p.productType === 'Electronics' || p.productType === 'Smart Home')
    .slice(0, 4);
  
  const healthWellness = products
    .filter(p => p.productType === 'Health & Wellness')
    .slice(0, 4);
  
  const homeProducts = products
    .filter(p => 
      p.productType === 'Home & Living' || 
      p.productType === 'Home Organization' || 
      p.productType === 'Kitchen Gadgets'
    )
    .slice(0, 4);

  const officeProducts = products
    .filter(p => p.productType === 'Office Accessories')
    .slice(0, 4);

  // Featured products - mix from different categories
  const featuredProducts = products.slice(0, 4);

  // AI Recommended - random selection for variety
  const aiRecommended = products.slice(4, 8);

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
        products={homeProducts.length > 0 ? homeProducts : featuredProducts}
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
