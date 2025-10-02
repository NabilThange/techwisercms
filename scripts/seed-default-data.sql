-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Audio', 'audio', 'Audio equipment and headphones'),
('Mobile', 'mobile', 'Smartphones and mobile devices'),
('Laptop', 'laptop', 'Laptops and notebooks'),
('Wearable', 'wearable', 'Wearable technology devices'),
('Accessories', 'accessories', 'Tech accessories and peripherals'),
('Monitor', 'monitor', 'Computer monitors and displays')
ON CONFLICT (slug) DO NOTHING;

-- Insert default brands
INSERT INTO brands (name, slug) VALUES
('Sony', 'sony'),
('Apple', 'apple'),
('Samsung', 'samsung'),
('Logitech', 'logitech'),
('Dell', 'dell'),
('HP', 'hp'),
('Lenovo', 'lenovo'),
('Asus', 'asus'),
('Razer', 'razer'),
('Bose', 'bose')
ON CONFLICT (slug) DO NOTHING;
