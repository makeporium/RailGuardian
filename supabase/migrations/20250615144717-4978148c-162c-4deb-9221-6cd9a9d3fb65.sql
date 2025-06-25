
-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'laborer');

-- Create train status enum
CREATE TYPE public.train_status AS ENUM ('active', 'maintenance', 'out_of_service');

-- Create cleaning status enum
CREATE TYPE public.cleaning_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'laborer',
  employee_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trains table
CREATE TABLE public.trains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  train_number TEXT UNIQUE NOT NULL,
  train_name TEXT NOT NULL,
  route TEXT NOT NULL,
  total_coaches INTEGER NOT NULL DEFAULT 18,
  status train_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  train_id UUID REFERENCES public.trains(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, train_id)
);

-- Create coaches table
CREATE TABLE public.coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  train_id UUID REFERENCES public.trains(id) ON DELETE CASCADE,
  coach_number TEXT NOT NULL,
  coach_type TEXT DEFAULT 'AC',
  washroom_count INTEGER DEFAULT 2,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(train_id, coach_number)
);

-- Create washrooms table
CREATE TABLE public.washrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  washroom_number TEXT NOT NULL,
  washroom_type TEXT DEFAULT 'general',
  qr_code TEXT UNIQUE NOT NULL,
  location_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, washroom_number)
);

-- Create cleaning_records table
CREATE TABLE public.cleaning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  washroom_id UUID REFERENCES public.washrooms(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  status cleaning_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  before_photo_url TEXT,
  after_photo_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cleaning_sessions table for tracking QR scans
CREATE TABLE public.cleaning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  washroom_id UUID REFERENCES public.washrooms(id) ON DELETE CASCADE,
  qr_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours')
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_sessions ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('admin', 'supervisor');
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and supervisors can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_supervisor());

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for trains (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view trains" ON public.trains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage trains" ON public.trains
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for staff
CREATE POLICY "Users can view staff assignments" ON public.staff
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and supervisors can manage staff" ON public.staff
  FOR ALL USING (public.is_admin_or_supervisor());

-- RLS Policies for coaches
CREATE POLICY "Authenticated users can view coaches" ON public.coaches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage coaches" ON public.coaches
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for washrooms
CREATE POLICY "Authenticated users can view washrooms" ON public.washrooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage washrooms" ON public.washrooms
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for cleaning_records
CREATE POLICY "Staff can view their own cleaning records" ON public.cleaning_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and supervisors can view all cleaning records" ON public.cleaning_records
  FOR SELECT USING (public.is_admin_or_supervisor());

CREATE POLICY "Staff can insert their own cleaning records" ON public.cleaning_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their own cleaning records" ON public.cleaning_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Supervisors and admins can update cleaning records" ON public.cleaning_records
  FOR UPDATE USING (public.is_admin_or_supervisor());

-- RLS Policies for cleaning_sessions
CREATE POLICY "Staff can view their own cleaning sessions" ON public.cleaning_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert their own cleaning sessions" ON public.cleaning_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, employee_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for 3 trains
INSERT INTO public.trains (train_number, train_name, route, total_coaches) VALUES
('12001', 'Shatabdi Express', 'New Delhi → Chandigarh', 18),
('12002', 'Rajdhani Express', 'New Delhi → Mumbai', 22),
('12003', 'Duronto Express', 'Chennai → Bangalore', 16);

-- Insert coaches for each train (sample data)
INSERT INTO public.coaches (train_id, coach_number, qr_code) 
SELECT 
  t.id,
  'C' || generate_series(1, t.total_coaches),
  'QR_COACH_' || t.train_number || '_C' || generate_series(1, t.total_coaches)
FROM public.trains t;

-- Insert washrooms for each coach
INSERT INTO public.washrooms (coach_id, washroom_number, qr_code, location_description)
SELECT 
  c.id,
  'WR' || generate_series(1, 2),
  'QR_WR_' || c.coach_number || '_' || c.qr_code || '_WR' || generate_series(1, 2),
  'Washroom ' || generate_series(1, 2) || ' in ' || c.coach_number
FROM public.coaches c;
