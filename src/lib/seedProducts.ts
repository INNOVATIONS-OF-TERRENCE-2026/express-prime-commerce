/**
 * Product Seeding Utility
 * Populates the products table with sample data for development and testing
 * Uses Edge Function to bypass RLS policies
 */

import { supabase } from '@/integrations/supabase/client';

export interface SeedProduct {
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
  
  // Additional Electronics - 10 more trending products
  {
    handle: 'wireless-gaming-headset',
    title: 'Wireless Gaming Headset 7.1 Surround',
    description: 'RGB lighting, noise-canceling mic, 50mm drivers, 20-hour battery, ultra-comfortable.',
    price: 69.99,
    compare_at_price: 99.99,
    vendor: 'GamePro',
    product_type: 'Electronics',
    tags: ['trending', 'gaming', 'electronics', 'audio'],
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'mini-projector-portable',
    title: 'Mini Portable Projector 1080P',
    description: 'Pocket-sized home theater, WiFi & Bluetooth, HDMI, 100" display, built-in speaker.',
    price: 129.99,
    compare_at_price: 199.99,
    vendor: 'ViewMax',
    product_type: 'Electronics',
    tags: ['new', 'bestseller', 'electronics', 'entertainment'],
    image_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'mechanical-keyboard-rgb',
    title: 'Mechanical Gaming Keyboard RGB',
    description: 'Hot-swappable switches, per-key RGB, aluminum frame, USB-C, N-key rollover.',
    price: 79.99,
    compare_at_price: 119.99,
    vendor: 'KeyMaster',
    product_type: 'Electronics',
    tags: ['trending', 'gaming', 'electronics', 'computer'],
    image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'webcam-4k-autofocus',
    title: '4K Webcam with Auto Focus',
    description: 'Ultra HD streaming, auto light correction, dual mics, privacy cover, tripod mount.',
    price: 89.99,
    compare_at_price: 129.99,
    vendor: 'StreamPro',
    product_type: 'Electronics',
    tags: ['bestseller', 'office', 'electronics', 'streaming'],
    image_url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'ring-light-led-10inch',
    title: 'LED Ring Light 10" with Stand',
    description: '3 light modes, 10 brightness levels, phone holder, perfect for streaming & selfies.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'LightPro',
    product_type: 'Electronics',
    tags: ['trending', 'streaming', 'electronics', 'photography'],
    image_url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'action-camera-4k-waterproof',
    title: 'Action Camera 4K Waterproof',
    description: '170° wide angle, EIS stabilization, 30M waterproof, WiFi, includes mounting kit.',
    price: 59.99,
    compare_at_price: 89.99,
    vendor: 'AdventureCam',
    product_type: 'Electronics',
    tags: ['new', 'sports', 'electronics', 'camera'],
    image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'bluetooth-speaker-waterproof',
    title: 'Bluetooth Speaker Waterproof IPX7',
    description: '360° surround sound, 24-hour battery, floats in water, dustproof, LED lights.',
    price: 44.99,
    compare_at_price: 69.99,
    vendor: 'SoundWave',
    product_type: 'Electronics',
    tags: ['bestseller', 'audio', 'electronics', 'outdoor'],
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'car-phone-mount-wireless',
    title: 'Car Phone Mount Wireless Charger',
    description: 'Auto-clamping, 15W fast charge, air vent mount, compatible with all phones.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'AutoTech',
    product_type: 'Electronics',
    tags: ['trending', 'car', 'electronics', 'phone'],
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'tablet-stand-adjustable',
    title: 'Adjustable Tablet Stand Aluminum',
    description: 'Multi-angle, foldable, compatible with 4-13" devices, anti-slip pads, portable.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'StandPro',
    product_type: 'Electronics',
    tags: ['new', 'office', 'electronics', 'accessory'],
    image_url: 'https://images.unsplash.com/photo-1527698266440-12104e498b76?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'usb-hub-7port',
    title: 'USB Hub 7-Port USB 3.0',
    description: 'High-speed data transfer, individual power switches, aluminum body, cable management.',
    price: 29.99,
    compare_at_price: 44.99,
    vendor: 'DataLink',
    product_type: 'Electronics',
    tags: ['bestseller', 'office', 'electronics', 'computer'],
    image_url: 'https://images.unsplash.com/photo-1625723044792-44de16bec85a?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Additional Health & Wellness - 8 more products
  {
    handle: 'foam-roller-deep-tissue',
    title: 'Foam Roller Deep Tissue Massage',
    description: 'High-density EVA foam, textured surface, ideal for muscle recovery, 18" length.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'RecoverPro',
    product_type: 'Health & Wellness',
    tags: ['trending', 'fitness', 'recovery', 'health'],
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'electric-toothbrush-sonic',
    title: 'Sonic Electric Toothbrush',
    description: '5 cleaning modes, 2-minute timer, 30-day battery, 4 brush heads included, waterproof.',
    price: 39.99,
    compare_at_price: 69.99,
    vendor: 'OralCare',
    product_type: 'Health & Wellness',
    tags: ['bestseller', 'dental', 'health', 'personal-care'],
    image_url: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'acupressure-mat-set',
    title: 'Acupressure Mat and Pillow Set',
    description: 'Thousands of pressure points, stress relief, improves circulation, carrying bag included.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'ZenWellness',
    product_type: 'Health & Wellness',
    tags: ['new', 'ai-pick', 'wellness', 'relaxation'],
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'air-purifier-hepa',
    title: 'HEPA Air Purifier for Home',
    description: 'True HEPA filter, covers 500 sq ft, quiet operation, night mode, air quality indicator.',
    price: 89.99,
    compare_at_price: 139.99,
    vendor: 'PureAir',
    product_type: 'Health & Wellness',
    tags: ['trending', 'home', 'health', 'air-quality'],
    image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'sleep-mask-bluetooth',
    title: 'Bluetooth Sleep Mask with Speakers',
    description: 'Ultra-soft memory foam, built-in headphones, 10-hour battery, washable, travel pouch.',
    price: 29.99,
    compare_at_price: 44.99,
    vendor: 'SleepTech',
    product_type: 'Health & Wellness',
    tags: ['new', 'sleep', 'health', 'travel'],
    image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'neck-massager-shiatsu',
    title: 'Shiatsu Neck & Back Massager',
    description: '8 massage nodes, heat function, 3 intensity levels, car adapter included, portable.',
    price: 49.99,
    compare_at_price: 79.99,
    vendor: 'RelaxPro',
    product_type: 'Health & Wellness',
    tags: ['bestseller', 'massage', 'health', 'relaxation'],
    image_url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'water-bottle-smart',
    title: 'Smart Water Bottle with LED Temp',
    description: 'Vacuum insulated, LED temperature display, keeps drinks hot 12h/cold 24h, 17oz.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'HydroSmart',
    product_type: 'Health & Wellness',
    tags: ['trending', 'fitness', 'health', 'hydration'],
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'humidifier-cool-mist',
    title: 'Cool Mist Humidifier 4L',
    description: 'Quiet ultrasonic, 40-hour runtime, auto shut-off, essential oil tray, night light.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'AirComfort',
    product_type: 'Health & Wellness',
    tags: ['new', 'home', 'health', 'air-quality'],
    image_url: 'https://images.unsplash.com/photo-1585155770913-4e3e53170073?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Additional Home & Living - 10 more products
  {
    handle: 'led-strip-lights-smart',
    title: 'Smart LED Strip Lights 32.8ft',
    description: 'WiFi & app control, music sync, 16M colors, voice control, cuttable, adhesive back.',
    price: 24.99,
    compare_at_price: 44.99,
    vendor: 'LightMaster',
    product_type: 'Home & Living',
    tags: ['bestseller', 'lighting', 'home', 'smart-home'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'robot-vacuum-smart',
    title: 'Smart Robot Vacuum Cleaner',
    description: 'Auto-charging, app control, 2000Pa suction, works with Alexa, anti-drop sensors.',
    price: 199.99,
    compare_at_price: 299.99,
    vendor: 'CleanBot',
    product_type: 'Home & Living',
    tags: ['trending', 'ai-pick', 'home', 'cleaning'],
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'weighted-blanket-cooling',
    title: 'Cooling Weighted Blanket 15lbs',
    description: 'Bamboo viscose cover, glass beads, 60x80", reduces anxiety, machine washable.',
    price: 59.99,
    compare_at_price: 89.99,
    vendor: 'SleepWell',
    product_type: 'Home & Living',
    tags: ['bestseller', 'sleep', 'home', 'wellness'],
    image_url: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'shower-head-high-pressure',
    title: 'High Pressure Shower Head',
    description: '6 spray settings, handheld with 60" hose, easy install, chrome finish, water saving.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'AquaFlow',
    product_type: 'Home & Living',
    tags: ['trending', 'bathroom', 'home', 'upgrade'],
    image_url: 'https://images.unsplash.com/photo-1564540583246-934409427776?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'motion-sensor-lights',
    title: 'Motion Sensor LED Lights 3-Pack',
    description: 'Battery powered, stick anywhere, auto on/off, 120° detection, perfect for closets.',
    price: 19.99,
    compare_at_price: 29.99,
    vendor: 'LightSense',
    product_type: 'Home & Living',
    tags: ['new', 'lighting', 'home', 'convenience'],
    image_url: 'https://images.unsplash.com/photo-1495433324511-bf8e92934d90?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'electric-blanket-heated',
    title: 'Electric Heated Blanket Queen',
    description: '10 heat settings, auto shut-off, dual controls, machine washable, soft fleece.',
    price: 49.99,
    compare_at_price: 79.99,
    vendor: 'WarmNest',
    product_type: 'Home & Living',
    tags: ['trending', 'bedroom', 'home', 'comfort'],
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'door-camera-video',
    title: 'Video Doorbell Camera WiFi',
    description: '1080P HD, night vision, 2-way audio, motion alerts, cloud storage, easy install.',
    price: 69.99,
    compare_at_price: 99.99,
    vendor: 'SecureHome',
    product_type: 'Home & Living',
    tags: ['bestseller', 'security', 'home', 'smart-home'],
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'storage-ottoman-bench',
    title: 'Storage Ottoman Bench',
    description: 'Faux leather, 30" long, hidden storage, supports 300lbs, folds flat, versatile.',
    price: 44.99,
    compare_at_price: 69.99,
    vendor: 'HomeOrganize',
    product_type: 'Home & Living',
    tags: ['new', 'furniture', 'home', 'storage'],
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'throw-pillow-covers-set',
    title: 'Velvet Throw Pillow Covers 4-Pack',
    description: '18x18", hidden zipper, soft velvet, multiple colors, machine washable.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'HomeStyle',
    product_type: 'Home & Living',
    tags: ['trending', 'decor', 'home', 'living-room'],
    image_url: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'plant-pots-ceramic-set',
    title: 'Ceramic Plant Pots Set of 3',
    description: 'Modern design, drainage holes, bamboo trays, 3 sizes, perfect for succulents.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'GreenHome',
    product_type: 'Home & Living',
    tags: ['new', 'garden', 'home', 'decor'],
    image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Additional Kitchen Gadgets - 10 more products
  {
    handle: 'blender-portable-usb',
    title: 'Portable Blender USB Rechargeable',
    description: '6 blades, 13oz capacity, one-touch operation, BPA-free, perfect for smoothies.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'BlendGo',
    product_type: 'Kitchen Gadgets',
    tags: ['trending', 'kitchen', 'portable', 'health'],
    image_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'coffee-maker-single-serve',
    title: 'Single Serve Coffee Maker',
    description: 'K-cup compatible, brews 6-14oz, auto shut-off, removable drip tray, compact.',
    price: 49.99,
    compare_at_price: 79.99,
    vendor: 'BrewMaster',
    product_type: 'Kitchen Gadgets',
    tags: ['bestseller', 'kitchen', 'coffee', 'appliance'],
    image_url: 'https://images.unsplash.com/photo-1517353856735-08e5c4d19e4e?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'food-scale-digital',
    title: 'Digital Kitchen Food Scale',
    description: 'Precision to 0.1g, tare function, unit conversion, stainless steel platform, LCD.',
    price: 14.99,
    compare_at_price: 24.99,
    vendor: 'PrecisionCook',
    product_type: 'Kitchen Gadgets',
    tags: ['trending', 'kitchen', 'baking', 'precision'],
    image_url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'egg-cooker-electric',
    title: 'Electric Egg Cooker',
    description: 'Cooks 7 eggs, hard/medium/soft boiled, auto shut-off, buzzer alert, BPA-free.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'EggPerfect',
    product_type: 'Kitchen Gadgets',
    tags: ['new', 'kitchen', 'breakfast', 'convenience'],
    image_url: 'https://images.unsplash.com/photo-1482049016gy-58nj5f7e95k8?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'vegetable-spiralizer',
    title: 'Vegetable Spiralizer 5-Blade',
    description: '5 interchangeable blades, suction base, easy to clean, recipe book included.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'HealthyEats',
    product_type: 'Kitchen Gadgets',
    tags: ['trending', 'kitchen', 'healthy', 'cooking'],
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'immersion-blender-hand',
    title: 'Immersion Hand Blender',
    description: '500W motor, 2-speed, detachable shaft, whisk attachment, BPA-free, ergonomic grip.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'BlendPro',
    product_type: 'Kitchen Gadgets',
    tags: ['bestseller', 'kitchen', 'blending', 'appliance'],
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'rice-cooker-mini',
    title: 'Mini Rice Cooker 3-Cup',
    description: 'One-touch cooking, keep warm function, non-stick pot, compact, steamer tray.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'CookSmart',
    product_type: 'Kitchen Gadgets',
    tags: ['new', 'kitchen', 'rice', 'compact'],
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'meat-thermometer-instant',
    title: 'Instant Read Meat Thermometer',
    description: '2-3 second reading, foldable probe, IP67 waterproof, backlit display, magnet.',
    price: 14.99,
    compare_at_price: 24.99,
    vendor: 'GrillMaster',
    product_type: 'Kitchen Gadgets',
    tags: ['trending', 'kitchen', 'grilling', 'bbq'],
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'can-opener-electric',
    title: 'Electric Can Opener',
    description: 'One-touch operation, smooth edge cutting, magnetic lid holder, easy to clean.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'KitchenEase',
    product_type: 'Kitchen Gadgets',
    tags: ['bestseller', 'kitchen', 'convenience', 'appliance'],
    image_url: 'https://images.unsplash.com/photo-1585155770913-4e3e53170073?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'silicone-baking-mats',
    title: 'Silicone Baking Mats 3-Pack',
    description: 'Non-stick, reusable, heat resistant to 480°F, FDA approved, fits standard sheets.',
    price: 14.99,
    compare_at_price: 24.99,
    vendor: 'BakePro',
    product_type: 'Kitchen Gadgets',
    tags: ['new', 'kitchen', 'baking', 'eco-friendly'],
    image_url: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Additional Office - 5 more products
  {
    handle: 'monitor-stand-riser',
    title: 'Monitor Stand with USB Ports',
    description: 'Tempered glass, 4 USB ports, storage drawer, supports up to 88lbs, adjustable legs.',
    price: 39.99,
    compare_at_price: 59.99,
    vendor: 'DeskPro',
    product_type: 'Office Accessories',
    tags: ['trending', 'office', 'computer', 'organization'],
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'desk-organizer-mesh',
    title: 'Mesh Desk Organizer Set',
    description: '6-piece set, file holder, pen cup, letter tray, memo holder, card holder, black.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'OfficePro',
    product_type: 'Office Accessories',
    tags: ['bestseller', 'office', 'organization', 'desk'],
    image_url: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'laptop-stand-adjustable',
    title: 'Adjustable Laptop Stand Aluminum',
    description: 'Ergonomic height, ventilated design, foldable, fits up to 17", non-slip pads.',
    price: 34.99,
    compare_at_price: 54.99,
    vendor: 'ErgoTech',
    product_type: 'Office Accessories',
    tags: ['trending', 'office', 'laptop', 'ergonomic'],
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'keyboard-wrist-rest',
    title: 'Memory Foam Keyboard Wrist Rest',
    description: 'Ergonomic support, cooling gel, non-slip base, breathable cover, 17.3" long.',
    price: 14.99,
    compare_at_price: 24.99,
    vendor: 'ComfortType',
    product_type: 'Office Accessories',
    tags: ['new', 'office', 'ergonomic', 'comfort'],
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'document-scanner-portable',
    title: 'Portable Document Scanner',
    description: 'Auto-feed, scans to PDF/JPG, OCR text recognition, compact, USB powered.',
    price: 79.99,
    compare_at_price: 119.99,
    vendor: 'ScanPro',
    product_type: 'Office Accessories',
    tags: ['bestseller', 'office', 'productivity', 'scanner'],
    image_url: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Additional Fitness - 8 more products
  {
    handle: 'dumbbells-adjustable-set',
    title: 'Adjustable Dumbbells 5-25lbs',
    description: 'Quick weight change, compact design, replaces 5 sets, includes storage tray.',
    price: 149.99,
    compare_at_price: 199.99,
    vendor: 'FitGear',
    product_type: 'Fitness',
    tags: ['bestseller', 'fitness', 'weights', 'home-gym'],
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'jump-rope-weighted',
    title: 'Weighted Jump Rope Set',
    description: 'Adjustable weights, ball bearings, tangle-free, foam handles, includes bag.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'JumpFit',
    product_type: 'Fitness',
    tags: ['trending', 'fitness', 'cardio', 'exercise'],
    image_url: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'exercise-bike-foldable',
    title: 'Foldable Exercise Bike',
    description: '8 resistance levels, LCD display, heart rate monitor, adjustable seat, quiet.',
    price: 149.99,
    compare_at_price: 229.99,
    vendor: 'CyclePro',
    product_type: 'Fitness',
    tags: ['new', 'fitness', 'cardio', 'home-gym'],
    image_url: 'https://images.unsplash.com/photo-1520877880798-5ee004e3f11e?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'ab-roller-wheel',
    title: 'Ab Roller Wheel with Knee Pad',
    description: 'Non-slip handles, ultra-wide wheel, includes knee pad, builds core strength.',
    price: 19.99,
    compare_at_price: 29.99,
    vendor: 'CoreFit',
    product_type: 'Fitness',
    tags: ['trending', 'fitness', 'core', 'exercise'],
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'pull-up-bar-doorway',
    title: 'Doorway Pull-Up Bar',
    description: 'No screws needed, fits doors 26-36", supports 300lbs, multiple grip positions.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'StrengthPro',
    product_type: 'Fitness',
    tags: ['bestseller', 'fitness', 'strength', 'home-gym'],
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'kettlebell-vinyl-coated',
    title: 'Vinyl Coated Kettlebell 20lb',
    description: 'Cast iron core, vinyl coating, wide handle, flat bottom, color coded.',
    price: 34.99,
    compare_at_price: 49.99,
    vendor: 'KettleFit',
    product_type: 'Fitness',
    tags: ['new', 'fitness', 'weights', 'strength'],
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'fitness-tracker-band',
    title: 'Fitness Tracker Band',
    description: 'Heart rate, sleep tracking, step counter, 7-day battery, waterproof, notifications.',
    price: 39.99,
    compare_at_price: 59.99,
    vendor: 'FitTrack',
    product_type: 'Fitness',
    tags: ['trending', 'fitness', 'wearable', 'health'],
    image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'exercise-ball-stability',
    title: 'Exercise Ball with Pump 65cm',
    description: 'Anti-burst material, textured surface, includes pump, supports 2200lbs.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'BalanceFit',
    product_type: 'Fitness',
    tags: ['new', 'fitness', 'yoga', 'core'],
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop',
    status: 'active',
  },
  
  // Home Organization - 4 more products
  {
    handle: 'closet-organizer-hanging',
    title: 'Hanging Closet Organizer 6-Shelf',
    description: 'Sturdy fabric, 2 side pockets, velcro attachment, 12x12x42", foldable.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'OrganizePro',
    product_type: 'Home Organization',
    tags: ['bestseller', 'organization', 'closet', 'storage'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'drawer-dividers-bamboo',
    title: 'Bamboo Drawer Dividers Set',
    description: 'Adjustable 17-22", spring-loaded, fits most drawers, eco-friendly, set of 4.',
    price: 24.99,
    compare_at_price: 39.99,
    vendor: 'BambooHome',
    product_type: 'Home Organization',
    tags: ['trending', 'organization', 'drawer', 'eco-friendly'],
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'vacuum-storage-bags',
    title: 'Vacuum Storage Bags 10-Pack',
    description: 'Space saver, airtight seal, reusable, includes hand pump, various sizes.',
    price: 19.99,
    compare_at_price: 34.99,
    vendor: 'SpaceSaver',
    product_type: 'Home Organization',
    tags: ['new', 'organization', 'storage', 'travel'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    status: 'active',
  },
  {
    handle: 'shoe-rack-stackable',
    title: 'Stackable Shoe Rack 4-Tier',
    description: 'Holds 12 pairs, sturdy metal frame, space-saving design, easy assembly.',
    price: 29.99,
    compare_at_price: 49.99,
    vendor: 'ShoeOrganize',
    product_type: 'Home Organization',
    tags: ['bestseller', 'organization', 'shoes', 'storage'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    status: 'active',
  },
];

/**
 * Convert products to CSV format for edge function
 */
function productsToCSV(products: SeedProduct[]): string {
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
  
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
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
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];
  
  return csvLines.join('\n');
}

/**
 * Seeds the products table with sample data via Edge Function (bypasses RLS)
 * @param force - If true, seeds even if products already exist (updates existing, adds new)
 */
export async function seedProducts(force: boolean = false): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // First, check if products already exist
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return { success: false, message: `Error checking existing products: ${countError.message}` };
    }

    if (!force && count && count > 0) {
      return { success: true, message: `Products table already has ${count} products. Use force option to reseed.`, count };
    }

    // Convert to CSV and use edge function to bypass RLS
    const csvContent = productsToCSV(SEED_PRODUCTS);
    
    const { data, error } = await supabase.functions.invoke('bulk-import-txt', {
      body: {
        content: csvContent,
        userId: null,
      },
    });

    if (error) {
      return { success: false, message: `Error seeding products: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Successfully seeded ${data?.created || 0} products!`, 
      count: data?.created || 0 
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
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (neq to impossible UUID)

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
