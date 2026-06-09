-- ============================================================
-- 0002_prediction_lockdown
-- The original lockdown trigger blocked ALL prediction updates after kickoff,
-- which would also block the scoring engine from writing points_earned (matches
-- are scored after kickoff). Allow post-kickoff updates that DON'T change the
-- predicted scoreline; still lock member score edits and new picks after kickoff.
-- ============================================================
create or replace function enforce_prediction_lockdown()
returns trigger as $$
declare
  v_kickoff timestamptz;
begin
  -- Allow system writes that leave the predicted scoreline unchanged
  -- (e.g. points_earned after the match finishes).
  if tg_op = 'UPDATE'
     and new.home_score = old.home_score
     and new.away_score = old.away_score then
    new.updated_at := now();
    return new;
  end if;

  select kickoff_utc into v_kickoff from matches where id = new.match_id;
  if v_kickoff is null then
    raise exception 'Match % not found', new.match_id;
  end if;
  if now() >= v_kickoff then
    raise exception 'Predictions locked: match kicked off at %', v_kickoff;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
