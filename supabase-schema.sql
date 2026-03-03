-- ============================================
-- Supabase Schema — Badge Collection Site
-- ============================================
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)

-- 1. Tables
-- ---------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete set null,
  twitch_id text unique,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table badges (
  id bigserial primary key,
  username text not null references profiles(username) on delete cascade,
  season text not null,
  rarity text not null check (rarity in ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'UNIQUE')),
  obtained_at timestamptz default now()
);

create table trades (
  id uuid primary key default gen_random_uuid(),
  from_user text not null references profiles(username),
  to_user text not null references profiles(username),
  from_badge_season text not null,
  from_badge_rarity text not null,
  to_badge_season text not null,
  to_badge_rarity text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now(),
  resolved_at timestamptz,
  constraint no_self_trade check (from_user != to_user)
);

-- 2. Indexes
-- ----------

create index idx_badges_username on badges(username);
create index idx_badges_username_season on badges(username, season);
create index idx_trades_from on trades(from_user);
create index idx_trades_to on trades(to_user);
create index idx_trades_status on trades(status);

-- 3. Row Level Security
-- ---------------------

alter table profiles enable row level security;
alter table badges enable row level security;
alter table trades enable row level security;

create policy "public_read_profiles" on profiles for select using (true);
create policy "public_read_badges" on badges for select using (true);
create policy "public_read_trades" on trades for select using (true);

-- Service role (bot) can insert/update/delete everything (bypasses RLS)
-- Authenticated users go through RPC functions for writes

-- 4. Trigger: auto-create profile on Twitch signup
-- -------------------------------------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
  v_display_name text;
  v_avatar_url text;
  v_twitch_id text;
begin
  -- Extract username: try all possible metadata keys from Twitch OIDC
  v_username := lower(coalesce(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'sub',
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  -- Ultimate fallback: use part of the auth UUID
  if v_username is null or v_username = '' then
    v_username := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  v_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'preferred_username',
    v_username
  );
  v_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );
  v_twitch_id := coalesce(
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'sub'
  );

  -- Try to link to existing profile (created by bot migration)
  update profiles
  set auth_id = new.id,
      twitch_id = coalesce(v_twitch_id, twitch_id),
      display_name = coalesce(v_display_name, display_name),
      avatar_url = coalesce(v_avatar_url, avatar_url)
  where lower(username) = v_username and auth_id is null;

  -- If no existing profile found, create a new one
  if not found then
    insert into profiles (auth_id, twitch_id, username, display_name, avatar_url)
    values (new.id, v_twitch_id, v_username, v_display_name, v_avatar_url)
    on conflict (username) do update
    set auth_id = new.id,
        twitch_id = coalesce(excluded.twitch_id, profiles.twitch_id),
        display_name = coalesce(excluded.display_name, profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Also update profile on login (to refresh avatar, display name)
create or replace function handle_user_update()
returns trigger language plpgsql security definer as $$
declare
  v_display_name text;
  v_avatar_url text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );
  v_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  update profiles
  set display_name = coalesce(v_display_name, display_name),
      avatar_url = coalesce(v_avatar_url, avatar_url)
  where auth_id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function handle_user_update();

-- 5. RPC Functions
-- ----------------

-- Leaderboard
create or replace function get_leaderboard()
returns table (
  rank bigint,
  username text,
  display_name text,
  avatar_url text,
  total_pts bigint,
  badge_count bigint,
  top_rarity text
) language sql stable security definer as $$
  with user_stats as (
    select
      p.username,
      p.display_name,
      p.avatar_url,
      count(b.id) as badge_count,
      coalesce(sum(
        case b.rarity
          when 'COMMON' then 1
          when 'RARE' then 2
          when 'EPIC' then 3
          when 'LEGENDARY' then 5
          when 'UNIQUE' then 8
          else 0
        end
      ), 0) as total_pts,
      coalesce(
        (array_agg(b.rarity order by
          case b.rarity
            when 'UNIQUE' then 1
            when 'LEGENDARY' then 2
            when 'EPIC' then 3
            when 'RARE' then 4
            when 'COMMON' then 5
          end
        ) filter (where b.rarity is not null))[1],
        'NONE'
      ) as top_rarity
    from profiles p
    left join badges b on b.username = p.username
    group by p.id
  )
  select
    row_number() over (order by us.total_pts desc, us.badge_count desc) as rank,
    us.username,
    us.display_name,
    us.avatar_url,
    us.total_pts,
    us.badge_count,
    us.top_rarity
  from user_stats us
  where us.badge_count > 0
  order by us.total_pts desc, us.badge_count desc;
