-- Create user_role enum type if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'seller');
    END IF;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_role;
    END IF;
END $$;

-- Set default role for existing users
UPDATE users SET role = 'seller' WHERE role IS NULL;

-- Create admin user if not exists
INSERT INTO users (id, email, role, name, full_name, token_identifier, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin', 'Admin', 'System Admin', '00000000-0000-0000-0000-000000000000', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create staff user if not exists
INSERT INTO users (id, email, role, name, full_name, token_identifier, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'staff@example.com', 'staff', 'Staff', 'Staff Member', '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;
