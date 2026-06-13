-- ============================================================
-- 0005_referrals — attribute member sign-ups to a referral source
-- A `?ref=` on a join link (e.g. a creator's code) is stored here so growth
-- can be measured per creator/channel. League branding columns (brand_color,
-- brand_logo_url) already exist from 0001.
-- ============================================================
alter table members add column if not exists referral_source text;

create index if not exists idx_members_referral_source on members(referral_source);