$$;

-- User profile (public)
create or replace function get_user_profile(p_username text)
returns json language plpgsql stable security definer as $$
declare
  v_profile profiles%rowtype;
  v_badges json;
  v_total_pts bigint;
  v_rank bigint;
begin
  select * into v_profile from profiles where lower(username) = lower(p_username);
  if not found then return null; end if;

  -- Group badges by season → { rarity_lowercase: count }
  select coalesce(json_object_agg(season, rarities), '{}'::json) into v_badges
  from (
    select season, json_object_agg(lower(rarity), cnt) as rarities
    from (
      select season, rarity, count(*) as cnt
      from badges where username = v_profile.username
      group by season, rarity
    ) sub
    group by season
  ) outer_sub;

  -- Points
  select coalesce(sum(
    case rarity
      when 'COMMON' then 1 when 'RARE' then 2 when 'EPIC' then 3
      when 'LEGENDARY' then 5 when 'UNIQUE' then 8 else 0
    end
  ), 0) into v_total_pts
  from badges where username = v_profile.username;

  -- Rank
  select count(*) + 1 into v_rank
  from (
    select b.username, sum(
      case b.rarity
        when 'COMMON' then 1 when 'RARE' then 2 when 'EPIC' then 3
        when 'LEGENDARY' then 5 when 'UNIQUE' then 8 else 0
      end
    ) as pts
    from badges b group by b.username
  ) sub
  where sub.pts > v_total_pts;

  return json_build_object(
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'badges', v_badges,
    'total_pts', v_total_pts,
    'rank', v_rank
  );
end;
$$;

-- My badges (authenticated, returns { season: [rarity, rarity, ...] })
create or replace function get_my_badges()
returns json language plpgsql stable security definer as $$
declare
  v_username text;
  v_badges json;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if not found then return null; end if;

  select coalesce(json_object_agg(season, rarities), '{}'::json) into v_badges
  from (
    select season, json_agg(rarity) as rarities
    from badges where username = v_username
    group by season
  ) sub;

  return v_badges;
end;
$$;

-- My trades (authenticated)
create or replace function get_my_trades()
returns json language plpgsql stable security definer as $$
declare
  v_username text;
  v_incoming json;
  v_outgoing json;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then
    return json_build_object('incoming', '[]'::json, 'outgoing', '[]'::json);
  end if;

  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  into v_incoming
  from trades t where t.to_user = v_username;

  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  into v_outgoing
  from trades t where t.from_user = v_username;

  return json_build_object('incoming', v_incoming, 'outgoing', v_outgoing);
end;
$$;

-- Create trade (authenticated)
create or replace function create_trade(
  p_to_user text,
  p_from_badge_season text,
  p_from_badge_rarity text,
  p_to_badge_season text,
  p_to_badge_rarity text
) returns uuid language plpgsql security definer as $$
declare
  v_from_user text;
  v_trade_id uuid;
begin
  select username into v_from_user from profiles where auth_id = auth.uid();
  if v_from_user is null then raise exception 'Not authenticated'; end if;
  if v_from_user = p_to_user then raise exception 'Cannot trade with yourself'; end if;

  if not exists (
    select 1 from badges
    where username = v_from_user and season = p_from_badge_season and rarity = p_from_badge_rarity
  ) then raise exception 'You do not own this badge'; end if;

  if not exists (
    select 1 from badges
    where username = p_to_user and season = p_to_badge_season and rarity = p_to_badge_rarity
  ) then raise exception 'Target user does not own this badge'; end if;

  insert into trades (from_user, to_user, from_badge_season, from_badge_rarity, to_badge_season, to_badge_rarity)
  values (v_from_user, p_to_user, p_from_badge_season, p_from_badge_rarity, p_to_badge_season, p_to_badge_rarity)
  returning id into v_trade_id;

  return v_trade_id;
end;
$$;

