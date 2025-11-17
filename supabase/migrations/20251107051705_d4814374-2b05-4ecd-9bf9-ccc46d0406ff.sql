-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create bus_routes table
CREATE TABLE public.bus_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number text NOT NULL,
  route_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric(10, 2) NOT NULL,
  departure_times text[] NOT NULL,
  total_seats integer DEFAULT 40 NOT NULL,
  amenities text[] DEFAULT ARRAY[]::text[],
  description text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on bus_routes (public read)
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bus routes"
  ON public.bus_routes FOR SELECT
  USING (true);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES public.bus_routes(id) ON DELETE CASCADE NOT NULL,
  journey_date date NOT NULL,
  departure_time text NOT NULL,
  seat_numbers text[] NOT NULL,
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  passenger_email text NOT NULL,
  total_amount numeric(10, 2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  booking_status text DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES public.bus_routes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(booking_id, user_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert sample bus routes
INSERT INTO public.bus_routes (route_number, route_name, origin, destination, duration_minutes, price, departure_times, amenities, description, image_url) VALUES
('BUS001', 'Express City Line', 'Downtown Terminal', 'Airport Hub', 45, 15.99, ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], ARRAY['WiFi', 'AC', 'USB Charging', 'Reclining Seats'], 'Fast and comfortable express service between downtown and airport', null),
('BUS002', 'Coastal Route', 'Beach Plaza', 'Marina District', 90, 22.50, ARRAY['07:00', '09:30', '12:00', '15:00', '18:00'], ARRAY['WiFi', 'AC', 'Scenic Views', 'Refreshments'], 'Scenic coastal journey with stunning ocean views', null),
('BUS003', 'Metro Shuttle', 'Central Station', 'University Campus', 30, 8.99, ARRAY['06:30', '07:30', '08:30', '09:30', '15:00', '16:00', '17:00', '18:00'], ARRAY['AC', 'Student Discount'], 'Frequent service for students and commuters', null),
('BUS004', 'Business Express', 'Financial District', 'Tech Park', 60, 18.75, ARRAY['07:00', '08:00', '09:00', '17:00', '18:00', '19:00'], ARRAY['WiFi', 'AC', 'Work Tables', 'Power Outlets'], 'Premium service for business travelers', null);