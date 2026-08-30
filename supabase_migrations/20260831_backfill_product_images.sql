-- ============================================================
-- Migration: Backfill product_images from existing image_url
-- Run AFTER 20260831_product_images.sql
-- This inserts a primary image row for every product that
-- has an image_url but no rows yet in product_images.
-- ============================================================

INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
SELECT
    p.id,
    p.image_url,
    p.name,
    0,
    TRUE
FROM products p
WHERE p.image_url IS NOT NULL
  AND p.image_url != ''
  AND NOT EXISTS (
      SELECT 1 FROM product_images pi
      WHERE pi.product_id = p.id
  );
