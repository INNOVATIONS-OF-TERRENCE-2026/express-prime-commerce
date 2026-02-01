-- =====================================================
-- COMPREHENSIVE SEED DATA MIGRATION
-- Seeds products, collections, global_settings, and performance_metrics
-- Run this after all schema migrations are applied
-- =====================================================

-- =====================================================
-- 1. GLOBAL SETTINGS
-- =====================================================

INSERT INTO global_settings (key, value, description) VALUES
('profit_protection', '{
  "minMarginPercent": 20,
  "maxRefundRatePercent": 10,
  "noSalesKillWindowDays": 14,
  "noSalesPauseWindowDays": 7,
  "rateLimitSafeMode": true,
  "autoApplyDecisions": false,
  "alertThresholds": {
    "lowStock": 5,
    "criticalStock": 2,
    "marginWarning": 25
  }
}'::jsonb, 'Profit protection thresholds and automatic product management rules'),

('ai_settings', '{
  "enabled": true,
  "confidenceThreshold": 0.7,
  "weightings": {
    "margin": 0.25,
    "velocity": 0.20,
    "engagement": 0.15,
    "refunds": 0.20,
    "inventory": 0.10,
    "freshness": 0.10
  },
  "decisionRules": {
    "promoteThreshold": 75,
    "suppressThreshold": 40
  },
  "analysisFrequency": "daily"
}'::jsonb, 'AI product intelligence configuration and scoring weights'),

('sync_settings', '{
  "autoSync": true,
  "syncInterval": 3600,
  "webhooksEnabled": true,
  "syncProducts": true,
  "syncOrders": true,
  "syncInventory": true,
  "syncCollections": true,
  "lastFullSync": null,
  "errorRetryAttempts": 3
}'::jsonb, 'Shopify sync configuration settings'),

('store_info', '{
  "name": "Express Prime",
  "domain": null,
  "currency": "USD",
  "timezone": "America/New_York",
  "supportEmail": "support@expressprime.com",
  "contactPhone": null,
  "socialLinks": {
    "instagram": null,
    "twitter": null,
    "facebook": null
  }
}'::jsonb, 'Store information and branding settings'),

('notification_settings', '{
  "emailAlerts": true,
  "slackWebhook": null,
  "alertTypes": {
    "lowStock": true,
    "highRefunds": true,
    "marginWarning": true,
    "syncErrors": true,
    "aiDecisions": true
  }
}'::jsonb, 'Notification and alerting preferences')

ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- =====================================================
-- 2. COLLECTIONS
-- =====================================================

