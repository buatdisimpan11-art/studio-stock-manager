-- Create status enum for products
CREATE TYPE public.product_status AS ENUM ('AVAILABLE', 'LIVE', 'COOLDOWN', 'BLACKLIST');

-- Create studios table
CREATE TABLE public.studios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  daily_rotation INTEGER NOT NULL DEFAULT 2,
  color TEXT NOT NULL DEFAULT 'hsl(168 84% 45%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (each product belongs to ONE studio)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  category TEXT,
  status public.product_status NOT NULL DEFAULT 'AVAILABLE',
  gmv DECIMAL(15,2) NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  score DECIMAL(15,2) NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_stats table for tracking daily performance
CREATE TABLE public.daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  gmv DECIMAL(15,2) NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_products_studio_id ON public.products(studio_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_score ON public.products(score);
CREATE INDEX idx_daily_stats_product_id ON public.daily_stats(product_id);
CREATE INDEX idx_daily_stats_date ON public.daily_stats(date);

-- Enable Row Level Security
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (no auth required for this admin app)
CREATE POLICY "Allow public read access on studios" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Allow public insert on studios" ON public.studios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on studios" ON public.studios FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on studios" ON public.studios FOR DELETE USING (true);

CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read access on daily_stats" ON public.daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert on daily_stats" ON public.daily_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on daily_stats" ON public.daily_stats FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on daily_stats" ON public.daily_stats FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON public.studios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate product score
CREATE OR REPLACE FUNCTION public.calculate_product_score(gmv_value DECIMAL, clicks_value INTEGER, gmv_weight DECIMAL DEFAULT 0.7, clicks_weight DECIMAL DEFAULT 0.3)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (gmv_value * gmv_weight) + (clicks_value * 1000 * clicks_weight);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Insert default studios
INSERT INTO public.studios (name, category, color) VALUES
  ('Studio 1', 'Fashion', 'hsl(168 84% 45%)'),
  ('Studio 2', 'Elektronik', 'hsl(258 90% 66%)'),
  ('Studio 3', 'Kecantikan', 'hsl(330 80% 60%)'),
  ('Studio 4', 'Rumah & Dekorasi', 'hsl(38 92% 55%)'),
  ('Studio 5', 'Olahraga', 'hsl(200 90% 50%)'),
  ('Studio 6', 'Makanan & Minuman', 'hsl(15 80% 55%)'),
  ('Studio 7', 'Anak & Bayi', 'hsl(280 70% 55%)');