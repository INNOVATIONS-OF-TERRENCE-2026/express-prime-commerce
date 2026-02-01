/**
 * useAI - React hooks for the Supreme AI Engine
 * 
 * Provides easy-to-use hooks for all AI functionality:
 * - Product sentiment analysis
 * - Automatic categorization
 * - Review insights
 * - Price optimization
 * - Demand forecasting
 * - Semantic search
 * 
 * @version 3.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  analyzeSentiment,
  classifyProduct,
  analyzeReviews,
  analyzeProduct,
  generateProductDescription,
  getPriceRecommendation,
  forecastDemand,
  generateEmbedding,
  findSimilarProducts,
  cosineSimilarity,
  type SentimentResult,
  type ClassificationResult,
  type ProductAnalysis,
  type ReviewAnalysis,
  type GeneratedDescription,
  type PriceRecommendation,
  type DemandForecast,
  type SimilarProduct,
} from '@/lib/aiEngine';

// ============================================================================
// SENTIMENT ANALYSIS HOOK
// ============================================================================

/**
 * Analyze sentiment of any text
 */
export function useSentimentAnalysis() {
  return useMutation({
    mutationFn: async (text: string): Promise<SentimentResult> => {
      return analyzeSentiment(text);
    },
  });
}

/**
 * Analyze sentiment for a product by ID
 */
export function useProductSentiment(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-sentiment', productId],
    queryFn: async (): Promise<SentimentResult | null> => {
      if (!productId) return null;

      const { data: product } = await supabase
        .from('products')
        .select('title, description')
        .eq('id', productId)
        .single();

      if (!product) return null;

      const text = `${product.title}. ${product.description || ''}`;
      return analyzeSentiment(text);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

// ============================================================================
// PRODUCT CLASSIFICATION HOOK
// ============================================================================

/**
 * Classify a product into a category
 */
export function useProductClassification() {
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }): Promise<ClassificationResult> => {
      return classifyProduct(title, description);
    },
  });
}

/**
 * Auto-classify product by ID and update in database
 */
