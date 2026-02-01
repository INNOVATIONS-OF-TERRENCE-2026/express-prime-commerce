import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCardProps } from '@/components/product/ProductCard';

interface UseProductsOptions {
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { category, tag, search, sortBy = 'trending', limit } = options;

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', category, tag, search, sortBy, limit],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      // Filter by category/product_type
      if (category && category !== 'all') {
        const categoryMap: Record<string, string> = {
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
          'sports-outdoors': 'Sports & Outdoors',
        };
        const productType = categoryMap[category] || category;
        query = query.eq('product_type', productType);
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

      if (error) throw error;

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
      }));
    },
  });

  return { products, isLoading, error };
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
