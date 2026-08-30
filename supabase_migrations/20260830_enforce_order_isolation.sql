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