-- Accept trade (atomic badge swap)
create or replace function accept_trade(p_trade_id uuid)
returns void language plpgsql security definer as $$
declare
  v_username text;
  t trades%rowtype;
  v_from_badge_id bigint;
  v_to_badge_id bigint;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  select * into t from trades where id = p_trade_id and status = 'pending' for update;
  if not found then raise exception 'Trade not found or not pending'; end if;
  if t.to_user != v_username then raise exception 'Not your trade to accept'; end if;

  -- Lock specific badges for swap
  select id into v_from_badge_id from badges
  where username = t.from_user and season = t.from_badge_season and rarity = t.from_badge_rarity
  limit 1 for update;
  if not found then raise exception 'Sender no longer owns this badge'; end if;

  select id into v_to_badge_id from badges
  where username = t.to_user and season = t.to_badge_season and rarity = t.to_badge_rarity
  limit 1 for update;
  if not found then raise exception 'You no longer own this badge'; end if;

  -- Atomic swap
  update badges set username = t.to_user where id = v_from_badge_id;
  update badges set username = t.from_user where id = v_to_badge_id;

  -- Mark trade as accepted
  update trades set status = 'accepted', resolved_at = now() where id = p_trade_id;
end;
$$;

-- Reject trade
create or replace function reject_trade(p_trade_id uuid)
returns void language plpgsql security definer as $$
declare
  v_username text;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  update trades set status = 'rejected', resolved_at = now()
  where id = p_trade_id and to_user = v_username and status = 'pending';

  if not found then raise exception 'Trade not found or not authorized'; end if;
end;
$$;

-- Cancel trade
create or replace function cancel_trade(p_trade_id uuid)
returns void language plpgsql security definer as $$
declare
  v_username text;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  update trades set status = 'cancelled', resolved_at = now()
  where id = p_trade_id and from_user = v_username and status = 'pending';

  if not found then raise exception 'Trade not found or not authorized'; end if;
end;
$$;

-- Ensure profile exists (called from frontend after Twitch auth)
-- Replaces the trigger approach which caused "Database error saving new user"
create or replace function ensure_profile()
returns text language plpgsql security definer as $$
declare
  v_auth_user record;
  v_username text;
  v_display_name text;
  v_avatar_url text;
  v_twitch_id text;
