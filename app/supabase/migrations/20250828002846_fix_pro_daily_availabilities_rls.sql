-- Fix RLS policies for pro_daily_availabilities table
-- Allow pros to manage their own availability data

-- Enable RLS on the table (if not already enabled)
ALTER TABLE pro_daily_availabilities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Pros can view their own daily availabilities" ON pro_daily_availabilities;
DROP POLICY IF EXISTS "Pros can manage their own daily availabilities" ON pro_daily_availabilities;
DROP POLICY IF EXISTS "Amateurs can view available slots" ON pro_daily_availabilities;
DROP POLICY IF EXISTS "Public can view available slots" ON pro_daily_availabilities;

-- Create policies for pros to manage their own availability data
CREATE POLICY "Pros can view their own daily availabilities"
ON pro_daily_availabilities
FOR SELECT
TO authenticated
USING (
  -- Pro can see their own availability (pro_id matches the authenticated user's profile id)
  pro_id IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND user_type = 'pro'
  )
);

CREATE POLICY "Pros can manage their own daily availabilities"
ON pro_daily_availabilities
FOR ALL
TO authenticated
USING (
  -- Pro can manage their own availability (pro_id matches the authenticated user's profile id)
  pro_id IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND user_type = 'pro'
  )
)
WITH CHECK (
  -- Pro can only insert/update their own availability (pro_id matches the authenticated user's profile id)
  pro_id IN (
    SELECT id FROM profiles WHERE id = auth.uid() AND user_type = 'pro'
  )
);

-- Create policy for amateurs to view available slots
CREATE POLICY "Amateurs can view available slots"
ON pro_daily_availabilities
FOR SELECT
TO authenticated
USING (
  -- Anyone authenticated can view available slots
  is_available = true AND is_booked = false
);

-- Create policy for public read access (for anonymous users if needed)
CREATE POLICY "Public can view available slots"
ON pro_daily_availabilities
FOR SELECT
TO anon, authenticated
USING (
  -- Public can see available and not booked slots
  is_available = true AND is_booked = false
);