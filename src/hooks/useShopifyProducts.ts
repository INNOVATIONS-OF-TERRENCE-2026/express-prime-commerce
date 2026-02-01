import { useQuery } from '@tanstack/react-query';
import { storefrontApiRequest, PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY, ShopifyProduct } from '@/lib/shopify';

interface ProductsQueryResponse {
  data?: {
    products?: {
      edges: ShopifyProduct[];
    };
  };
}

interface ProductByHandleResponse {
  data?: {
    productByHandle?: ShopifyProduct['node'];
  };
}

interface UseShopifyProductsOptions {
  limit?: number;
  query?: string;
}

export function useShopifyProducts(options: UseShopifyProductsOptions = {}) {
  const { limit = 20, query } = options;

  return useQuery({
    queryKey: ['shopify-products', limit, query],
    queryFn: async () => {
      const data = await storefrontApiRequest<ProductsQueryResponse>(PRODUCTS_QUERY, {
        first: limit,
        query: query || null,
      });

      if (!data?.data?.products?.edges) {
        return [];
      }

      return data.data.products.edges;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useShopifyProduct(handle: string) {
  return useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: async () => {
      const data = await storefrontApiRequest<ProductByHandleResponse>(PRODUCT_BY_HANDLE_QUERY, {
        handle,
      });

      if (!data?.data?.productByHandle) {
        return null;
      }

      return data.data.productByHandle;
    },
    enabled: !!handle,
    staleTime: 1000 * 60 * 5,
  });
}

// Transform Shopify products to the format used by ProductCard
export function transformShopifyProduct(product: ShopifyProduct) {
  const node = product.node;
  const firstVariant = node.variants.edges[0]?.node;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const compareAtPrice = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : firstVariant?.compareAtPrice?.amount
      ? parseFloat(firstVariant.compareAtPrice.amount)
      : undefined;

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
    image: node.images.edges[0]?.node?.url,
    tags: node.tags || [],
    productType: node.productType,
    vendor: node.vendor,
    isNew: node.tags?.includes('new'),
    isTrending: node.tags?.includes('trending'),
    isBestSeller: node.tags?.includes('bestseller'),
    isAiPick: node.tags?.includes('ai-pick'),
  };
}