begin
  select * into v_auth_user from auth.users where id = auth.uid();
  if not found then return null; end if;

  v_username := lower(coalesce(
    v_auth_user.raw_user_meta_data->>'preferred_username',
    v_auth_user.raw_user_meta_data->>'user_name',
    v_auth_user.raw_user_meta_data->>'nickname',
    v_auth_user.raw_user_meta_data->>'name',
    v_auth_user.raw_user_meta_data->>'sub',
    split_part(coalesce(v_auth_user.email, ''), '@', 1)
  ));

  if v_username is null or v_username = '' then
    v_username := 'user_' || left(replace(auth.uid()::text, '-', ''), 8);
  end if;

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
  update profiles
  set auth_id = auth.uid(),
      twitch_id = coalesce(v_twitch_id, twitch_id),
      display_name = coalesce(v_display_name, display_name),
      avatar_url = coalesce(v_avatar_url, avatar_url)
  where lower(username) = v_username and auth_id is null;

  -- If no existing profile found, create a new one
  if not found then
    insert into profiles (auth_id, twitch_id, username, display_name, avatar_url)
    values (auth.uid(), v_twitch_id, v_username, v_display_name, v_avatar_url)
    on conflict (username) do update
    set auth_id = auth.uid(),
        twitch_id = coalesce(excluded.twitch_id, profiles.twitch_id),
        display_name = coalesce(excluded.display_name, profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  end if;

  return v_username;
end;
$$;

-- External trade swap (called by bot's supabase_sync.py via service_role)
create or replace function accept_trade_external(
  p_from_user text,
  p_from_badge_season text,
  p_from_badge_rarity text,
  p_to_user text,
  p_to_badge_season text,
  p_to_badge_rarity text
) returns void language plpgsql security definer as $$
declare
  v_from_badge_id bigint;
  v_to_badge_id bigint;
begin
  -- Find and lock the specific badges
  select id into v_from_badge_id from badges
  where username = p_from_user and season = p_from_badge_season and rarity = p_from_badge_rarity
  limit 1 for update;
  if not found then raise exception 'From user badge not found'; end if;

  select id into v_to_badge_id from badges
  where username = p_to_user and season = p_to_badge_season and rarity = p_to_badge_rarity
  limit 1 for update;
  if not found then raise exception 'To user badge not found'; end if;

  -- Atomic swap
  update badges set username = p_to_user where id = v_from_badge_id;
  update badges set username = p_from_user where id = v_to_badge_id;
end;
$$;

-- 6. Lottery Tickets
-- ------------------

create table lottery_tickets (
  id uuid primary key default gen_random_uuid(),
  username text not null references profiles(username) on delete cascade,
  rarity text not null check (rarity in ('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'UNIQUE')),
  season text not null default 'saison2',
  scratched boolean not null default false,
  claimed_at timestamptz default now(),
  scratched_at timestamptz
);

create index idx_lottery_tickets_username on lottery_tickets(username);

alter table lottery_tickets enable row level security;
create policy "users_read_own_tickets" on lottery_tickets
  for select using (username = (select username from profiles where auth_id = auth.uid()));

-- Check if user can claim a ticket today
create or replace function can_claim_ticket()
returns boolean language plpgsql stable security definer as $$
declare
  v_username text;
  v_last_claim timestamptz;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then return false; end if;

  select max(claimed_at) into v_last_claim from lottery_tickets where username = v_username;
  return v_last_claim is null or v_last_claim::date < current_date;
end;
$$;

-- Claim a daily lottery ticket (rarity determined server-side, hidden until scratch)
create or replace function claim_ticket()
returns uuid language plpgsql security definer as $$
declare
  v_username text;
  v_last_claim timestamptz;
  v_rarity text;
  v_roll float;
  v_ticket_id uuid;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  select max(claimed_at) into v_last_claim from lottery_tickets where username = v_username;
  if v_last_claim is not null and v_last_claim::date >= current_date then
    raise exception 'Deja reclame aujourd''hui';
  end if;

  -- Weighted random: COMMON 50%, RARE 30%, EPIC 15%, LEGENDARY 4%, UNIQUE 1%
  v_roll := random();
  if v_roll < 0.01 then v_rarity := 'UNIQUE';
  elsif v_roll < 0.05 then v_rarity := 'LEGENDARY';
  elsif v_roll < 0.20 then v_rarity := 'EPIC';
  elsif v_roll < 0.50 then v_rarity := 'RARE';
  else v_rarity := 'COMMON';
  end if;

  insert into lottery_tickets (username, rarity, season)
  values (v_username, v_rarity, 'saison2')
  returning id into v_ticket_id;

  return v_ticket_id;
end;
$$;

-- Get user's tickets (rarity hidden for unscratched)
create or replace function get_my_tickets()
returns json language plpgsql stable security definer as $$
declare
  v_username text;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  return coalesce(
    (select json_agg(row_to_json(t) order by t.claimed_at desc)
     from (
       select
         id,
         case when scratched then rarity else null end as rarity,
         season,
         scratched,
         claimed_at,
         scratched_at
       from lottery_tickets
       where username = v_username
     ) t),
    '[]'::json
  );
end;
$$;

-- Scratch a ticket: reveal rarity, grant badge
create or replace function scratch_ticket(p_ticket_id uuid)
returns text language plpgsql security definer as $$
declare
  v_username text;
  v_ticket lottery_tickets%rowtype;
begin
  select username into v_username from profiles where auth_id = auth.uid();
  if v_username is null then raise exception 'Not authenticated'; end if;

  select * into v_ticket from lottery_tickets
  where id = p_ticket_id and username = v_username
  for update;

  if not found then raise exception 'Ticket introuvable'; end if;
  if v_ticket.scratched then raise exception 'Deja gratte'; end if;

  -- Mark as scratched
  update lottery_tickets
  set scratched = true, scratched_at = now()
  where id = p_ticket_id;

  -- Grant the badge
  insert into badges (username, season, rarity)
  values (v_username, v_ticket.season, v_ticket.rarity);

  return v_ticket.rarity;
end;
$$;

-- All usernames (for trade autocomplete)
create or replace function get_all_usernames()
returns text[] language sql stable security definer as $$
  select coalesce(array_agg(p.username order by p.username), '{}')
  from profiles p
  where exists (select 1 from badges b where b.username = p.username);
$$;

-- Global stats
create or replace function get_global_stats()
returns json language sql stable security definer as $$
  select json_build_object(
    'total_badges', (select count(*) from badges),
    'total_users', (select count(distinct username) from badges),
    'by_rarity', coalesce(
      (select json_object_agg(rarity, cnt)
       from (select rarity, count(*) as cnt from badges group by rarity) sub),
      '{}'::json
    )
  );
$$;
