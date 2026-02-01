import { TrendingUp, Star, Zap, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ShopifyProductSection, AIRecommendedSection } from '@/components/home/ProductSection';
import { CTASection } from '@/components/home/CTASection';
import { TrustBadges, TrustStrip } from '@/components/trust/TrustBadges';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { ShopifyProduct } from '@/lib/shopify';
import { useMemo, useEffect } from 'react';
import { AIPicksSection, CuratedCarousel } from '@/components/ai';
import { useAIInitializer } from '@/hooks/useAIRanking';
import type { ProductInput } from '@/ai';

export default function HomePage() {
  // Initialize AI ranker early
  const { initialize } = useAIInitializer();
  
  useEffect(() => {
    // Preload AI model in background
    initialize();
  }, [initialize]);

  // Fetch all products directly from Shopify Storefront API
  const { data: allProducts = [], isLoading } = useShopifyProducts({ limit: 50 });

  // Convert Shopify products to AI ProductInput format
  const aiProductInputs: ProductInput[] = useMemo(() => {
    return allProducts.map((p) => ({
      id: p.node.id,
      title: p.node.title,
      description: p.node.description || null,
      product_type: p.node.productType || null,
      price: parseFloat(p.node.priceRange?.minVariantPrice?.amount || '0'),
      compare_at_price: p.node.compareAtPriceRange?.minVariantPrice?.amount
        ? parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount)
        : null,
      vendor: p.node.vendor || null,
      tags: p.node.tags || null,
    }));
  }, [allProducts]);

  // Filter products by type for category sections
  const productsByType = useMemo(() => {
    const electronics: ShopifyProduct[] = [];
    const healthWellness: ShopifyProduct[] = [];
    const homeLiving: ShopifyProduct[] = [];
    const kitchen: ShopifyProduct[] = [];
    const aiPicks: ShopifyProduct[] = [];
    
    allProducts.forEach((product) => {
      const type = product.node.productType?.toLowerCase() || '';
      const tags = product.node.tags || [];
      
      if (tags.includes('ai-pick')) {
        aiPicks.push(product);
      }
      
      if (type.includes('electronics') || type.includes('smart') || type.includes('tech')) {
        electronics.push(product);
      } else if (type.includes('health') || type.includes('wellness') || type.includes('fitness')) {
        healthWellness.push(product);
      } else if (type.includes('home') || type.includes('living') || type.includes('organization')) {
        homeLiving.push(product);
      } else if (type.includes('kitchen')) {
        kitchen.push(product);
      }
    });

    return { electronics, healthWellness, homeLiving, kitchen, aiPicks };
  }, [allProducts]);

  // Featured products - first 4 unique products
  const featuredProducts = allProducts.slice(0, 4);

  // AI Recommended - tagged products or fallback to next 4
  const aiRecommended = productsByType.aiPicks.length > 0 
    ? productsByType.aiPicks.slice(0, 4) 
    : allProducts.slice(4, 8);
  
  // Combine home-related products
  const allHomeProducts = productsByType.homeLiving.length > 0 
    ? productsByType.homeLiving.slice(0, 4)
    : productsByType.kitchen.length > 0 
      ? productsByType.kitchen.slice(0, 4)
      : featuredProducts;

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection productsCount={allProducts.length} />

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

      {/* AI Picks Section - NEW */}
      {aiProductInputs.length > 0 && (
        <section className="py-6 md:py-10 bg-gradient-to-b from-amber-50/30 to-transparent dark:from-amber-950/10">
          <div className="container mx-auto px-4">
            <AIPicksSection
              products={aiProductInputs}
              count={4}
              title="AI Picks"
              subtitle="Intelligently curated for maximum value"
            />
          </div>
        </section>
      )}

      {/* Curated Carousel - NEW */}
      {aiProductInputs.length > 4 && (
        <section className="border-y border-border/50 bg-muted/20">
          <div className="container mx-auto">
            <CuratedCarousel
              products={aiProductInputs}
              count={8}
              title="Curated by AI"
            />
          </div>
        </section>
      )}

      {/* Featured Products */}
      <ShopifyProductSection
        title="Featured Products"
        subtitle="Hot products flying off the shelves"
        icon={<TrendingUp className="w-6 h-6 text-accent" />}
        products={featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections"
      />

      {/* Electronics & Smart Tech */}
      <ShopifyProductSection
        title="Electronics & Smart Tech"
        subtitle="Innovation meets everyday convenience"
        icon={<Star className="w-6 h-6 text-accent" />}
        products={productsByType.electronics.length > 0 ? productsByType.electronics.slice(0, 4) : featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections?category=electronics"
        bgColor="bg-muted/20"
      />

      {/* Health & Wellness */}
      <ShopifyProductSection
        title="Health & Wellness"
        subtitle="Take care of yourself with premium essentials"
        icon={<Zap className="w-6 h-6 text-emerald-500" />}
        products={productsByType.healthWellness.length > 0 ? productsByType.healthWellness.slice(0, 4) : featuredProducts}
        isLoading={isLoading}
        viewAllLink="/collections?category=health-wellness"
      />

      {/* Home & Living */}
      <ShopifyProductSection
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
