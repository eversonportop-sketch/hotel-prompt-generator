
-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Standard',
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  promotional_price NUMERIC,
  capacity INTEGER NOT NULL DEFAULT 2,
  beds TEXT NOT NULL DEFAULT '1 Casal',
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rooms" ON public.rooms
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated can view all rooms" ON public.rooms
  FOR SELECT TO authenticated USING (true);

-- Reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON public.reservations
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "Users can insert own reservations" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE TO authenticated USING (auth.uid() = client_id);

-- Admin policies (service role bypasses RLS, but for future admin role support)
-- For now admins use service role or we add admin policies later

-- Validation trigger for reservations
CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- check_out must be after check_in
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'check_out must be after check_in';
  END IF;

  -- guests must be >= 1
  IF NEW.guests_count < 1 THEN
    RAISE EXCEPTION 'guests_count must be at least 1';
  END IF;

  -- Check date conflicts (same room, overlapping dates, active statuses)
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE room_id = NEW.room_id
      AND id IS DISTINCT FROM NEW.id
      AND status IN ('pending', 'confirmed')
      AND check_in < NEW.check_out
      AND check_out > NEW.check_in
  ) THEN
    RAISE EXCEPTION 'Room is not available for the selected dates';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_reservation_trigger
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.validate_reservation();

-- Check availability function
CREATE OR REPLACE FUNCTION public.check_room_availability(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.reservations
    WHERE room_id = p_room_id
      AND id IS DISTINCT FROM p_exclude_reservation_id
      AND status IN ('pending', 'confirmed')
      AND check_in < p_check_out
      AND check_out > p_check_in
  );
$$;
