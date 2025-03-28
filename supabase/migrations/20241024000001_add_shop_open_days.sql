-- Add shop_open_days to system_settings table
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
VALUES (
  'shop_open_days',
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}',
  'Configuration for which days of the week the shop is open for business',
  NOW(),
  NOW()
) ON CONFLICT (setting_key) DO NOTHING;

-- Enable realtime for system_settings table
alter publication supabase_realtime add table system_settings;
