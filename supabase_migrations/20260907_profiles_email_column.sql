-- ============================================================
-- Migration: Add email column to profiles + sync from auth.users
-- This lets the admin panel read emails without a service role key.
-- ============================================================

-- 1. Add email column if it doesn't already exist
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill emails from auth.users for all existing profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 3. Create a trigger function that keeps profiles.email in sync
--    whenever a new user registers or their auth email changes.
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Upsert the profile row so it always has the latest email
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

-- 4. Attach the trigger to auth.users (fires on INSERT and UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;

CREATE TRIGGER on_auth_user_email_sync
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();