export function useAutoClassifyProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<ClassificationResult> => {
      const { data: product } = await supabase
        .from('products')
        .select('title, description')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      const classification = await classifyProduct(
        product.title,
        product.description || ''
      );

      // Update product with AI-classified category
      if (classification.confidence > 0.7) {
        await supabase
          .from('products')
          .update({
            product_type: classification.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);
      }

      return classification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// ============================================================================
// COMPREHENSIVE PRODUCT ANALYSIS HOOK
// ============================================================================

/**
 * Run full AI analysis on a product
 */
export function useProductAnalysis(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-analysis', productId],
    queryFn: async (): Promise<ProductAnalysis | null> => {
      if (!productId) return null;

      // Fetch product data
      const { data: product } = await supabase
        .from('products')
        .select('title, description, price, cost')
        .eq('id', productId)
        .single();

      if (!product) return null;

      // Fetch performance metrics for sales history
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('orders_count')
        .eq('product_id', productId)
        .order('date', { ascending: false })
        .limit(30);

      const historicalSales = metrics?.map(m => m.orders_count || 0) || [];

      // Run comprehensive analysis
      return analyzeProduct(
        product.title,
        product.description || '',
        product.price,
        product.cost || product.price * 0.6,
        [], // Reviews would come from reviews table
        historicalSales,
        [] // Competitor prices would come from market data
      );
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
}

/**
 * Batch analyze multiple products
 */
export function useBatchProductAnalysis() {
  return useMutation({
    mutationFn: async (
      productIds: string[]
    ): Promise<Map<string, ProductAnalysis>> => {
      const results = new Map<string, ProductAnalysis>();

      // Fetch all products at once
      const { data: products } = await supabase
        .from('products')
        .select('id, title, description, price, cost')
        .in('id', productIds);

      if (!products) return results;

      // Analyze each product
      for (const product of products) {
        try {
          const analysis = await analyzeProduct(
            product.title,
            product.description || '',
            product.price,
            product.cost || product.price * 0.6,
            [],
            [],
            []
          );
          results.set(product.id, analysis);
        } catch (error) {
          console.error(`Failed to analyze product ${product.id}:`, error);
        }
      }

      return results;
    },
  });
}

// ============================================================================
// REVIEW ANALYSIS HOOK
// ============================================================================

/**
 * Analyze reviews for a product
 */
export function useReviewAnalysis(productId: string | undefined) {
  return useQuery({
    queryKey: ['review-analysis', productId],
    queryFn: async (): Promise<ReviewAnalysis | null> => {
      if (!productId) return null;

      // Fetch reviews from database (cast to any for new table not in generated types)
      const { data: reviews } = await (supabase as any)
        .from('product_reviews')
        .select('content, rating')
        .eq('product_id', productId);

      if (!reviews || reviews.length === 0) {
        return {
          overallSentiment: { label: 'NEUTRAL', score: 0.5, confidence: 0 },
          themes: [],
          qualityScore: 50,
          valueScore: 50,
          satisfactionScore: 50,
          recommendations: ['No reviews yet - encourage customers to leave feedback'],
        };
      }

      const reviewTexts = (reviews as any[]).map((r: any) => r.content || '').filter(Boolean);
      return analyzeReviews(reviewTexts);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// ============================================================================
// DESCRIPTION GENERATION HOOK
// ============================================================================

/**
 * Generate AI-powered product descriptions
 */
export function useGenerateDescription() {
  return useMutation({
    mutationFn: async ({
      title,
      features,
      category,
    }: {
      title: string;
      features: string[];
      category: string;
    }): Promise<GeneratedDescription> => {
      return generateProductDescription(title, features, category);
    },
  });
}

/**
 * Generate and save description for a product
 */
export function useGenerateAndSaveDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<GeneratedDescription> => {
      const { data: product } = await supabase
        .from('products')
        .select('title, tags, product_type')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      const description = await generateProductDescription(
        product.title,
        product.tags || [],
        product.product_type || 'General'
      );

      // Save the generated description
      await supabase
        .from('products')
        .update({
          description: description.long,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      return description;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

// ============================================================================
// PRICE OPTIMIZATION HOOK
// ============================================================================

/**
 * Get AI price recommendation for a product
 */
export function usePriceRecommendation(productId: string | undefined) {
  return useQuery({
    queryKey: ['price-recommendation', productId],
    queryFn: async (): Promise<PriceRecommendation | null> => {
      if (!productId) return null;

      const { data: product } = await supabase
        .from('products')
        .select('title, description, price, cost')
        .eq('id', productId)
        .single();

      if (!product) return null;

      // Get sales velocity
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('orders_count')
        .eq('product_id', productId)
        .order('date', { ascending: false })
        .limit(7);

      const recentSales = metrics?.map(m => m.orders_count || 0) || [];
      const velocity = recentSales.reduce((a, b) => a + b, 0) / Math.max(1, recentSales.length);

      // Get sentiment
      const sentiment = await analyzeSentiment(`${product.title}. ${product.description || ''}`);

      return getPriceRecommendation(
        product.price,
        product.cost || product.price * 0.6,
        [], // Would fetch competitor prices
        velocity,
        sentiment
      );
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 30,
  });
}

// ============================================================================
// DEMAND FORECASTING HOOK
// ============================================================================

/**
 * Forecast demand for a product
 */
export function useDemandForecast(productId: string | undefined) {
  return useQuery({
    queryKey: ['demand-forecast', productId],
    queryFn: async (): Promise<DemandForecast | null> => {
      if (!productId) return null;

      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('orders_count, date')
        .eq('product_id', productId)
        .order('date', { ascending: false })
        .limit(90);

      if (!metrics || metrics.length === 0) {
        return {
          nextWeek: 0,
          nextMonth: 0,
          trend: 'stable',
          seasonalFactor: 1,
          confidence: 0,
        };
      }

      const historicalSales = metrics.map(m => m.orders_count || 0).reverse();
      return forecastDemand(historicalSales);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 60,
  });
}

// ============================================================================
// SEMANTIC SEARCH HOOK
// ============================================================================

/**
 * Semantic product search using embeddings
 */
export function useSemanticSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<SimilarProduct[]> => {
      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding(query);
      
      if (queryEmbedding.length === 0) {
        // Fallback to text search
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .ilike('title', `%${query}%`)
          .limit(5);

        return (products || []).map(p => ({
          productId: p.id,
          title: p.title,
          similarity: 0.5,
        }));
      }

      // Fetch all products with their titles for embedding comparison
      const { data: products } = await supabase
        .from('products')
        .select('id, title, description')
        .eq('status', 'active')
        .limit(100);

      if (!products) return [];

      // Generate embeddings for products and find similar
      const productEmbeddings = await Promise.all(
        products.map(async p => ({
          id: p.id,
          title: p.title,
          embedding: await generateEmbedding(`${p.title}. ${p.description || ''}`),
        }))
      );

      return findSimilarProducts(queryEmbedding, productEmbeddings, 10);
    },
  });
}

/**
 * Find similar products to a given product
 */
export function useSimilarProducts(productId: string | undefined) {
  return useQuery({
    queryKey: ['similar-products', productId],
    queryFn: async (): Promise<SimilarProduct[]> => {
      if (!productId) return [];

      const { data: product } = await supabase
        .from('products')
        .select('title, description')
        .eq('id', productId)
        .single();

      if (!product) return [];

      const productEmbedding = await generateEmbedding(
        `${product.title}. ${product.description || ''}`
      );

      // Get other products
      const { data: otherProducts } = await supabase
        .from('products')
        .select('id, title, description')
        .neq('id', productId)
        .eq('status', 'active')
        .limit(50);

      if (!otherProducts) return [];

      const productEmbeddings = await Promise.all(
        otherProducts.map(async p => ({
          id: p.id,
          title: p.title,
          embedding: await generateEmbedding(`${p.title}. ${p.description || ''}`),
        }))
      );

      return findSimilarProducts(productEmbedding, productEmbeddings, 5);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 60,
  });
}

// ============================================================================
// AI DASHBOARD STATS HOOK
// ============================================================================

interface AIStats {
  totalAnalyzed: number;
  avgSentimentScore: number;
  topCategories: Array<{ category: string; count: number }>;
  riskProducts: number;
  opportunityProducts: number;
}

/**
 * Get AI analysis statistics for dashboard
 */
export function useAIStats() {
  return useQuery({
    queryKey: ['ai-stats'],
    queryFn: async (): Promise<AIStats> => {
      // Get products with AI decisions
      const { data: decisions } = await supabase
        .from('ai_decisions')
        .select('product_id, decision_type, confidence')
        .order('created_at', { ascending: false })
        .limit(100);

      // Get product categories
      const { data: products } = await supabase
        .from('products')
        .select('product_type')
        .eq('status', 'active');

      // Calculate stats
      const categoryCount = new Map<string, number>();
      products?.forEach(p => {
        const cat = p.product_type || 'Other';
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
      });

      const topCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const riskProducts = decisions?.filter(
        d => d.decision_type === 'flag' || d.decision_type === 'pause'
      ).length || 0;

      const opportunityProducts = decisions?.filter(
        d => d.decision_type === 'activate' && d.confidence > 0.8
      ).length || 0;

      return {
        totalAnalyzed: decisions?.length || 0,
        avgSentimentScore: 0.7, // Would calculate from actual sentiment data
        topCategories,
        riskProducts,
        opportunityProducts,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  SentimentResult,
  ClassificationResult,
  ProductAnalysis,
  ReviewAnalysis,
  GeneratedDescription,
  PriceRecommendation,
  DemandForecast,
  SimilarProduct,
};
