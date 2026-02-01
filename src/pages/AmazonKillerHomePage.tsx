/**
 * Amazon-Killer Homepage
 * 
 * INTELLIGENT VISUAL PRIORITIZATION
 * This homepage must feel:
 * - Curated
 * - Calm
 * - Confident
 * - Predictive
 * - Intelligent
 * 
 * It reduces cognitive load, accelerates buyer confidence,
 * and removes hesitation before checkout.
 * 
 * Section Order (MANDATORY):
 * 1. Hero "Decision Remover"
 * 2. AI Trust Strip (always above fold)
 * 3. AI Picks Grid (core differentiator)
 * 4. Visual Dominance Row
 * 5. Trending Velocity Strip
 * 6. Reduced Choice Section
 * 7. Social Proof Section
 * 8. Footer (Silent Reassurance)
 */

import { useMemo, useEffect } from 'react';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { useAIInitializer } from '@/hooks/useAIRanking';
import type { ProductInput } from '@/ai';

// Amazon-Killer Homepage Components
import { 
  HeroDecisionRemover,
  AITrustStrip,
  AIPicksGrid,
  VisualDominanceRow,
  TrendingVelocityStrip,
  ReducedChoiceSection,
  SocialProofSection,
  SilentReassuranceFooter 
} from '@/components/home';

// Layout (header with minimal navigation)
import { Header } from '@/components/layout/Header';

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
      image_url: p.node.featuredImage?.url || null,
    }));
  }, [allProducts]);

  // Select products for each section
  const heroProducts = aiProductInputs.slice(0, 3); // Max 3 for hero
  const aiPickProducts = aiProductInputs.slice(0, 6); // Max 6 for AI picks
  const visualDominanceProducts = aiProductInputs.slice(3, 7); // 4 products
  const trendingProducts = aiProductInputs.slice(0, 10); // Up to 10 for carousel
  
  // Reduced choice: 3 products (one of each type)
  const reducedChoiceProducts = aiProductInputs.length >= 3 
    ? [aiProductInputs[0], aiProductInputs[1], aiProductInputs[2]] 
    : aiProductInputs.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Minimal */}
      <Header />

      {/* 1️⃣ HERO = DECISION REMOVER */}
      <HeroDecisionRemover 
        products={heroProducts}
        isLoading={isLoading}
      />

      {/* 2️⃣ AI TRUST STRIP - Always above fold */}
      <AITrustStrip variant="default" />

      {/* 3️⃣ AI PICKS GRID - Core Differentiator */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <AIPicksGrid
            products={aiPickProducts}
            isLoading={isLoading}
            maxProducts={6}
          />
        </div>
      </section>

      {/* 4️⃣ VISUAL DOMINANCE ROW */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <VisualDominanceRow
            products={visualDominanceProducts}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* 5️⃣ TRENDING VELOCITY STRIP */}
      <section className="py-12 md:py-16">
        <TrendingVelocityStrip
          products={trendingProducts}
          isLoading={isLoading}
        />
      </section>

      {/* 6️⃣ REDUCED CHOICE SECTION */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <ReducedChoiceSection
            products={reducedChoiceProducts}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* 7️⃣ SOCIAL PROOF SECTION */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <SocialProofSection
            products={aiPickProducts.slice(0, 4)}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* 8️⃣ FOOTER = SILENT REASSURANCE */}
      <SilentReassuranceFooter />
    </div>
  );
}
