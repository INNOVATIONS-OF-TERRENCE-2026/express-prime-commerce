-- Clean up Example products from Supabase that were synced from Shopify
DELETE FROM products 
WHERE shopify_product_id IN ('9675098030437', '9675097997669', '9675097964901', '9675097932133');