INSERT INTO collections (id, title, handle, description, image_url, sort_order, products_count) VALUES
('c0000001-0000-0000-0000-000000000001'::uuid, 'Electronics', 'electronics', 'Latest gadgets and tech accessories for the modern lifestyle', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', 'best-selling', 15),
('c0000001-0000-0000-0000-000000000002'::uuid, 'Health & Wellness', 'health-wellness', 'Products to help you feel your best every day', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 'best-selling', 12),
('c0000001-0000-0000-0000-000000000003'::uuid, 'Home & Living', 'home-living', 'Transform your space with comfort and style', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', 'manual', 10),
('c0000001-0000-0000-0000-000000000004'::uuid, 'Kitchen Gadgets', 'kitchen-gadgets', 'Smart tools for the modern kitchen', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'manual', 11),
('c0000001-0000-0000-0000-000000000005'::uuid, 'Office', 'office', 'Boost productivity with ergonomic office essentials', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 'manual', 8),
('c0000001-0000-0000-0000-000000000006'::uuid, 'Fitness', 'fitness', 'Equipment and gear for your active lifestyle', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'best-selling', 9),
('c0000001-0000-0000-0000-000000000007'::uuid, 'Home Organization', 'home-organization', 'Declutter and organize with smart storage solutions', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'manual', 5),
('c0000001-0000-0000-0000-000000000008'::uuid, 'Trending Now', 'trending', 'Hot products flying off the shelves', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'best-selling', 20),
('c0000001-0000-0000-0000-000000000009'::uuid, 'AI Picks', 'ai-picks', 'Products recommended by our AI for maximum value', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800', 'alpha-desc', 15),
('c0000001-0000-0000-0000-000000000010'::uuid, 'Best Sellers', 'best-sellers', 'Our top performing products loved by customers', 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800', 'best-selling', 25)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  handle = EXCLUDED.handle,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  products_count = EXCLUDED.products_count,
  updated_at = now();

-- =====================================================
-- 3. PRODUCTS (75 Trending Products)
-- Using direct INSERT with ON CONFLICT for upsert
-- =====================================================

-- Electronics (15 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('wireless-bluetooth-earbuds-pro', 'Wireless Bluetooth Earbuds Pro', 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.', 'TechSound', 'Electronics', ARRAY['trending', 'bestseller', 'electronics', 'audio'], 79.99, 129.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 'active', 38.5, 150),
('smart-watch-fitness-tracker', 'Smart Watch Fitness Tracker', 'Advanced fitness tracking with heart rate monitor, GPS, sleep tracking, and 7-day battery life.', 'FitTech', 'Electronics', ARRAY['new', 'fitness', 'electronics', 'wearable'], 149.99, 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'active', 25.0, 85),
('portable-phone-charger-20000mah', 'Portable Phone Charger 20000mAh', 'High-capacity power bank with fast charging, dual USB ports, and LED display.', 'PowerUp', 'Electronics', ARRAY['bestseller', 'electronics', 'travel'], 39.99, 59.99, 'https://images.unsplash.com/photo-1609592806596-4e8d2de1c62b?w=800', 'active', 33.3, 200),
('led-desk-lamp-wireless-charger', 'LED Desk Lamp with Wireless Charger', 'Modern LED desk lamp with built-in wireless charging pad, adjustable brightness, and USB port.', 'LumiCharge', 'Electronics', ARRAY['new', 'ai-pick', 'electronics', 'office'], 49.99, 79.99, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'active', 37.5, 120),
('noise-cancelling-headphones', 'Noise Cancelling Over-Ear Headphones', 'Studio-quality sound with adaptive noise cancellation, 40-hour battery, and premium comfort.', 'AudioMax', 'Electronics', ARRAY['trending', 'electronics', 'audio', 'premium'], 199.99, 299.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'active', 33.3, 60),
('4k-webcam-streaming', '4K Webcam for Streaming', 'Ultra HD webcam with auto-focus, built-in ring light, and noise-cancelling microphone.', 'StreamPro', 'Electronics', ARRAY['new', 'electronics', 'office', 'streaming'], 89.99, 149.99, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800', 'active', 40.0, 75),
('wireless-mechanical-keyboard', 'Wireless Mechanical Keyboard', 'RGB backlit mechanical keyboard with hot-swappable switches and multi-device support.', 'KeyMaster', 'Electronics', ARRAY['trending', 'electronics', 'office', 'gaming'], 129.99, 179.99, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800', 'active', 27.8, 95),
('smart-home-hub-voice', 'Smart Home Hub with Voice Control', 'Central hub for all smart devices with voice assistant and touchscreen display.', 'SmartHome', 'Electronics', ARRAY['bestseller', 'smart-home', 'electronics'], 129.99, 199.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 35.0, 110),
('portable-bluetooth-speaker', 'Portable Bluetooth Speaker', 'Waterproof speaker with 360° sound, 24-hour battery, and built-in power bank.', 'SoundWave', 'Electronics', ARRAY['trending', 'electronics', 'audio', 'outdoor'], 59.99, 89.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 'active', 33.3, 180),
('wireless-earbuds-sport', 'Wireless Sport Earbuds', 'Secure-fit sport earbuds with IP67 waterproofing and 10-hour playtime.', 'FitSound', 'Electronics', ARRAY['fitness', 'electronics', 'audio'], 49.99, 79.99, 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800', 'active', 37.5, 140),
('usb-c-hub-multiport', 'USB-C Hub 10-in-1 Multiport', 'Universal hub with HDMI 4K, USB 3.0, SD card reader, and 100W power delivery.', 'TechHub', 'Electronics', ARRAY['ai-pick', 'electronics', 'office', 'travel'], 54.99, 79.99, 'https://images.unsplash.com/photo-1625723044792-44de16c38299?w=800', 'active', 31.3, 160),
('smart-doorbell-camera', 'Smart Video Doorbell Camera', 'HD video doorbell with motion detection, night vision, and two-way audio.', 'SecureHome', 'Electronics', ARRAY['trending', 'smart-home', 'security'], 119.99, 169.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 29.4, 70),
('wireless-charging-pad-3in1', '3-in-1 Wireless Charging Station', 'Charge phone, watch, and earbuds simultaneously with fast-charging support.', 'ChargeMaster', 'Electronics', ARRAY['bestseller', 'electronics', 'accessories'], 44.99, 69.99, 'https://images.unsplash.com/photo-1586953208270-767889fa9a0b?w=800', 'active', 35.7, 130),
('mini-projector-portable', 'Portable Mini Projector', 'Pocket-sized projector with 1080p support, built-in speaker, and 4-hour battery.', 'ProjectMax', 'Electronics', ARRAY['new', 'electronics', 'entertainment'], 159.99, 249.99, 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800', 'active', 36.0, 45),
('smart-light-bulbs-4pack', 'Smart WiFi Light Bulbs (4-Pack)', 'Color-changing LED bulbs with voice control and scheduling via app.', 'LumiSmart', 'Electronics', ARRAY['ai-pick', 'smart-home', 'electronics'], 34.99, 54.99, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800', 'active', 36.4, 200)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Health & Wellness (12 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('digital-body-weight-scale', 'Digital Body Weight Scale', 'Smart scale with body composition analysis, Bluetooth connectivity, and app integration.', 'HealthTrack', 'Health & Wellness', ARRAY['trending', 'health', 'fitness'], 34.99, 49.99, 'https://images.unsplash.com/photo-1576511552562-4d14e9a8df36?w=800', 'active', 30.0, 95),
('essential-oil-diffuser', 'Aromatherapy Essential Oil Diffuser', 'Ultrasonic diffuser with color-changing LED lights, auto shut-off, and whisper-quiet operation.', 'ZenHome', 'Health & Wellness', ARRAY['bestseller', 'wellness', 'home'], 29.99, 44.99, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 'active', 33.3, 180),
('massage-gun-deep-tissue', 'Deep Tissue Massage Gun', 'Professional-grade percussion massager with 6 heads, 30 speeds, and quiet motor technology.', 'RecoverPro', 'Health & Wellness', ARRAY['ai-pick', 'fitness', 'recovery'], 89.99, 149.99, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 'active', 40.0, 65),
('posture-corrector-back-support', 'Posture Corrector Back Support', 'Adjustable posture corrector for improved spine alignment, breathable material, and all-day comfort.', 'SpineAlign', 'Health & Wellness', ARRAY['new', 'health', 'office'], 24.99, 39.99, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 'active', 37.5, 110),
('foam-roller-muscle-recovery', 'High-Density Foam Roller', 'Professional foam roller for muscle recovery, trigger point therapy, and flexibility training.', 'FlexFit', 'Health & Wellness', ARRAY['fitness', 'recovery', 'bestseller'], 24.99, 34.99, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', 'active', 28.6, 150),
('sleep-sound-machine', 'White Noise Sleep Machine', '20 soothing sounds, timer settings, and memory function for better sleep.', 'SleepWell', 'Health & Wellness', ARRAY['trending', 'wellness', 'sleep'], 34.99, 49.99, 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800', 'active', 30.0, 85),
('resistance-bands-set', 'Resistance Bands Set (5 Levels)', 'Latex-free resistance bands with door anchor, handles, and carrying bag.', 'FitBands', 'Health & Wellness', ARRAY['fitness', 'home-gym', 'ai-pick'], 19.99, 34.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800', 'active', 42.9, 220),
('acupressure-mat-pillow', 'Acupressure Mat and Pillow Set', 'Therapeutic acupressure mat for pain relief, relaxation, and stress reduction.', 'ZenRelief', 'Health & Wellness', ARRAY['wellness', 'recovery', 'new'], 39.99, 59.99, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 'active', 33.3, 70),
('electric-heating-pad', 'Electric Heating Pad XL', 'Extra-large heating pad with 6 heat settings, auto shut-off, and machine-washable cover.', 'HeatComfort', 'Health & Wellness', ARRAY['health', 'pain-relief', 'bestseller'], 29.99, 44.99, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', 'active', 33.3, 100),
('vitamin-organizer-weekly', 'Weekly Pill Organizer', 'Large capacity pill organizer with AM/PM compartments and moisture-proof design.', 'HealthOrg', 'Health & Wellness', ARRAY['health', 'organization'], 14.99, 24.99, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', 'active', 40.0, 250),
('yoga-mat-premium', 'Premium Non-Slip Yoga Mat', '6mm thick eco-friendly yoga mat with alignment lines and carrying strap.', 'YogaLife', 'Health & Wellness', ARRAY['fitness', 'yoga', 'trending'], 34.99, 49.99, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 'active', 30.0, 130),
('meditation-cushion-set', 'Meditation Cushion Set', 'Buckwheat-filled zafu cushion with zabuton mat for comfortable meditation.', 'ZenMind', 'Health & Wellness', ARRAY['wellness', 'meditation', 'new'], 49.99, 79.99, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', 'active', 37.5, 55)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Home & Living (10 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('bamboo-bed-sheets-set', 'Bamboo Bed Sheets Set', 'Ultra-soft bamboo viscose sheets, temperature regulating, hypoallergenic, and eco-friendly.', 'SleepWell', 'Home & Living', ARRAY['trending', 'home', 'bedroom'], 69.99, 99.99, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'active', 30.0, 80),
('memory-foam-pillow-cooling', 'Memory Foam Pillow with Cooling Gel', 'Ergonomic contour design with cooling gel layer, removable washable cover, and neck support.', 'SleepWell', 'Home & Living', ARRAY['bestseller', 'home', 'sleep'], 44.99, 69.99, 'https://images.unsplash.com/photo-1592789705501-f9ae4278a9c9?w=800', 'active', 35.7, 120),
('smart-plug-wifi-outlet', 'Smart Plug WiFi Outlet (4-Pack)', 'Voice control compatible, energy monitoring, scheduling, and works with Alexa & Google Home.', 'SmartHome', 'Home & Living', ARRAY['ai-pick', 'smart-home', 'electronics'], 29.99, 49.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 40.0, 200),
('blackout-curtains-thermal', 'Blackout Curtains Thermal Insulated', '100% blackout curtains with thermal insulation, noise reduction, and energy saving.', 'HomeStyle', 'Home & Living', ARRAY['new', 'home', 'bedroom'], 34.99, 54.99, 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800', 'active', 36.4, 90),
('weighted-blanket-20lb', 'Weighted Blanket 20lb', 'Premium glass bead weighted blanket with cooling bamboo cover for anxiety relief.', 'CalmNest', 'Home & Living', ARRAY['trending', 'wellness', 'sleep', 'bestseller'], 79.99, 129.99, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'active', 38.5, 65),
('led-strip-lights-smart', 'Smart LED Strip Lights 32ft', 'Color-changing LED strips with app control, music sync, and voice compatibility.', 'LumiSmart', 'Home & Living', ARRAY['trending', 'smart-home', 'decor'], 24.99, 39.99, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800', 'active', 37.5, 175),
('throw-blanket-sherpa', 'Sherpa Fleece Throw Blanket', 'Ultra-soft reversible sherpa blanket, perfect for couch, bed, or outdoor use.', 'CozyHome', 'Home & Living', ARRAY['home', 'cozy', 'bestseller'], 29.99, 44.99, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 'active', 33.3, 150),
('shower-head-high-pressure', 'High Pressure Shower Head', 'Rainfall shower head with 6 spray modes, easy installation, and water-saving design.', 'AquaLux', 'Home & Living', ARRAY['bathroom', 'home', 'ai-pick'], 34.99, 54.99, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', 'active', 36.4, 110),
('mattress-topper-gel', 'Gel Memory Foam Mattress Topper', '3-inch cooling gel-infused memory foam topper with ventilated design.', 'SleepCloud', 'Home & Living', ARRAY['bedroom', 'sleep', 'trending'], 89.99, 149.99, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'active', 40.0, 50),
('cordless-vacuum-stick', 'Cordless Stick Vacuum', 'Lightweight cordless vacuum with HEPA filter, 45-min runtime, and wall mount.', 'CleanPro', 'Home & Living', ARRAY['home', 'cleaning', 'bestseller'], 149.99, 229.99, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800', 'active', 34.8, 70)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Kitchen Gadgets (11 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('air-fryer-digital-5qt', 'Digital Air Fryer 5 Quart', 'Healthy cooking with 8 preset programs, digital touchscreen, and dishwasher-safe basket.', 'KitchenPro', 'Kitchen Gadgets', ARRAY['trending', 'bestseller', 'kitchen'], 79.99, 119.99, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800', 'active', 33.3, 85),
('electric-kettle-temperature', 'Electric Kettle with Temperature Control', 'Variable temperature settings, keep warm function, fast boiling, and auto shut-off.', 'BrewMaster', 'Kitchen Gadgets', ARRAY['new', 'kitchen', 'coffee'], 44.99, 64.99, 'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=800', 'active', 30.8, 95),
('knife-set-stainless-steel', 'Professional Knife Set with Block', '15-piece stainless steel knife set with wooden block and built-in sharpener.', 'ChefEdge', 'Kitchen Gadgets', ARRAY['kitchen', 'bestseller', 'cooking'], 89.99, 149.99, 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800', 'active', 40.0, 60),
('instant-pot-duo', 'Multi-Use Pressure Cooker 6Qt', '7-in-1 programmable cooker: pressure cook, slow cook, rice, steam, saute, yogurt, and warm.', 'InstaCook', 'Kitchen Gadgets', ARRAY['trending', 'kitchen', 'meal-prep'], 79.99, 129.99, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', 'active', 38.5, 75),
('coffee-grinder-electric', 'Electric Coffee Grinder', 'Precision burr grinder with 15 settings for espresso to French press.', 'GrindMaster', 'Kitchen Gadgets', ARRAY['coffee', 'kitchen', 'ai-pick'], 49.99, 79.99, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800', 'active', 37.5, 110),
('blender-personal-portable', 'Portable Personal Blender', 'USB rechargeable blender with 6 blades, perfect for smoothies on the go.', 'BlendGo', 'Kitchen Gadgets', ARRAY['trending', 'kitchen', 'fitness'], 29.99, 49.99, 'https://images.unsplash.com/photo-1570222094714-4e3c3c5c5d0b?w=800', 'active', 40.0, 160),
('food-storage-containers', 'Glass Food Storage Containers (24pc)', 'Leak-proof glass containers with snap-lock lids, microwave and freezer safe.', 'FreshKeep', 'Kitchen Gadgets', ARRAY['kitchen', 'meal-prep', 'bestseller'], 39.99, 59.99, 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800', 'active', 33.3, 130),
('sous-vide-precision-cooker', 'Sous Vide Precision Cooker', 'WiFi-enabled sous vide with 1100W power, precise temperature control.', 'PrecisionChef', 'Kitchen Gadgets', ARRAY['cooking', 'kitchen', 'premium'], 99.99, 159.99, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', 'active', 37.5, 45),
('cutting-board-bamboo-set', 'Bamboo Cutting Board Set (3pc)', 'Eco-friendly bamboo boards with juice grooves and easy-grip handles.', 'EcoKitchen', 'Kitchen Gadgets', ARRAY['kitchen', 'eco-friendly', 'new'], 29.99, 44.99, 'https://images.unsplash.com/photo-1594228420014-1c91a5b5b1ce?w=800', 'active', 33.3, 180),
('milk-frother-electric', 'Electric Milk Frother', 'Automatic frother with hot/cold settings for lattes, cappuccinos, and more.', 'FrothMaster', 'Kitchen Gadgets', ARRAY['coffee', 'kitchen', 'trending'], 24.99, 39.99, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800', 'active', 37.5, 140),
('smart-meat-thermometer', 'Smart Wireless Meat Thermometer', 'Bluetooth thermometer with app alerts, dual probes, and preset temperatures.', 'GrillMaster', 'Kitchen Gadgets', ARRAY['cooking', 'kitchen', 'ai-pick'], 39.99, 64.99, 'https://images.unsplash.com/photo-1594228420014-1c91a5b5b1ce?w=800', 'active', 38.5, 90)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Office (8 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('standing-desk-converter', 'Standing Desk Converter', 'Height-adjustable desk converter with keyboard tray and monitor riser.', 'ErgoWorks', 'Office', ARRAY['office', 'ergonomic', 'trending'], 179.99, 279.99, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 'active', 35.7, 40),
('ergonomic-office-chair', 'Ergonomic Mesh Office Chair', 'Breathable mesh back, adjustable lumbar support, armrests, and headrest.', 'ComfortSeat', 'Office', ARRAY['office', 'ergonomic', 'bestseller'], 249.99, 399.99, 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800', 'active', 37.5, 30),
('monitor-stand-dual', 'Dual Monitor Stand', 'Gas spring dual monitor arm with cable management for screens up to 32".', 'DeskPro', 'Office', ARRAY['office', 'organization', 'ai-pick'], 69.99, 109.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 'active', 36.4, 65),
('desk-organizer-bamboo', 'Bamboo Desktop Organizer', 'Multi-compartment desk organizer with phone stand and pen holder.', 'EcoDesk', 'Office', ARRAY['office', 'organization', 'eco-friendly'], 29.99, 44.99, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'active', 33.3, 120),
('laptop-stand-aluminum', 'Aluminum Laptop Stand', 'Ergonomic laptop riser with ventilation, compatible with 10-17" laptops.', 'TechStand', 'Office', ARRAY['office', 'laptop', 'trending'], 39.99, 59.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 'active', 33.3, 95),
('desk-mat-leather', 'Premium Leather Desk Mat', 'Large waterproof desk pad with stitched edges, 31.5" x 15.7".', 'DeskLux', 'Office', ARRAY['office', 'premium', 'new'], 34.99, 54.99, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800', 'active', 36.4, 100),
('wireless-mouse-ergonomic', 'Ergonomic Vertical Mouse', 'Wireless vertical mouse reducing wrist strain with 6 buttons and adjustable DPI.', 'ErgoMouse', 'Office', ARRAY['office', 'ergonomic', 'electronics'], 29.99, 49.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', 'active', 40.0, 150),
('blue-light-glasses', 'Blue Light Blocking Glasses', 'Computer glasses reducing eye strain, anti-glare coating, lightweight frame.', 'EyeGuard', 'Office', ARRAY['office', 'health', 'bestseller'], 24.99, 39.99, 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800', 'active', 37.5, 200)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Fitness (9 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('adjustable-dumbbells-set', 'Adjustable Dumbbells Set', 'Quick-change weight system from 5-52.5 lbs per dumbbell with stand.', 'IronFlex', 'Fitness', ARRAY['fitness', 'home-gym', 'trending'], 299.99, 449.99, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'active', 33.3, 25),
('pull-up-bar-doorway', 'Doorway Pull-Up Bar', 'No-screw installation pull-up bar with multiple grip positions.', 'FitBar', 'Fitness', ARRAY['fitness', 'home-gym', 'bestseller'], 34.99, 54.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800', 'active', 36.4, 85),
('jump-rope-speed', 'Weighted Speed Jump Rope', 'Adjustable weighted rope with ball bearings for smooth rotation.', 'JumpFit', 'Fitness', ARRAY['fitness', 'cardio', 'ai-pick'], 19.99, 34.99, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 'active', 42.9, 180),
('kettlebell-adjustable', 'Adjustable Kettlebell', 'Space-saving adjustable kettlebell from 5-40 lbs with easy lock.', 'KettleFlex', 'Fitness', ARRAY['fitness', 'home-gym', 'new'], 129.99, 199.99, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 'active', 35.0, 50),
('exercise-ball-anti-burst', 'Anti-Burst Exercise Ball', '65cm stability ball with pump, perfect for core workouts and yoga.', 'BalanceFit', 'Fitness', ARRAY['fitness', 'yoga', 'core'], 24.99, 39.99, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 'active', 37.5, 120),
('ab-roller-wheel', 'Ab Roller Wheel Pro', 'Dual-wheel ab roller with knee pad and anti-slip handles.', 'CoreStrong', 'Fitness', ARRAY['fitness', 'core', 'trending'], 19.99, 34.99, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 'active', 42.9, 140),
('gym-bag-duffel', 'Gym Duffel Bag with Shoe Compartment', 'Water-resistant gym bag with wet pocket and adjustable strap.', 'FitGear', 'Fitness', ARRAY['fitness', 'bags', 'bestseller'], 39.99, 59.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 'active', 33.3, 90),
('workout-gloves-lifting', 'Weight Lifting Gloves', 'Padded palm workout gloves with wrist support and breathable mesh.', 'GripPro', 'Fitness', ARRAY['fitness', 'accessories', 'lifting'], 19.99, 29.99, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'active', 33.3, 160),
('smart-water-bottle', 'Smart Water Bottle with Reminder', 'LED temperature display, hydration reminder, and double-wall insulation.', 'HydroSmart', 'Fitness', ARRAY['fitness', 'hydration', 'ai-pick'], 34.99, 54.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800', 'active', 36.4, 110)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Home Organization (5 products)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('closet-organizer-system', 'Modular Closet Organizer System', 'Customizable closet shelving with hanging rods, shelves, and drawers.', 'SpaceSaver', 'Home Organization', ARRAY['organization', 'closet', 'trending'], 89.99, 149.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 40.0, 35),
('storage-bins-stackable', 'Stackable Storage Bins (6-Pack)', 'Clear plastic bins with lids, stackable design, and easy-grip handles.', 'OrganizeIt', 'Home Organization', ARRAY['organization', 'storage', 'bestseller'], 34.99, 54.99, 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800', 'active', 36.4, 120),
('drawer-dividers-bamboo', 'Bamboo Drawer Dividers (4-Pack)', 'Adjustable drawer organizers for kitchen, office, or dresser.', 'EcoOrganize', 'Home Organization', ARRAY['organization', 'eco-friendly', 'kitchen'], 24.99, 39.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 37.5, 150),
('over-door-organizer', 'Over-the-Door Storage Organizer', 'Multi-pocket organizer for bathroom, bedroom, or pantry storage.', 'DoorStore', 'Home Organization', ARRAY['organization', 'bathroom', 'new'], 19.99, 34.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 42.9, 100),
('vacuum-storage-bags', 'Vacuum Storage Bags (10-Pack)', 'Space-saving compression bags for clothes, bedding, and seasonal items.', 'SpacePack', 'Home Organization', ARRAY['organization', 'storage', 'ai-pick'], 29.99, 49.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'active', 40.0, 180)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- Additional trending products (5 more to reach 75 total)
INSERT INTO products (handle, title, description, vendor, product_type, tags, price, compare_at_price, image_url, status, margin_percent, inventory_quantity) VALUES
('pet-camera-treat-dispenser', 'Pet Camera with Treat Dispenser', 'HD camera with two-way audio, night vision, and remote treat tossing.', 'PetWatch', 'Electronics', ARRAY['pet', 'smart-home', 'trending'], 79.99, 129.99, 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800', 'active', 38.5, 55),
('sunrise-alarm-clock', 'Sunrise Simulation Alarm Clock', 'Wake-up light with gradual brightness, nature sounds, and FM radio.', 'WakeGlow', 'Home & Living', ARRAY['sleep', 'wellness', 'ai-pick'], 44.99, 69.99, 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800', 'active', 35.7, 75),
('car-phone-mount-wireless', 'Wireless Car Phone Mount Charger', 'Auto-clamping mount with 15W fast charging and air vent clip.', 'DriveCharge', 'Electronics', ARRAY['car', 'electronics', 'bestseller'], 39.99, 59.99, 'https://images.unsplash.com/photo-1609592806596-4e8d2de1c62b?w=800', 'active', 33.3, 130),
('indoor-herb-garden-kit', 'Indoor Herb Garden with LED', 'Hydroponic herb garden system with LED grow lights and auto-watering.', 'GrowSmart', 'Home & Living', ARRAY['garden', 'kitchen', 'new'], 69.99, 99.99, 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', 'active', 30.0, 60),
('travel-toiletry-bag', 'Hanging Travel Toiletry Bag', 'Water-resistant organizer with multiple compartments and hook.', 'TravelPro', 'Travel', ARRAY['travel', 'organization', 'bestseller'], 24.99, 39.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 'active', 37.5, 140)
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, vendor = EXCLUDED.vendor,
  product_type = EXCLUDED.product_type, tags = EXCLUDED.tags, price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price, image_url = EXCLUDED.image_url,
  status = EXCLUDED.status, margin_percent = EXCLUDED.margin_percent,
  inventory_quantity = EXCLUDED.inventory_quantity, updated_at = now();

-- =====================================================
-- 4. PERFORMANCE METRICS (Sample data for AI scoring)
-- Generate random but realistic metrics for products
-- =====================================================

-- Insert performance metrics for the first 30 products (simulate a month of data)
INSERT INTO performance_metrics (product_id, date, views, add_to_carts, orders_count, revenue, refund_count, refund_amount)
SELECT 
  p.id,
  CURRENT_DATE - (random() * 30)::int,
  (random() * 500 + 50)::int,  -- views: 50-550
  (random() * 50 + 5)::int,    -- add_to_carts: 5-55
  (random() * 20 + 1)::int,    -- orders: 1-21
  (random() * 2000 + 100)::decimal(10,2),  -- revenue: $100-$2100
  CASE WHEN random() > 0.7 THEN (random() * 3)::int ELSE 0 END,  -- 30% chance of refunds
  CASE WHEN random() > 0.7 THEN (random() * 150)::decimal(10,2) ELSE 0 END
FROM products p
WHERE p.status = 'active'
LIMIT 30
ON CONFLICT DO NOTHING;

-- Insert additional metrics records (multiple days per product for trends)
INSERT INTO performance_metrics (product_id, date, views, add_to_carts, orders_count, revenue, refund_count, refund_amount)
SELECT 
  p.id,
  CURRENT_DATE - 7 - (random() * 23)::int,
  (random() * 400 + 30)::int,
  (random() * 40 + 3)::int,
  (random() * 15 + 1)::int,
  (random() * 1500 + 50)::decimal(10,2),
  CASE WHEN random() > 0.8 THEN (random() * 2)::int ELSE 0 END,
  CASE WHEN random() > 0.8 THEN (random() * 100)::decimal(10,2) ELSE 0 END
FROM products p
WHERE p.status = 'active'
LIMIT 50
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. ADD MISSING RLS POLICIES AND CONSTRAINTS
-- =====================================================

-- Ensure collections have proper RLS policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collections" ON collections;
DROP POLICY IF EXISTS "Allow collection inserts" ON collections;
DROP POLICY IF EXISTS "Allow collection updates" ON collections;

CREATE POLICY "Anyone can view collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow collection inserts" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow collection updates" ON collections FOR UPDATE USING (true) WITH CHECK (true);

GRANT ALL ON collections TO anon;
GRANT ALL ON collections TO authenticated;

-- Ensure performance_metrics have proper RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view performance_metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Allow performance_metrics inserts" ON performance_metrics;

CREATE POLICY "Anyone can view performance_metrics" ON performance_metrics FOR SELECT USING (true);
CREATE POLICY "Allow performance_metrics inserts" ON performance_metrics FOR INSERT WITH CHECK (true);

GRANT ALL ON performance_metrics TO anon;
GRANT ALL ON performance_metrics TO authenticated;

-- =====================================================
-- 6. CREATE HELPER VIEWS FOR AI SCORING
-- =====================================================

-- Create or replace view for product analytics
CREATE OR REPLACE VIEW product_analytics AS
SELECT 
  p.id as product_id,
  p.title,
  p.handle,
  p.price,
  p.margin_percent,
  p.inventory_quantity,
  p.status,
  p.created_at,
  p.updated_at,
  COALESCE(SUM(pm.views), 0) as total_views,
  COALESCE(SUM(pm.add_to_carts), 0) as total_add_to_carts,
  COALESCE(SUM(pm.orders_count), 0) as total_orders,
  COALESCE(SUM(pm.revenue), 0) as total_revenue,
  COALESCE(SUM(pm.refund_count), 0) as total_refunds,
  COALESCE(SUM(pm.refund_amount), 0) as total_refund_amount,
  CASE 
    WHEN COALESCE(SUM(pm.orders_count), 0) > 0 
    THEN ROUND((COALESCE(SUM(pm.refund_count), 0)::decimal / SUM(pm.orders_count)) * 100, 2)
    ELSE 0 
  END as refund_rate_percent,
  CASE 
    WHEN COALESCE(SUM(pm.views), 0) > 0 
    THEN ROUND((COALESCE(SUM(pm.orders_count), 0)::decimal / SUM(pm.views)) * 100, 2)
    ELSE 0 
  END as conversion_rate_percent,
  MAX(pm.date) as last_metric_date
FROM products p
LEFT JOIN performance_metrics pm ON p.id = pm.product_id
GROUP BY p.id, p.title, p.handle, p.price, p.margin_percent, p.inventory_quantity, p.status, p.created_at, p.updated_at;

-- Grant access to the view
GRANT SELECT ON product_analytics TO anon;
GRANT SELECT ON product_analytics TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- Products: 75
-- Collections: 10  
-- Global Settings: 5
-- Performance Metrics: Sample data generated
-- =====================================================
