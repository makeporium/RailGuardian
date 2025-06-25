
-- Update the user creation function to also create a staff record
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, employee_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP_' || substr(NEW.id::text, 1, 8))
  );

  -- Insert into staff table for the new user, as every new user is a laborer by default
  INSERT INTO public.staff (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$function$;

-- Create staff records for existing laborer users who don't have one
INSERT INTO public.staff (user_id)
SELECT id FROM public.profiles
WHERE role = 'laborer' AND id NOT IN (SELECT user_id FROM public.staff WHERE user_id IS NOT NULL);

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for staff table
CREATE POLICY "Admins and supervisors can view all staff" ON public.staff FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'supervisor'));
CREATE POLICY "Users can view their own staff record" ON public.staff FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');


-- Drop old RLS policy on otp_sessions if it exists
DROP POLICY IF EXISTS "Staff can view their own OTP sessions" ON public.otp_sessions;

-- Allow staff to see OTP sessions assigned to them
CREATE POLICY "Staff can view their assigned OTP sessions" ON public.otp_sessions
  FOR SELECT USING (staff_id = (SELECT id FROM public.staff WHERE user_id = auth.uid()));

-- Allow staff to find an unassigned OTP by its code. This is needed for verification.
CREATE POLICY "Staff can find unassigned OTPs to verify" ON public.otp_sessions
  FOR SELECT USING (staff_id IS NULL);
  
-- Allow staff to claim an unassigned OTP session by updating it with their staff_id
CREATE POLICY "Staff can claim an unassigned OTP session" ON public.otp_sessions
  FOR UPDATE
  USING (staff_id IS NULL)
  WITH CHECK (staff_id = (SELECT id FROM public.staff WHERE user_id = auth.uid()));

