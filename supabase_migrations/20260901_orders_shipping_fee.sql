-- Migration: Add shipping_fee column to orders table
-- Standard shipping: $2.25, waived if all cart items have free_shipping attribute

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN orders.shipping_fee IS
'Flat shipping fee charged on this order. 0.00 = free shipping (all items had free_shipping attribute).
Standard fee = $2.25 international shipping.';
