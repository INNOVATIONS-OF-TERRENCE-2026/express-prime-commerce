/**
 * Product Seeding Utility
 * Populates the products table with sample data for development and testing
 */

import { supabase } from '@/integrations/supabase/client';

export interface SeedProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  vendor: string;
  product_type: string;
  tags: string[];
  image_url: string;
  status: 'active' | 'paused' | 'killed' | 'draft';
}

export const SEED_PRODUCTS: SeedProduct[] = [
  // Electronics - 4 products
  {
    id: 'seed-001',
    handle: 'wireless-bluetooth-earbuds-pro',
    title: 'Wireless Bluetooth Earbuds Pro',
    description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.',
    price: 79.99,
    compare_at_price: 129.99,
    vendor: 'TechSound',
    product_type: 'Electronics',
    tags: ['trending', 'bestseller', 'electronics', 'audio'],
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-002',
    handle: 'smart-watch-fitness-tracker',
    title: 'Smart Watch Fitness Tracker',
    description: 'Advanced fitness tracking with heart rate monitor, GPS, sleep tracking, and 7-day battery life.',
    price: 149.99,
    compare_at_price: 199.99,
    vendor: 'FitTech',
    product_type: 'Electronics',
    tags: ['new', 'fitness', 'electronics', 'wearable'],
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-003',
    handle: 'portable-phone-charger-20000mah',
    title: 'Portable Phone Charger 20000mAh',
    description: 'High-capacity power bank with fast charging, dual USB ports, and LED display.',
    price: 39.99,
    compare_at_price: 59.99,
    vendor: 'PowerUp',
    product_type: 'Electronics',
    tags: ['bestseller', 'electronics', 'travel'],
    image_url: 'https://images.unsplash.com/photo-1609592806596-4e8d2de1c62b?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-004',
    handle: 'led-desk-lamp-wireless-charger',
    title: 'LED Desk Lamp with Wireless Charger',
    description: 'Modern LED desk lamp with built-in wireless charging pad, adjustable brightness, and USB port.',
    price: 49.99,
    compare_at_price: 79.99,
    vendor: 'LumiCharge',
    product_type: 'Electronics',
    tags: ['new', 'ai-pick', 'electronics', 'office'],
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
    status: 'active',
  },

  // Health & Wellness - 4 products
  {
    id: 'seed-005',
    handle: 'digital-body-weight-scale',
    title: 'Digital Body Weight Scale',
    description: 'Smart scale with body composition analysis, Bluetooth connectivity, and app integration.',
    price: 34.99,
    compare_at_price: 49.99,
    vendor: 'HealthTrack',
    product_type: 'Health & Wellness',
    tags: ['trending', 'health', 'fitness'],
    image_url: 'https://images.unsplash.com/photo-1576511552562-4d14e9a8df36?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-006',
    handle: 'essential-oil-diffuser',
    title: 'Aromatherapy Essential Oil Diffuser',
    description: 'Ultrasonic diffuser with color-changing LED lights, auto shut-off, and whisper-quiet operation.',
    price: 29.99,
    compare_at_price: 44.99,
    vendor: 'ZenHome',
    product_type: 'Health & Wellness',
    tags: ['bestseller', 'wellness', 'home'],
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-007',
    handle: 'massage-gun-deep-tissue',
    title: 'Deep Tissue Massage Gun',
    description: 'Professional-grade percussion massager with 6 heads, 30 speeds, and quiet motor technology.',
    price: 89.99,
    compare_at_price: 149.99,
    vendor: 'RecoverPro',
    product_type: 'Health & Wellness',
    tags: ['ai-pick', 'fitness', 'recovery'],
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-008',
    handle: 'posture-corrector-back-support',
    title: 'Posture Corrector Back Support',
    description: 'Adjustable posture corrector for improved spine alignment, breathable material, and all-day comfort.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'SpineAlign',
    product_type: 'Health & Wellness',
    tags: ['new', 'health', 'office'],
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop',
    status: 'active',
  },

  // Home & Living - 4 products
  {
    id: 'seed-009',
    handle: 'bamboo-bed-sheets-set',
    title: 'Bamboo Bed Sheets Set',
    description: 'Ultra-soft bamboo viscose sheets, temperature regulating, hypoallergenic, and eco-friendly.',
    price: 69.99,
    compare_at_price: 99.99,
    vendor: 'SleepWell',
    product_type: 'Home & Living',
    tags: ['trending', 'home', 'bedroom'],
    image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-010',
    handle: 'memory-foam-pillow-cooling',
    title: 'Memory Foam Pillow with Cooling Gel',
    description: 'Ergonomic contour design with cooling gel layer, removable washable cover, and neck support.',
    price: 44.99,
    compare_at_price: 69.99,
    vendor: 'SleepWell',
    product_type: 'Home & Living',
    tags: ['bestseller', 'home', 'sleep'],
    image_url: 'https://images.unsplash.com/photo-1592789705501-f9ae4278a9c9?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-011',
    handle: 'smart-plug-wifi-outlet',
    title: 'Smart Plug WiFi Outlet (4-Pack)',
    description: 'Voice control compatible, energy monitoring, scheduling, and works with Alexa & Google Home.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'SmartHome',
    product_type: 'Home & Living',
    tags: ['ai-pick', 'smart-home', 'electronics'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-012',
    handle: 'blackout-curtains-thermal',
    title: 'Blackout Curtains Thermal Insulated',
    description: '100% blackout curtains with thermal insulation, noise reduction, and energy saving.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'HomeStyle',
    product_type: 'Home & Living',
    tags: ['new', 'home', 'bedroom'],
    image_url: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&auto=format&fit=crop',
    status: 'active',
  },

  // Kitchen Gadgets - 4 products
  {
    id: 'seed-013',
    handle: 'air-fryer-digital-5qt',
    title: 'Digital Air Fryer 5 Quart',
    description: 'Healthy cooking with 8 preset programs, digital touchscreen, and dishwasher-safe basket.',
    price: 79.99,
    compare_at_price: 119.99,
    vendor: 'KitchenPro',
    product_type: 'Kitchen Gadgets',
    tags: ['trending', 'bestseller', 'kitchen'],
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-014',
    handle: 'electric-kettle-temperature',
    title: 'Electric Kettle with Temperature Control',
    description: 'Variable temperature settings, keep warm function, fast boiling, and auto shut-off.',
    price: 44.99,
    compare_at_price: 64.99,
    vendor: 'BrewMaster',
    product_type: 'Kitchen Gadgets',
    tags: ['new', 'kitchen', 'coffee'],
    image_url: 'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-015',
    handle: 'knife-set-stainless-steel',
    title: 'Professional Knife Set with Block',
    description: 'High-carbon stainless steel, ergonomic handles, includes 15 pieces with wooden block.',
    price: 89.99,
    compare_at_price: 149.99,
    vendor: 'ChefCraft',
    product_type: 'Kitchen Gadgets',
    tags: ['ai-pick', 'kitchen', 'cooking'],
    image_url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-016',
    handle: 'instant-pot-pressure-cooker',
    title: 'Multi-Function Pressure Cooker',
    description: '7-in-1 programmable cooker: pressure cook, slow cook, rice, steam, sauté, yogurt maker.',
    price: 99.99,
    compare_at_price: 149.99,
    vendor: 'CookSmart',
    product_type: 'Kitchen Gadgets',
    tags: ['bestseller', 'kitchen', 'appliance'],
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop',
    status: 'active',
  },

  // Office Accessories - 2 products
  {
    id: 'seed-017',
    handle: 'standing-desk-converter',
    title: 'Standing Desk Converter',
    description: 'Height adjustable sit-stand workstation, dual monitor support, and spacious keyboard tray.',
    price: 179.99,
    compare_at_price: 249.99,
    vendor: 'ErgoWork',
    product_type: 'Office Accessories',
    tags: ['trending', 'office', 'ergonomic'],
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-018',
    handle: 'ergonomic-mouse-vertical',
    title: 'Ergonomic Vertical Mouse',
    description: 'Wireless vertical design, reduces wrist strain, 6 buttons, adjustable DPI.',
    price: 29.99,
    compare_at_price: 44.99,
    vendor: 'ErgoTech',
    product_type: 'Office Accessories',
    tags: ['new', 'office', 'computer'],
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop',
    status: 'active',
  },

  // Fitness - 2 products
  {
    id: 'seed-019',
    handle: 'resistance-bands-set',
    title: 'Resistance Bands Set (5 Pack)',
    description: 'Latex-free bands with 5 resistance levels, door anchor, handles, and carry bag.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'FitGear',
    product_type: 'Fitness',
    tags: ['bestseller', 'fitness', 'exercise'],
    image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    id: 'seed-020',
    handle: 'yoga-mat-premium-thick',
    title: 'Premium Yoga Mat Extra Thick',
    description: 'Non-slip surface, eco-friendly TPE material, alignment lines, includes carry strap.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'YogaLife',
    product_type: 'Fitness',
    tags: ['ai-pick', 'fitness', 'yoga'],
    image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop',
    status: 'active',
  },
];

/**
 * Seeds the products table with sample data
 * @returns Promise with success/error information
 */
export async function seedProducts(): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // First, check if products already exist
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return { success: false, message: `Error checking existing products: ${countError.message}` };
    }

    if (count && count > 0) {
      return { success: true, message: `Products table already has ${count} products. Skipping seed.`, count };
    }

    // Insert seed products
    const { data, error } = await supabase
      .from('products')
      .insert(SEED_PRODUCTS)
      .select();

    if (error) {
      return { success: false, message: `Error seeding products: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Successfully seeded ${data?.length || 0} products!`, 
      count: data?.length || 0 
    };
  } catch (err) {
    return { 
      success: false, 
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
}

/**
 * Clears all products from the table (use with caution!)
 */
export async function clearProducts(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .neq('id', ''); // Delete all rows

    if (error) {
      return { success: false, message: `Error clearing products: ${error.message}` };
    }

    return { success: true, message: 'All products cleared successfully' };
  } catch (err) {
    return { 
      success: false, 
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
}

/**
 * Reseeds the products table (clear + seed)
 */
export async function reseedProducts(): Promise<{ success: boolean; message: string; count?: number }> {
  const clearResult = await clearProducts();
  if (!clearResult.success) {
    return clearResult;
  }

  return await seedProducts();
}
