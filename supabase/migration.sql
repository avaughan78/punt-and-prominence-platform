-- ============================================================
-- Punt & Prominence Platform — Database Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('business', 'creator')),
  display_name      text NOT NULL,
  bio               text,
  instagram_handle  text,
  website_url       text,
  avatar_url        text,
  business_name     text,
  address_line      text,
  category          text,
  has_card_on_file  boolean NOT NULL DEFAULT false,
  card_last_four    text,
  is_approved       boolean NOT NULL DEFAULT false,
  is_suspended      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- OFFERS
CREATE TABLE IF NOT EXISTS public.offers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL,
  category      text NOT NULL,
  value_gbp     numeric(8,2) NOT NULL,
  requirements  text,
  slots_total   int NOT NULL DEFAULT 1,
  slots_claimed int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id      uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  creator_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id   uuid NOT NULL REFERENCES public.profiles(id),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'visited', 'posted', 'completed', 'verified')),
  punt_code     text NOT NULL UNIQUE,
  post_url      text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, creator_id)
);

-- INVITE CODES (pilot gating)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  used        boolean NOT NULL DEFAULT false,
  used_by     uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-increment slots_claimed when a match is created
CREATE OR REPLACE FUNCTION public.handle_match_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.offers SET slots_claimed = slots_claimed + 1 WHERE id = NEW.offer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_created ON public.matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_match_insert();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- OFFERS
CREATE POLICY "offers_select" ON public.offers
  FOR SELECT USING (is_active = true OR business_id = auth.uid());

CREATE POLICY "offers_insert" ON public.offers
  FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "offers_update" ON public.offers
  FOR UPDATE USING (business_id = auth.uid());

CREATE POLICY "offers_delete" ON public.offers
  FOR DELETE USING (business_id = auth.uid());

-- MATCHES
CREATE POLICY "matches_select" ON public.matches
  FOR SELECT USING (creator_id = auth.uid() OR business_id = auth.uid());

CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "matches_update" ON public.matches
  FOR UPDATE USING (creator_id = auth.uid() OR business_id = auth.uid());

-- INVITE CODES (read-only for authenticated users, write for service role)
CREATE POLICY "invite_codes_select" ON public.invite_codes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SEED INVITE CODES (edit these before running)
-- ============================================================
INSERT INTO public.invite_codes (code) VALUES
  ('CAMBRIDGE2025'),
  ('MILLROAD2025'),
  ('PUNTER2025');
