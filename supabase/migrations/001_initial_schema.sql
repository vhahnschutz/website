-- RC Services - Supabase Schema Migration
-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  photo_url TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointment_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 60),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  customer_name VARCHAR(160) DEFAULT '',
  customer_email VARCHAR(254) DEFAULT '',
  customer_phone VARCHAR(40) DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 60),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER gallery_images_updated_at BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointment_slots_updated_at BEFORE UPDATE ON appointment_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_sales_created_at ON sales (created_at DESC);
CREATE INDEX idx_gallery_images_created_at ON gallery_images (created_at DESC);
CREATE INDEX idx_appointment_slots_starts_at ON appointment_slots (starts_at);
CREATE INDEX idx_appointments_scheduled_at ON appointments (scheduled_at);
CREATE INDEX idx_appointments_status ON appointments (status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
-- Uses JWT user_metadata.is_admin = 'true'

-- SALES
CREATE POLICY "Public read sales" ON sales
  FOR SELECT USING (true);
CREATE POLICY "Admin write sales" ON sales
  FOR ALL USING (auth.jwt()->'user_metadata'->>'is_admin' = 'true');

-- GALLERY IMAGES
CREATE POLICY "Public read gallery" ON gallery_images
  FOR SELECT USING (true);
CREATE POLICY "Admin write gallery" ON gallery_images
  FOR ALL USING (auth.jwt()->'user_metadata'->>'is_admin' = 'true');

-- APPOINTMENT SLOTS
CREATE POLICY "Public read slots" ON appointment_slots
  FOR SELECT USING (true);
CREATE POLICY "Admin write slots" ON appointment_slots
  FOR ALL USING (auth.jwt()->'user_metadata'->>'is_admin' = 'true');

-- APPOINTMENTS
CREATE POLICY "Admin full appointments" ON appointments
  FOR ALL USING (auth.jwt()->'user_metadata'->>'is_admin' = 'true');
CREATE POLICY "Public insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS (run via Dashboard or API)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('sales', 'sales', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('gallery', 'gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STORAGE RLS
CREATE POLICY "Public read sales images" ON storage.objects
  FOR SELECT USING (bucket_id = 'sales');
CREATE POLICY "Admin manage sales images" ON storage.objects
  FOR ALL USING (bucket_id = 'sales' AND auth.jwt()->'user_metadata'->>'is_admin' = 'true');

CREATE POLICY "Public read gallery images" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin manage gallery images" ON storage.objects
  FOR ALL USING (bucket_id = 'gallery' AND auth.jwt()->'user_metadata'->>'is_admin' = 'true');
