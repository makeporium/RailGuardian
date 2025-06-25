
-- Update trains to have exactly 5 coaches each
UPDATE public.trains SET total_coaches = 5;

-- Delete existing coaches and washrooms to start fresh
DELETE FROM public.washrooms;
DELETE FROM public.coaches;

-- Insert exactly 5 coaches for each train
INSERT INTO public.coaches (train_id, coach_number, coach_type, qr_code, washroom_count) 
SELECT 
  t.id,
  'C' || generate_series(1, 5),
  'AC',
  'QR_COACH_' || t.train_number || '_C' || generate_series(1, 5),
  2
FROM public.trains t;

-- Insert 2 washrooms for each coach
INSERT INTO public.washrooms (coach_id, washroom_number, washroom_type, qr_code, location_description)
SELECT 
  c.id,
  'WR' || generate_series(1, 2),
  'general',
  'QR_WR_' || t.train_number || '_' || c.coach_number || '_WR' || generate_series(1, 2),
  t.train_name || ' - Coach ' || c.coach_number || ' - Washroom ' || generate_series(1, 2)
FROM public.coaches c
JOIN public.trains t ON c.train_id = t.id;

-- Create OTP sessions table for OTP-based access
CREATE TABLE IF NOT EXISTS public.otp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  otp_code TEXT NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  train_id UUID REFERENCES public.trains(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '8 hours')
);

-- Enable RLS on OTP sessions
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for OTP sessions
CREATE POLICY "Staff can view their own OTP sessions" ON public.otp_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage OTP sessions" ON public.otp_sessions
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Add photo upload status to cleaning records
ALTER TABLE public.cleaning_records 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Insert sample OTP sessions for testing
INSERT INTO public.otp_sessions (otp_code, train_id, coach_id) 
SELECT 
  '123' || ROW_NUMBER() OVER (ORDER BY t.id, c.id),
  t.id,
  c.id
FROM public.trains t
JOIN public.coaches c ON t.id = c.train_id
LIMIT 15; -- 3 trains × 5 coaches = 15 OTP codes

-- Create sample staff accounts (we'll need to add these users manually in Supabase Auth)
-- This is just the staff records, the actual auth users need to be created separately
