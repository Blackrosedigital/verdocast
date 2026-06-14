import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

/**
 * Count predictions per member for a set of member ids. Paginates so it stays
 * correct past PostgREST's 1000-row default cap. Server-only (uses the admin
 * client). Returns a Map of member_id -> count (members with none are absent).
 */
export async function predictionCountsByMember(
  admin: SupabaseClient<Database>,
  memberIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (memberIds.length === 0) return counts;

  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data } = await admin
      .from("predictions")
      .select("member_id")
      .in("member_id", memberIds)
      .range(from, from + pageSize - 1);
    const rows = data ?? [];
    for (const r of rows) {
      counts.set(r.member_id, (counts.get(r.member_id) ?? 0) + 1);
    }
    if (rows.length < pageSize) break;
  }
  return counts;
}
