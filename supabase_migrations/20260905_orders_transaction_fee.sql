-- Migration: Add transaction_fee column to orders table
-- Transaction fee: 3% of the product subtotal, included in the order total

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS transaction_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN orders.transaction_fee IS
'Payment processing fee charged on this order = 3% of the product subtotal (shipping excluded).';