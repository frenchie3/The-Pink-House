-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('cubby_item_limits', '{"default": 10, "premium": 20}', 'Maximum number of items a seller can add to their cubby based on their plan'),
  ('commission_rates', '{"default": 0.15, "premium": 0.10}', 'Commission rates for seller items'),
  ('cubby_rental_fees', '{"weekly": 10, "monthly": 35, "quarterly": 90}', 'Cubby rental fees for different time periods')
ON CONFLICT (setting_key) DO NOTHING;
