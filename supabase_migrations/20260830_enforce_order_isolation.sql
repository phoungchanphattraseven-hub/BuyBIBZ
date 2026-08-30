-- Apply this once in the Supabase SQL Editor for an existing BuyBIBZ database.
-- Customer orders and order line items must always respect their RLS policies,
-- including when accessed by a table owner.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

-- Add a customer-facing, globally unique order identifier.  `orders.id`
-- remains the internal relational key used by order_items.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_uid UUID;
UPDATE public.orders SET order_uid = gen_random_uuid() WHERE order_uid IS NULL;
ALTER TABLE public.orders ALTER COLUMN order_uid SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ALTER COLUMN order_uid SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_uid ON public.orders(order_uid);

-- Preserve selected purchasable variants (for example Color: Blue, Size: M)
-- in the cart and the final order history.
ALTER TABLE public.cart_items
    ADD COLUMN IF NOT EXISTS selected_options JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS selected_options JSONB NOT NULL DEFAULT '{}'::jsonb;

-- The original constraint permitted only one row per product. Replace it so
-- the same product in different selected variants can be added separately.
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_product_options
    ON public.cart_items (user_id, product_id, selected_options);
