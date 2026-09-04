-- Add Cambodia-specific address fields to profiles table
-- Migration: 20260905_cambodia_address_fields.sql

-- Add Cambodia address columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS province_code TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS district_code TEXT,
ADD COLUMN IF NOT EXISTS commune TEXT,
ADD COLUMN IF NOT EXISTS commune_code TEXT,
ADD COLUMN IF NOT EXISTS village TEXT;

-- Add Cambodia address columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_province TEXT,
ADD COLUMN IF NOT EXISTS shipping_province_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_district TEXT,
ADD COLUMN IF NOT EXISTS shipping_district_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_commune TEXT,
ADD COLUMN IF NOT EXISTS shipping_commune_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_village TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add comments for documentation
COMMENT ON COLUMN profiles.province IS 'Cambodia province name (e.g., Phnom Penh)';
COMMENT ON COLUMN profiles.province_code IS 'Cambodia province code for address validation';
COMMENT ON COLUMN profiles.district IS 'Cambodia district/khan/srok name';
COMMENT ON COLUMN profiles.district_code IS 'Cambodia district code for address validation';
COMMENT ON COLUMN profiles.commune IS 'Cambodia commune/sangkat name';
COMMENT ON COLUMN profiles.commune_code IS 'Cambodia commune code for address validation';
COMMENT ON COLUMN profiles.village IS 'Cambodia village/phum name (optional)';

COMMENT ON COLUMN orders.shipping_province IS 'Cambodia province name for shipping';
COMMENT ON COLUMN orders.shipping_province_code IS 'Cambodia province code for shipping';
COMMENT ON COLUMN orders.shipping_district IS 'Cambodia district/khan/srok for shipping';
COMMENT ON COLUMN orders.shipping_district_code IS 'Cambodia district code for shipping';
COMMENT ON COLUMN orders.shipping_commune IS 'Cambodia commune/sangkat for shipping';
COMMENT ON COLUMN orders.shipping_commune_code IS 'Cambodia commune code for shipping';
COMMENT ON COLUMN orders.shipping_village IS 'Cambodia village/phum for shipping (optional)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cod (Cash on Delivery) or khqr (KHQR/Bakong)';
