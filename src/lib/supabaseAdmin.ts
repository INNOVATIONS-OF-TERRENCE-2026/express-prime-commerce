/**
 * Supabase Admin Utilities
 * Uses service role key for administrative operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kersfyxgczuzjseaityj.supabase.co";

// Service role key for admin operations (bypasses RLS)
// IMPORTANT: Never expose this key in client-side code or commit to public repos
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates a Supabase client with service role privileges
 * Use only for server-side or admin operations
 */
export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Service role key not set. Admin operations will fail.');
    return null;
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

/**
 * Collection definitions for seeding
 */
export const COLLECTIONS = [
  {
    title: 'Electronics & Smart Tech',
    handle: 'electronics',
    description: 'Cutting-edge electronics and smart devices for modern living',
    sort_order: '1',
    products_count: 14,
  },
  {
    title: 'Health & Wellness',
    handle: 'health-wellness',
    description: 'Products to support your health, wellness, and self-care routine',
    sort_order: '2',
    products_count: 12,
  },
  {
    title: 'Home & Living',
    handle: 'home-living',
    description: 'Upgrade your living space with smart home essentials',
    sort_order: '3',
    products_count: 14,
  },
  {
    title: 'Kitchen Gadgets',
    handle: 'kitchen-gadgets',
    description: 'Innovative tools and appliances for your kitchen',
    sort_order: '4',
    products_count: 14,
  },
  {
    title: 'Office Accessories',
    handle: 'office-accessories',
    description: 'Boost productivity with ergonomic office essentials',
    sort_order: '5',
    products_count: 7,
  },
  {
    title: 'Fitness',
    handle: 'fitness',
    description: 'Equipment and accessories for your fitness journey',
    sort_order: '6',
    products_count: 10,
  },
  {
    title: 'Home Organization',
    handle: 'home-organization',
    description: 'Smart storage solutions to keep your space tidy',
    sort_order: '7',
    products_count: 4,
  },
  {
    title: 'Trending Now',
    handle: 'trending',
    description: 'Hot products that customers are loving right now',
    sort_order: '0',
    products_count: 0, // Dynamic based on trending tag
  },
  {
    title: 'AI Picks',
    handle: 'ai-picks',
    description: 'Products handpicked by our AI for exceptional value',
    sort_order: '0',
    products_count: 0, // Dynamic based on ai-pick tag
  },
  {
    title: 'Best Sellers',
    handle: 'best-sellers',
    description: 'Our most popular products loved by customers',
    sort_order: '0',
    products_count: 0, // Dynamic based on bestseller tag
  },
];

/**
 * Default app settings
 */
export const DEFAULT_SETTINGS = [
  {
    key: 'profit_protection',
    value: {
      enabled: true,
      min_margin_percent: 20,
      auto_pause_below: 15,
      auto_kill_below: 10,
      check_interval_hours: 6,
    },
    description: 'Profit protection engine settings',
  },
  {
    key: 'ai_decisions',
    value: {
      auto_apply: false,
      confidence_threshold: 0.75,
      notification_email: null,
    },
    description: 'AI decision engine settings',
  },
  {
    key: 'sync_settings',
    value: {
      auto_sync_products: true,
      auto_sync_orders: true,
      sync_interval_minutes: 30,
    },
    description: 'Product and order sync settings',
  },
  {
    key: 'store_info',
    value: {
      name: 'Express Prime',
      currency: 'USD',
      timezone: 'America/New_York',
    },
    description: 'Store information',
  },
];

/**
 * Seeds collections to the database
 */
export async function seedCollections(): Promise<{ success: boolean; message: string; count?: number }> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return { success: false, message: 'Admin client not available. Set VITE_SUPABASE_SERVICE_ROLE_KEY.' };
  }

  try {
    const { data, error } = await adminClient
      .from('collections')
      .upsert(COLLECTIONS, { onConflict: 'handle' })
      .select();

    if (error) {
      return { success: false, message: `Error seeding collections: ${error.message}` };
    }

    return { success: true, message: `Successfully seeded ${data?.length || 0} collections!`, count: data?.length };
  } catch (err) {
    return { success: false, message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

/**
 * Seeds default app settings
 */
export async function seedAppSettings(): Promise<{ success: boolean; message: string }> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return { success: false, message: 'Admin client not available. Set VITE_SUPABASE_SERVICE_ROLE_KEY.' };
  }

  try {
    const { error } = await adminClient
      .from('global_settings')
      .upsert(DEFAULT_SETTINGS, { onConflict: 'key' });

    if (error) {
      return { success: false, message: `Error seeding settings: ${error.message}` };
    }

    return { success: true, message: 'Successfully seeded app settings!' };
  } catch (err) {
    return { success: false, message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

/**
 * Gets database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return {};
  }

  const tables = ['products', 'collections', 'orders', 'ai_decisions', 'sync_runs'];
  const stats: Record<string, number> = {};

  for (const table of tables) {
    const { count } = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: true });
    stats[table] = count || 0;
  }

  return stats;
}
