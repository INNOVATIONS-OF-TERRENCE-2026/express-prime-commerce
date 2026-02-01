/**
 * Shopify Product Sync Utility
 * Fetches all products from Shopify Storefront API and syncs to Supabase
 */

import { 
  storefrontApiRequest, 
  ShopifyProduct,
  SHOPIFY_STORE_PERMANENT_DOMAIN 
} from './shopify';
import { supabase } from '@/integrations/supabase/client';

// Extended query to get more products with pagination
const ALL_PRODUCTS_QUERY = `
  query GetAllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          handle
          productType
          vendor
          tags
          createdAt
          updatedAt
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface AllProductsResponse {
  data?: {
    products?: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      edges: ShopifyProduct[];
    };
  };
}

export interface SyncResult {
  success: boolean;
  message: string;
  totalFetched?: number;
  created?: number;
  updated?: number;
  failed?: number;
  errors?: string[];
}

/**
 * Fetch all products from Shopify with pagination
 */
export async function fetchAllShopifyProducts(maxProducts: number = 250): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const pageSize = 50; // Shopify max is 250, but 50 is safer
  
  while (hasNextPage && allProducts.length < maxProducts) {
    const response = await storefrontApiRequest<AllProductsResponse>(ALL_PRODUCTS_QUERY, {
      first: Math.min(pageSize, maxProducts - allProducts.length),
      after: cursor,
    });
    
    if (!response?.data?.products?.edges) {
      break;
    }
    
    allProducts.push(...response.data.products.edges);
    hasNextPage = response.data.products.pageInfo.hasNextPage;
    cursor = response.data.products.pageInfo.endCursor;
    
    // Small delay to avoid rate limiting
    if (hasNextPage) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allProducts;
}

/**
 * Transform Shopify product to Supabase format
 */
export function transformToSupabaseProduct(shopifyProduct: ShopifyProduct) {
  const node = shopifyProduct.node;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const compareAtPrice = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : null;
  
  return {
    handle: node.handle,
    title: node.title,
    description: node.description || '',
    vendor: node.vendor || 'Express Prime',
    product_type: node.productType || 'General',
    tags: node.tags || [],
    price: price,
    compare_at_price: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    image_url: node.images.edges[0]?.node?.url || null,
    images: node.images.edges.map(img => img.node.url),
    shopify_product_id: node.id,
    status: 'active' as const,
  };
}

/**
 * Sync products from Shopify to Supabase via Edge Function (bypasses RLS)
 */
export async function syncShopifyProducts(maxProducts: number = 75): Promise<SyncResult> {
  try {
    // Fetch products from Shopify
    console.log(`Fetching up to ${maxProducts} products from Shopify...`);
    const shopifyProducts = await fetchAllShopifyProducts(maxProducts);
    
    if (shopifyProducts.length === 0) {
      return {
        success: false,
        message: 'No products found in Shopify store. Make sure your store has products and the Storefront API token is valid.',
        totalFetched: 0,
      };
    }
    
    console.log(`Fetched ${shopifyProducts.length} products from Shopify`);
    
    // Transform products to Supabase format
    const products = shopifyProducts.map(transformToSupabaseProduct);
    
    // Convert to CSV format for the edge function
    const csvContent = productsToCSV(products);
    
    // Call the bulk import edge function (uses service role, bypasses RLS)
    const { data, error } = await supabase.functions.invoke('bulk-import-txt', {
      body: {
        content: csvContent,
        userId: null,
      },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        message: `Failed to sync products: ${error.message}`,
        totalFetched: shopifyProducts.length,
      };
    }
    
    return {
      success: true,
      message: `Successfully synced ${data?.created || 0} products from Shopify!`,
      totalFetched: shopifyProducts.length,
      created: data?.created || 0,
      updated: data?.updated || 0,
      failed: data?.failed || 0,
      errors: data?.errors?.map((e: { handle: string; error: string }) => `${e.handle}: ${e.error}`) || [],
    };
  } catch (err) {
    console.error('Sync error:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Convert products array to CSV format for bulk import
 */
function productsToCSV(products: ReturnType<typeof transformToSupabaseProduct>[]): string {
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Variant Price',
    'Variant Compare At Price',
    'Image Src',
    'Status',
  ];
  
  const rows = products.map(p => [
    p.handle,
    p.title,
    p.description,
    p.vendor,
    p.product_type,
    p.tags.join(', '),
    p.price.toString(),
    p.compare_at_price?.toString() || '',
    p.image_url || '',
    p.status,
  ]);
  
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];
  
  return csvLines.join('\n');
}

/**
 * Direct insert to Supabase (for testing - may fail due to RLS)
 */
export async function directInsertProducts(products: ReturnType<typeof transformToSupabaseProduct>[]): Promise<SyncResult> {
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(products, { 
        onConflict: 'handle',
        ignoreDuplicates: false,
      })
      .select();
    
    if (error) {
      return {
        success: false,
        message: `Database error: ${error.message}`,
      };
    }
    
    return {
      success: true,
      message: `Successfully inserted ${data?.length || 0} products`,
      created: data?.length || 0,
    };
  } catch (err) {
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
