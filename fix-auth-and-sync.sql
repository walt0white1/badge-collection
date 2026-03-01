-- ============================================
-- FIX: Drop triggers + Add ensure_profile + accept_trade_external
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the problematic triggers that cause "Database error saving new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 2. Also delete any failed auth user (if you tried logging in before)
-- Check Authentication → Users in Supabase dashboard and delete manually if present

-- 3. ensure_profile() — called from frontend after Twitch auth succeeds
CREATE OR REPLACE FUNCTION ensure_profile()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_auth_user record;
  v_username text;
  v_display_name text;
  v_avatar_url text;
  v_twitch_id text;
BEGIN
  SELECT * INTO v_auth_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_username := lower(coalesce(
    v_auth_user.raw_user_meta_data->>'preferred_username',
    v_auth_user.raw_user_meta_data->>'user_name',
    v_auth_user.raw_user_meta_data->>'nickname',
    v_auth_user.raw_user_meta_data->>'name',
    v_auth_user.raw_user_meta_data->>'sub',
    split_part(coalesce(v_auth_user.email, ''), '@', 1)
  ));

  IF v_username IS NULL OR v_username = '' THEN
    v_username := 'user_' || left(replace(auth.uid()::text, '-', ''), 8);
  END IF;

  v_display_name := coalesce(
    v_auth_user.raw_user_meta_data->>'full_name',
    v_auth_user.raw_user_meta_data->>'name',
    v_auth_user.raw_user_meta_data->>'preferred_username',
    v_username
  );
  v_avatar_url := coalesce(
    v_auth_user.raw_user_meta_data->>'avatar_url',
    v_auth_user.raw_user_meta_data->>'picture'
  );
  v_twitch_id := coalesce(
    v_auth_user.raw_user_meta_data->>'provider_id',
    v_auth_user.raw_user_meta_data->>'sub'
  );

  -- Try to link to existing profile (created by bot migration)
  UPDATE profiles
  SET auth_id = auth.uid(),
      twitch_id = coalesce(v_twitch_id, twitch_id),
      display_name = coalesce(v_display_name, display_name),
      avatar_url = coalesce(v_avatar_url, avatar_url)
  WHERE lower(username) = v_username AND auth_id IS NULL;

  -- If no existing profile found, create a new one
  IF NOT FOUND THEN
    INSERT INTO profiles (auth_id, twitch_id, username, display_name, avatar_url)
    VALUES (auth.uid(), v_twitch_id, v_username, v_display_name, v_avatar_url)
    ON CONFLICT (username) DO UPDATE
    SET auth_id = auth.uid(),
        twitch_id = coalesce(excluded.twitch_id, profiles.twitch_id),
        display_name = coalesce(excluded.display_name, profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  END IF;

  RETURN v_username;
END;
$$;

-- 4. accept_trade_external() — atomic badge swap called by bot's supabase_sync.py
CREATE OR REPLACE FUNCTION accept_trade_external(
  p_from_user text,
  p_from_badge_season text,
  p_from_badge_rarity text,
  p_to_user text,
  p_to_badge_season text,
  p_to_badge_rarity text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_from_badge_id bigint;
  v_to_badge_id bigint;
BEGIN
  -- Find and lock the specific badges
  SELECT id INTO v_from_badge_id FROM badges
  WHERE username = p_from_user AND season = p_from_badge_season AND rarity = p_from_badge_rarity
  LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'From user badge not found'; END IF;

  SELECT id INTO v_to_badge_id FROM badges
  WHERE username = p_to_user AND season = p_to_badge_season AND rarity = p_to_badge_rarity
  LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'To user badge not found'; END IF;

  -- Atomic swap
  UPDATE badges SET username = p_to_user WHERE id = v_from_badge_id;
  UPDATE badges SET username = p_from_user WHERE id = v_to_badge_id;
END;
$$;
