-- ==============================================================================
-- SUPABASE DATABASE SCHEMA FOR ADMIN PANEL & ARTWORK MARKETPLACE
-- ==============================================================================
-- Run this script directly in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click "Run"
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE 1: PROFILES (Users, Creators, Admins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text,
  role text NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User', 'Creator')),
  location_country text,
  location_city text,
  portfolio_url text,
  about_me text,
  profile_pic_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  cover_image_url text,
  primary_medium text,
  artist_statement text,
  art_forms text,
  awards text,
  other_links text
);

-- ==============================================================================
-- TABLE 2: ARTWORKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.artworks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  art_type text NOT NULL DEFAULT 'Sculpture',
  artist_name text NOT NULL,
  description text,
  external_link text,
  image_url text NOT NULL,
  price numeric,
  status text NOT NULL DEFAULT 'Available' CHECK (
    status IN ('Available', 'For Sale', 'Not for sale', 'Sold', 'published', 'pending', 'draft', 'rejected')
  ),
  created_at timestamptz DEFAULT now(),
  additional_images text[] DEFAULT '{}'::text[],
  year text,
  dimensions text,
  location text,
  style text,
  tags text[] DEFAULT '{}'::text[],
  collection text,
  price_visibility text DEFAULT 'Show Price' CHECK (
    price_visibility IN ('Show Price', 'Price on Request', 'Hide Price')
  ),
  is_published boolean DEFAULT true
);

-- ==============================================================================
-- TABLE 3: INQUIRIES & CHATS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inquiries_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- TABLE 4: MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.inquiries_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- TABLE 5: COR MEMBERS (Circle of Resonance - optional admin module)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cor_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  joined_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- TABLE 6: JOBS & COMMISSIONS (optional admin module)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  type text NOT NULL DEFAULT 'Full-time',
  location text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- TABLE 7: APPLICATIONS (optional admin module)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'rejected')),
  applied_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_artworks_creator_id ON public.artworks(creator_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON public.artworks(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_chats_artwork ON public.inquiries_chats(artwork_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_chats_creator ON public.inquiries_chats(creator_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_chats_guest ON public.inquiries_chats(guest_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cor_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Anyone can view profiles; users can update their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 2. Artworks: Anyone can view artworks; creators can manage their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artworks are viewable by everyone' AND tablename = 'artworks') THEN
    CREATE POLICY "Artworks are viewable by everyone" ON public.artworks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can insert artworks' AND tablename = 'artworks') THEN
    CREATE POLICY "Creators can insert artworks" ON public.artworks FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can update their artworks' AND tablename = 'artworks') THEN
    CREATE POLICY "Creators can update their artworks" ON public.artworks FOR UPDATE USING (auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can delete their artworks' AND tablename = 'artworks') THEN
    CREATE POLICY "Creators can delete their artworks" ON public.artworks FOR DELETE USING (auth.uid() = creator_id);
  END IF;
END $$;

-- 3. Inquiries Chats: Participants can read/write chats
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view chats' AND tablename = 'inquiries_chats') THEN
    CREATE POLICY "Participants can view chats" ON public.inquiries_chats FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can start inquiries' AND tablename = 'inquiries_chats') THEN
    CREATE POLICY "Authenticated users can start inquiries" ON public.inquiries_chats FOR INSERT WITH CHECK (auth.uid() = guest_id);
  END IF;
END $$;

-- 4. Messages: Chat participants can read/send messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view messages' AND tablename = 'messages') THEN
    CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.inquiries_chats c 
        WHERE c.id = chat_id AND (c.guest_id = auth.uid() OR c.creator_id = auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can send messages' AND tablename = 'messages') THEN
    CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
      auth.uid() = sender_id AND EXISTS (
        SELECT 1 FROM public.inquiries_chats c 
        WHERE c.id = chat_id AND (c.guest_id = auth.uid() OR c.creator_id = auth.uid())
      )
    );
  END IF;
END $$;

-- 5. Jobs & CoR: Public viewable, authenticated can apply
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Jobs viewable by everyone' AND tablename = 'jobs') THEN
    CREATE POLICY "Jobs viewable by everyone" ON public.jobs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'CoR viewable by everyone' AND tablename = 'cor_members') THEN
    CREATE POLICY "CoR viewable by everyone" ON public.cor_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Applications viewable by applicant' AND tablename = 'applications') THEN
    CREATE POLICY "Applications viewable by applicant" ON public.applications FOR SELECT USING (auth.uid() = creator_id);
  END IF;
END $$;

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (When user signs up via auth)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
