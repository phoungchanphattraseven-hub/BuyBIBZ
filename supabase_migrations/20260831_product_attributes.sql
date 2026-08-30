-- ============================================================
-- Migration: Add attributes JSONB column to products table
-- Supports flexible product attributes: size, color, shipping, etc.
-- ============================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.attributes IS
'Flexible key-value product attributes.
Examples:
  {"sizes": ["S","M","L","XL"], "colors": ["Red","Blue"], "free_shipping": true, "material": "Cotton", "weight": "200g", "warranty": "1 year"}
';
