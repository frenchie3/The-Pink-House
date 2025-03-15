-- Insert pickup settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'pickup_settings',
  jsonb_build_object(
    'gracePickupDays', 7,
    'lastChanceDays', 3
  ),
  'Settings for end of rental pickup periods and notifications'
)
ON CONFLICT (setting_key) DO UPDATE
SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

-- Enable realtime for system_settings if not already enabled
alter publication supabase_realtime add table system_settings;