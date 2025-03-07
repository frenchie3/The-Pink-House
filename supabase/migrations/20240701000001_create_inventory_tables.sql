-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'seller');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  location TEXT,
  cubby_location TEXT,
  cubby_id UUID,
  seller_id UUID,
  image_url TEXT,
  barcode TEXT,
  condition TEXT,
  notes TEXT,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  listing_type TEXT,
  commission_rate DECIMAL(5,2),
  FOREIGN KEY (cubby_id) REFERENCES cubbies(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id)
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_sold DECIMAL(10,2) NOT NULL
);

-- Cubbies table
CREATE TABLE IF NOT EXISTS cubbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cubby_number TEXT NOT NULL UNIQUE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cubby rentals table
CREATE TABLE IF NOT EXISTS cubby_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cubby_id UUID NOT NULL REFERENCES cubbies(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rental_fee DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller earnings table
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  sale_item_id UUID NOT NULL REFERENCES sale_items(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_id UUID REFERENCES seller_payouts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller payouts table
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Clothing', 'Apparel items including shirts, pants, dresses, etc.'),
  ('Furniture', 'Household furniture items'),
  ('Electronics', 'Electronic devices and accessories'),
  ('Books', 'Books, magazines, and printed materials'),
  ('Toys', 'Children''s toys and games'),
  ('Kitchenware', 'Kitchen utensils, appliances, and accessories'),
  ('Jewelry', 'Necklaces, rings, bracelets, and other jewelry items'),
  ('Art', 'Paintings, sculptures, and other art pieces'),
  ('Collectibles', 'Collectible items and memorabilia'),
  ('Other', 'Miscellaneous items')
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('commission_rates', '{"self_listed": 20, "staff_listed": 30}', 'Commission rates for seller items (percentage)'),
  ('cubby_rental_fees', '{"weekly": 10, "monthly": 35, "quarterly": 90}', 'Cubby rental fees'),
  ('notification_settings', '{"rental_expiry_days": 7, "payout_processing_days": 3}', 'Notification settings for various events')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cubbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cubby_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all users" ON users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')
  ));

-- Inventory items policies
CREATE POLICY "Anyone can view inventory items" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own items" ON inventory_items
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own items" ON inventory_items
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Staff can manage all inventory items" ON inventory_items
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')
  ));

-- Enable realtime for inventory items
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
