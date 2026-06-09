-- ============================================================
-- 0004_refunds — soft-delete support for refunds
-- On charge.refunded the Stripe webhook expires the license and soft-deletes
-- the org's leagues by stamping deleted_at. Reads filter on deleted_at is null.
-- ============================================================
alter table leagues add column if not exists deleted_at timestamptz;

create index if not exists idx_leagues_deleted_at on leagues(deleted_at);
