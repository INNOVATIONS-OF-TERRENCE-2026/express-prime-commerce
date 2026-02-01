import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCardProps } from '@/components/product/ProductCard';

interface UseProductsOptions {
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  productType?: string;
}

/**
 * Category slug to product_type mapping
 * This maps URL-friendly slugs to database product_type values
 */
const CATEGORY_MAP: Record<string, string | string[]> = {
  'kitchen-gadgets': 'Kitchen Gadgets',
  'home-living': 'Home & Living',
  'health-wellness': 'Health & Wellness',
  'home-organization': 'Home Organization',
  'home-appliances': 'Home Appliances',
  'computer-accessories': 'Computer Accessories',
  'fitness': 'Fitness',
  'phone-accessories': 'Phone Accessories',
  'office-accessories': 'Office Accessories',
  'electronics': 'Electronics',
  'electronics-smart-tech': 'Electronics',
  'smart-tech': ['Electronics', 'Smart Home'],
  'sports-outdoors': 'Sports & Outdoors',
};

export function useProducts(options: UseProductsOptions = {}) {
  const { category, tag, search, sortBy = 'trending', limit, productType } = options;

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', category, tag, search, sortBy, limit, productType],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      // Filter by explicit productType if provided
      if (productType) {
        query = query.eq('product_type', productType);
      }
      // Filter by category/product_type using slug mapping
      else if (category && category !== 'all') {
        const mapped = CATEGORY_MAP[category];
        if (Array.isArray(mapped)) {
          // Handle multiple product types for a category
          query = query.in('product_type', mapped);
        } else {
          const productTypeValue = mapped || category;
          query = query.eq('product_type', productTypeValue);
        }
      }

      // Filter by tag
      if (tag) {
        query = query.contains('tags', [tag]);
      }

      // Search
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'best-selling':
        case 'trending':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      // Transform to ProductCardProps
      return (data || []).map((product): ProductCardProps => ({
        id: product.id,
        handle: product.handle || product.id,
        title: product.title,
        price: product.price || 0,
        compareAtPrice: product.compare_at_price,
        image: product.image_url || undefined,
        tags: product.tags || [],
        productType: product.product_type || undefined,
        vendor: product.vendor || undefined,
        isNew: product.tags?.includes('new'),
        isTrending: product.tags?.includes('trending'),
        isBestSeller: product.tags?.includes('bestseller'),
        isAiPick: product.tags?.includes('ai-pick'),
      }));
    },
  });

  return { products, isLoading, error, refetch };
}

/**
 * Fetch all active products for homepage sections
 */
export function useAllProducts(limit?: number) {
  return useProducts({ limit, sortBy: 'newest' });
}

/**
 * Fetch products by product type (e.g., "Electronics", "Health & Wellness")
 */
export function useProductsByType(productType: string, limit?: number) {
  return useProducts({ productType, limit });
}

/**
 * Fetch products by tag (e.g., "trending", "bestseller", "ai-pick")
 */
export function useProductsByTag(tag: string, limit?: number) {
  return useProducts({ tag, limit });
}

export function useProduct(handle: string) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`handle.eq.${handle},id.eq.${handle}`)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  return { product, isLoading, error };
}
