-- Add unit_price to cart_items so variant prices are preserved
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT NULL;
