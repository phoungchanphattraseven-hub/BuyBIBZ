-- ============================================================
-- BuyBIBZ E-Commerce — Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        CASE
            WHEN NEW.email = 'adminbuybiz@gmail.com' THEN 'admin'
            ELSE 'customer'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- emoji or icon class
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_price DECIMAL(10,2) CHECK (compare_price >= 0),
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    rating_avg DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- 4. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    selected_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, selected_options)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    transaction_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    shipping_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_postal TEXT,
    shipping_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- Keep the line item after a catalog product is deleted. The snapshot
    -- fields below preserve the name, image, price and selected options.
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    selected_options JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories (public read)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products (public read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Only admins can insert products" ON products FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update products" ON products FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can delete products" ON products FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cart Items (user-scoped)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders (user-scoped, admin can see all)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Enforce RLS for the two customer-owned order tables.  This protects the
-- data even if an application endpoint is modified in the future.
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA — Categories & Sample Products
-- ============================================================

INSERT INTO categories (name, slug, description, icon) VALUES
    ('Electronics', 'electronics', 'Gadgets, devices, and tech accessories', '⚡'),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories', '👗'),
    ('Home & Living', 'home-living', 'Furniture, decor, and home essentials', '🏠'),
    ('Sports & Outdoors', 'sports-outdoors', 'Fitness gear and outdoor equipment', '⚽'),
    ('Beauty & Care', 'beauty-care', 'Skincare, makeup, and personal care', '✨')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_price, image_url, category_id, stock, is_featured) VALUES
    ('Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones', 'Premium over-ear headphones with active noise cancellation, 40hr battery life, and crystal-clear audio.', 299.99, 399.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 1, 50, TRUE),
    ('Smart Watch Pro', 'smart-watch-pro', 'Advanced fitness tracking, heart rate monitor, GPS, and 7-day battery in a sleek titanium design.', 449.99, 549.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 1, 35, TRUE),
    ('Portable Bluetooth Speaker', 'portable-bt-speaker', 'Waterproof 360° sound with deep bass, 20hr playtime. Perfect for adventures.', 129.99, 179.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 1, 80, FALSE),
    ('Mechanical Gaming Keyboard', 'mechanical-gaming-kb', 'RGB backlit mechanical keyboard with hot-swappable switches and aircraft-grade aluminum frame.', 189.99, 249.99, 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500', 1, 45, FALSE),
    ('Premium Leather Jacket', 'premium-leather-jacket', 'Handcrafted genuine leather jacket with quilted lining. Timeless style meets modern comfort.', 349.99, 499.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 2, 25, TRUE),
    ('Classic Canvas Sneakers', 'classic-canvas-sneakers', 'Versatile everyday sneakers with cushioned insole and durable rubber outsole.', 79.99, 99.99, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', 2, 100, FALSE),
    ('Designer Sunglasses', 'designer-sunglasses', 'UV400 polarized lenses in a lightweight acetate frame. Available in multiple colors.', 159.99, 219.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', 2, 60, TRUE),
    ('Minimalist Backpack', 'minimalist-backpack', 'Water-resistant backpack with laptop compartment, hidden pockets, and ergonomic design.', 89.99, 129.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 2, 70, FALSE),
    ('Modern Table Lamp', 'modern-table-lamp', 'Touch-controlled LED lamp with adjustable color temperature and wireless charging base.', 119.99, 159.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057ab3fe?w=500', 3, 40, FALSE),
    ('Aromatherapy Diffuser', 'aromatherapy-diffuser', 'Ultrasonic essential oil diffuser with ambient LED lighting and auto shut-off.', 49.99, 69.99, 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500', 3, 90, TRUE),
    ('Premium Yoga Mat', 'premium-yoga-mat', 'Non-slip natural rubber yoga mat with alignment lines. 6mm thickness for joint support.', 69.99, 89.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', 4, 55, FALSE),
    ('Stainless Steel Water Bottle', 'steel-water-bottle', 'Triple-insulated 32oz bottle keeps drinks cold 24hrs or hot 12hrs. BPA-free.', 34.99, 44.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 4, 120, FALSE),
    ('Organic Face Serum', 'organic-face-serum', 'Vitamin C + Hyaluronic acid serum for radiant, youthful skin. 100% organic ingredients.', 54.99, 74.99, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500', 5, 65, TRUE),
    ('Luxury Scented Candle Set', 'luxury-candle-set', 'Hand-poured soy wax candles in 3 signature scents. 60hr burn time each.', 44.99, 59.99, 'https://images.unsplash.com/photo-1602607742412-d1d26e216484?w=500', 5, 85, FALSE),
    ('Wireless Earbuds Ultra', 'wireless-earbuds-ultra', 'True wireless earbuds with spatial audio, adaptive ANC, and 30hr total battery.', 199.99, 279.99, 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500', 1, 42, TRUE),
    ('Fitness Resistance Bands Set', 'fitness-resistance-bands', 'Set of 5 resistance bands with door anchor, handles, and carry bag. All fitness levels.', 29.99, 39.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500', 4, 150, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- PRODUCT IMAGES - Support for multiple product images
-- ============================================================

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);

-- Add RLS policies for product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
    ON product_images FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert product images"
    ON product_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update product images"
    ON product_images FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete product images"
    ON product_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON TABLE product_images IS 'Stores multiple images for each product. Products can have different color variants, angles, etc.';
COMMENT ON COLUMN product_images.display_order IS 'Order in which images should be displayed (0 = first)';
COMMENT ON COLUMN product_images.is_primary IS 'Marks the main/thumbnail image for the product';
