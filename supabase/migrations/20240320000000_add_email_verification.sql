-- Add email verification status column to users table
ALTER TABLE public.users
ADD COLUMN email_verified boolean DEFAULT false;

-- Create a function to update email_verified status
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS trigger AS $$
BEGIN
  -- Update email_verified status in users table when auth.users email_confirmed_at is set
  UPDATE public.users
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update email_verified status
CREATE TRIGGER on_auth_user_email_verification
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_verification();

-- Update existing users' email verification status
UPDATE public.users u
SET email_verified = (au.email_confirmed_at IS NOT NULL)
FROM auth.users au
WHERE u.id = au.id; 