-- Preserve historical order lines when an administrator deletes a product.
-- The existing relation used ON DELETE SET NULL but contradicted it by also
-- requiring product_id to be NOT NULL, causing product deletion to fail.

ALTER TABLE public.order_items
    DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
    ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;
