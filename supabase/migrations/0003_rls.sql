-- ============================================================
-- 0003_rls — Row-Level Security policies
--
-- Identity is email-based: auth.jwt()->>'email' is matched to members.email
-- and organizations.owner_email. Server code uses the service role (bypasses
-- RLS); these policies govern any anon-key / client-side reads and are
-- defense-in-depth. SECURITY DEFINER helpers return the caller's visible league
-- / member ids without triggering recursive RLS on the members table.
-- ============================================================

-- League ids the caller belongs to (as a member).
create or replace function auth_member_league_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select league_id from members where email = (auth.jwt() ->> 'email')
$$;

-- League ids the caller owns (as the org owner / admin).
create or replace function auth_owned_league_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select l.id
  from leagues l
  join organizations o on o.id = l.organization_id
  where o.owner_email = (auth.jwt() ->> 'email')
$$;

-- Member ids visible to the caller (members of any league they can see).
create or replace function auth_visible_member_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from members
  where league_id in (select auth_member_league_ids())
     or league_id in (select auth_owned_league_ids())
$$;

-- organizations: owners can read their own orgs.
create policy "org_owner_select" on organizations
  for select using (owner_email = (auth.jwt() ->> 'email'));

-- licenses: owners can read their org's licenses.
create policy "license_owner_select" on licenses
  for select using (
    organization_id in (
      select id from organizations where owner_email = (auth.jwt() ->> 'email')
    )
  );

-- leagues: members and owners can read; owners can update.
create policy "league_select" on leagues
  for select using (
    id in (select auth_member_league_ids())
    or id in (select auth_owned_league_ids())
  );
create policy "league_owner_update" on leagues
  for update using (id in (select auth_owned_league_ids()))
  with check (id in (select auth_owned_league_ids()));

-- members: visible within leagues the caller can see.
create policy "member_select" on members
  for select using (
    league_id in (select auth_member_league_ids())
    or league_id in (select auth_owned_league_ids())
  );

-- predictions: visible for members the caller can see.
create policy "prediction_select" on predictions
  for select using (member_id in (select auth_visible_member_ids()));

-- Run the leaderboard view with the caller's permissions so the policies above
-- apply through it (Postgres 15+).
alter view leaderboard set (security_invoker = true);
