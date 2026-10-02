-- ==============================================================================
-- OPTIONAL SEED DATA FOR SUPABASE
-- Run this AFTER running schema.sql if you want initial test data in Supabase.
-- ==============================================================================

-- If running with standalone profiles (no auth.users constraint temporarily or after creating a user in auth):
-- Note: Replace the UUID below with your own Supabase Auth user ID if you have created one in Authentication -> Users.

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert dummy user into auth.users if running in local dev or if allowed
  -- Or insert directly into public.profiles if foreign key constraint allows:
  BEGIN
    INSERT INTO public.profiles (
      id, full_name, email, role, primary_medium, is_premium, location_city, location_country
    ) VALUES (
      v_user_id,
      'Sora Takahashi',
      'sora@studio-takahashi.jp',
      'Creator',
      'Cast Bronze & Kinetic Sculpture',
      true,
      'Kyoto',
      'Japan'
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'Note: Profile requires an existing auth.users record. Create a user in Supabase Auth first, then link their profile!';
  END;

  -- Insert Sample Artworks if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.artworks (
      creator_id, title, art_type, artist_name, description, image_url, price, status, dimensions, style
    ) VALUES 
    (
      v_user_id,
      'Resonance in Ochre IV',
      'Sculpture',
      'Sora Takahashi',
      'Cast bronze acoustic resonator with tuned sound chambers.',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      6800,
      'published',
      '120 x 85 x 40 cm',
      'Acoustic Brutalism'
    ),
    (
      v_user_id,
      'Cantilever 09',
      'Sculpture',
      'Sora Takahashi',
      'Forged patinated brass cantilever balance sculpture.',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      4200,
      'published',
      '95 x 45 x 30 cm',
      'Minimalist Kinetic'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
