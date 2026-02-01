-- Seed products for Express Prime Commerce
-- This migration ensures products exist for all category pages to work

-- First, ensure we have proper RLS policies for public read access
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can read active products" ON products;
  DROP POLICY IF EXISTS "Service role has full access to products" ON products;
  
  -- Enable RLS on products
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  
  -- Public read access for active products
  CREATE POLICY "Public can read active products" ON products
    FOR SELECT
    USING (status = 'active');
  
  -- Service role full access
  CREATE POLICY "Service role has full access to products" ON products
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Insert seed products only if the table is empty or has few products
INSERT INTO products (
  id, title, description, handle, price, compare_at_price, cost, margin_percent,
  image_url, product_type, vendor, tags, inventory_quantity, status, created_at, updated_at
)
SELECT * FROM (VALUES
  -- Electronics & Smart Tech
  (
    gen_random_uuid(),
    'Smart Home Hub Pro',
    'Control all your smart devices from one central hub. Voice-activated with Alexa and Google Assistant compatibility. Features a 5-inch touchscreen display and supports Zigbee, Z-Wave, and WiFi protocols.',
    'smart-home-hub-pro',
    149.99,
    199.99,
    75.00,
    50.00,
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800',
    'Electronics',
    'Express Prime',
    ARRAY['trending', 'smart-home', 'ai-pick'],
    150,
    'active'::product_status,
    NOW() - INTERVAL '5 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wireless Earbuds Elite',
    'Premium true wireless earbuds with active noise cancellation. 32-hour battery life with charging case. IPX5 water resistant for workouts.',
    'wireless-earbuds-elite',
    89.99,
    129.99,
    35.00,
    61.11,
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
    'Electronics',
    'Express Prime',
    ARRAY['bestseller', 'electronics', 'new'],
    200,
    'active'::product_status,
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Ultra HD Webcam 4K',
    '4K Ultra HD webcam with autofocus and built-in ring light. Perfect for streaming, video calls, and content creation. Includes privacy cover and tripod mount.',
    'ultra-hd-webcam-4k',
    79.99,
    99.99,
    32.00,
    60.01,
    'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800',
    'Electronics',
    'Express Prime',
    ARRAY['trending', 'office', 'electronics'],
    75,
    'active'::product_status,
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Smart Watch Fitness Pro',
    'Advanced fitness tracking with heart rate monitor, GPS, and sleep analysis. 7-day battery life. Water resistant to 50 meters. Compatible with iOS and Android.',
    'smart-watch-fitness-pro',
    199.99,
    279.99,
    85.00,
    57.50,
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
    'Electronics',
    'Express Prime',
    ARRAY['bestseller', 'fitness', 'smart-tech', 'ai-pick'],
    120,
    'active'::product_status,
    NOW() - INTERVAL '2 days',
    NOW()
  ),

  -- Health & Wellness
  (
    gen_random_uuid(),
    'Air Purifier HEPA Max',
    'Medical-grade HEPA H13 filter removes 99.97% of airborne particles. Covers up to 1200 sq ft. Smart air quality sensor with auto mode. Whisper-quiet operation.',
    'air-purifier-hepa-max',
    249.99,
    329.99,
    110.00,
    56.00,
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    'Health & Wellness',
    'Express Prime',
    ARRAY['trending', 'health', 'home', 'ai-pick'],
    85,
    'active'::product_status,
    NOW() - INTERVAL '4 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Massage Gun Professional',
    'Deep tissue percussion massager with 6 speed settings and 4 interchangeable heads. Quiet brushless motor. 6-hour battery life. Perfect for post-workout recovery.',
    'massage-gun-professional',
    129.99,
    179.99,
    55.00,
    57.69,
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'Health & Wellness',
    'Express Prime',
    ARRAY['bestseller', 'fitness', 'health'],
    200,
    'active'::product_status,
    NOW() - INTERVAL '6 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Smart Body Scale Pro',
    'Advanced body composition analyzer measuring weight, BMI, body fat, muscle mass, and more. Syncs with Apple Health and Google Fit. Supports up to 8 user profiles.',
    'smart-body-scale-pro',
    49.99,
    79.99,
    18.00,
    64.01,
    'https://images.unsplash.com/photo-1576511361333-f2cd189ca0d5?w=800',
    'Health & Wellness',
    'Express Prime',
    ARRAY['new', 'fitness', 'health', 'smart-tech'],
    300,
    'active'::product_status,
    NOW() - INTERVAL '1 day',
    NOW()
  ),

  -- Home & Living
  (
    gen_random_uuid(),
    'Smart LED Light Strip Kit',
    '16.4ft RGB LED light strip with music sync and app control. 16 million colors with scene modes. Works with Alexa and Google Home. Easy peel-and-stick installation.',
    'smart-led-light-strip-kit',
    34.99,
    49.99,
    12.00,
    65.70,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'Home & Living',
    'Express Prime',
    ARRAY['trending', 'smart-home', 'home'],
    500,
    'active'::product_status,
    NOW() - INTERVAL '8 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Bamboo Desk Organizer Set',
    'Premium bamboo desk organizer with 6 compartments. Includes phone holder, pen cups, and mail sorter. Eco-friendly and sustainable. Perfect for home office.',
    'bamboo-desk-organizer-set',
    39.99,
    59.99,
    15.00,
    62.49,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
    'Home & Living',
    'Express Prime',
    ARRAY['new', 'office', 'home', 'eco-friendly'],
    180,
    'active'::product_status,
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Aromatherapy Diffuser Deluxe',
    'Ultrasonic essential oil diffuser with 7 LED color options. 500ml capacity runs up to 12 hours. Timer settings and auto shut-off. Creates a spa-like atmosphere.',
    'aromatherapy-diffuser-deluxe',
    44.99,
    64.99,
    16.00,
    64.44,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
    'Home & Living',
    'Express Prime',
    ARRAY['bestseller', 'wellness', 'home', 'ai-pick'],
    250,
    'active'::product_status,
    NOW() - INTERVAL '5 days',
    NOW()
  ),

  -- Kitchen Gadgets
  (
    gen_random_uuid(),
    'Smart Coffee Maker WiFi',
    'Programmable 12-cup coffee maker with WiFi connectivity. Schedule brews from your phone. Built-in grinder option. Brew strength control from mild to bold.',
    'smart-coffee-maker-wifi',
    119.99,
    159.99,
    52.00,
    56.67,
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'Kitchen Gadgets',
    'Express Prime',
    ARRAY['trending', 'smart-home', 'kitchen', 'ai-pick'],
    95,
    'active'::product_status,
    NOW() - INTERVAL '4 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Digital Food Scale Pro',
    'Precision kitchen scale with 0.1g accuracy. Nutritional data for 1000+ foods. Connects to fitness apps. Tare function and easy-clean surface.',
    'digital-food-scale-pro',
    29.99,
    44.99,
    10.00,
    66.66,
    'https://images.unsplash.com/photo-1606115915090-be18fea23ec7?w=800',
    'Kitchen Gadgets',
    'Express Prime',
    ARRAY['new', 'kitchen', 'fitness'],
    400,
    'active'::product_status,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Electric Spice Grinder Set',
    'One-touch electric grinder with 2 removable grinding cups. Perfect for coffee beans, spices, nuts, and herbs. Stainless steel blades for fine grinding.',
    'electric-spice-grinder-set',
    34.99,
    49.99,
    14.00,
    60.00,
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
    'Kitchen Gadgets',
    'Express Prime',
    ARRAY['bestseller', 'kitchen'],
    220,
    'active'::product_status,
    NOW() - INTERVAL '9 days',
    NOW()
  ),

  -- Office Accessories
  (
    gen_random_uuid(),
    'Ergonomic Laptop Stand',
    'Adjustable aluminum laptop stand with 6 height levels. Improves posture and reduces neck strain. Compatible with laptops 10-17 inches. Foldable and portable.',
    'ergonomic-laptop-stand',
    49.99,
    69.99,
    18.00,
    63.99,
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    'Office Accessories',
    'Express Prime',
    ARRAY['trending', 'office', 'ergonomic'],
    175,
    'active'::product_status,
    NOW() - INTERVAL '6 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wireless Charging Desk Mat',
    'Large desk mat with built-in wireless charger. PU leather surface with anti-slip base. 80x40cm size. Charges through most phone cases up to 8mm thick.',
    'wireless-charging-desk-mat',
    59.99,
    89.99,
    25.00,
    58.33,
    'https://images.unsplash.com/photo-1586953208270-767889fa9b5f?w=800',
    'Office Accessories',
    'Express Prime',
    ARRAY['new', 'office', 'smart-tech', 'ai-pick'],
    130,
    'active'::product_status,
    NOW() - INTERVAL '1 day',
    NOW()
  ),

  -- Fitness
  (
    gen_random_uuid(),
    'Resistance Bands Pro Set',
    'Complete set of 5 resistance bands with different tension levels. Includes door anchor, handles, and ankle straps. Perfect for home workouts and physical therapy.',
    'resistance-bands-pro-set',
    29.99,
    44.99,
    9.00,
    70.00,
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800',
    'Fitness',
    'Express Prime',
    ARRAY['bestseller', 'fitness', 'home-workout'],
    450,
    'active'::product_status,
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Smart Jump Rope Counter',
    'Digital jump rope with LCD counter and calorie tracker. Adjustable length for all heights. Ball bearing system for smooth rotation. Weighted handles for arm workout.',
    'smart-jump-rope-counter',
    24.99,
    39.99,
    8.00,
    68.00,
    'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800',
    'Fitness',
    'Express Prime',
    ARRAY['trending', 'fitness', 'cardio'],
    320,
    'active'::product_status,
    NOW() - INTERVAL '5 days',
    NOW()
  ),

  -- Home Organization
  (
    gen_random_uuid(),
    'Vacuum Storage Bags Jumbo',
    'Set of 8 jumbo vacuum storage bags with hand pump. Reduces storage space by 80%. Ideal for bedding, clothes, and seasonal items. Reusable and airtight seal.',
    'vacuum-storage-bags-jumbo',
    24.99,
    34.99,
    7.00,
    72.00,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'Home Organization',
    'Express Prime',
    ARRAY['bestseller', 'home', 'organization'],
    500,
    'active'::product_status,
    NOW() - INTERVAL '10 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    'Drawer Organizer Set',
    'Modular drawer organizer system with 8 adjustable dividers. Fits most standard drawers. Durable BPA-free plastic. Perfect for kitchen, office, or bathroom.',
    'drawer-organizer-set',
    19.99,
    29.99,
    6.00,
    70.00,
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'Home Organization',
    'Express Prime',
    ARRAY['new', 'home', 'organization'],
    350,
    'active'::product_status,
    NOW() - INTERVAL '2 days',
    NOW()
  ),

  -- Computer Accessories  
  (
    gen_random_uuid(),
    'USB-C Hub 10-in-1',
    'Premium USB-C hub with 4K HDMI, 3 USB-A ports, SD card reader, ethernet, and 100W power delivery. Aluminum body with braided cable. Compatible with all USB-C laptops.',
    'usb-c-hub-10-in-1',
    54.99,
    79.99,
    22.00,
    60.00,
    'https://images.unsplash.com/photo-1625723044792-44de16b0c3cc?w=800',
    'Computer Accessories',
    'Express Prime',
    ARRAY['trending', 'tech', 'office', 'ai-pick'],
    200,
    'active'::product_status,
    NOW() - INTERVAL '3 days',
    NOW()
  )
) AS v(id, title, description, handle, price, compare_at_price, cost, margin_percent, 
       image_url, product_type, vendor, tags, inventory_quantity, status, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE status = 'active' LIMIT 1);

-- Update category mapping in case product_type doesn't exactly match
-- This ensures the CollectionsPage category filter works
UPDATE products 
SET product_type = 'Electronics'
WHERE product_type ILIKE '%electronic%' OR product_type ILIKE '%smart tech%';

UPDATE products
SET product_type = 'Health & Wellness'  
WHERE product_type ILIKE '%health%' OR product_type ILIKE '%wellness%';
