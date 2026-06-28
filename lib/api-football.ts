// On-demand reads of API-Football lineups + match statistics for a single
// fixture, used by the match detail page. Server-only (uses the secret key).
// Everything degrades to null on missing key / no data / error, so callers can
// fall back to a placeholder. Responses are cached for 5 minutes.

const API_BASE = "https://v3.football.api-sports.io";

export interface LineupPlayer {
  number: number | null;
  name: string;
  pos: string | null;
}

export interface TeamLineup {
  teamName: string;
  formation: string | null;
  coach: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface StatRow {
  type: string;
  home: string | number | null;
  away: string | number | null;
}

// Minimal shapes of the API-Football responses we consume.
interface ApiPlayerEntry {
  player?: { number?: number | null; name?: string | null; pos?: string | null };
}
interface ApiLineupTeam {
  team?: { name?: string | null };
  formation?: string | null;
  coach?: { name?: string | null } | null;
  startXI?: ApiPlayerEntry[];
  substitutes?: ApiPlayerEntry[];
}
interface ApiStatEntry {
  type?: string | null;
  value?: string | number | null;
}
interface ApiStatTeam {
  team?: { name?: string | null };
  statistics?: ApiStatEntry[];
}

async function apiGet<T>(path: string): Promise<T[] | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-apisports-key": key },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    const response = (json as { response?: unknown })?.response;
    return Array.isArray(response) ? (response as T[]) : null;
  } catch {
    return null;
  }
}

function mapPlayers(entries: ApiPlayerEntry[] | undefined): LineupPlayer[] {
  return (entries ?? []).map((e) => ({
    number: e.player?.number ?? null,
    name: e.player?.name ?? "",
    pos: e.player?.pos ?? null,
  }));
}

/** Starting XI, subs, formation and coach for both teams, or null if none yet. */
export async function getLineups(
  fixtureId: string,
): Promise<TeamLineup[] | null> {
  const resp = await apiGet<ApiLineupTeam>(
    `/fixtures/lineups?fixture=${fixtureId}`,
  );
  if (!resp || resp.length === 0) return null;
  return resp.map((t) => ({
    teamName: t.team?.name ?? "",
    formation: t.formation ?? null,
    coach: t.coach?.name ?? null,
    startXI: mapPlayers(t.startXI),
    substitutes: mapPlayers(t.substitutes),
  }));
}

/** Home/away match statistics aligned by stat type, or null if none yet. */
export async function getStatistics(
  fixtureId: string,
): Promise<StatRow[] | null> {
  const resp = await apiGet<ApiStatTeam>(
    `/fixtures/statistics?fixture=${fixtureId}`,
  );
  if (!resp || resp.length < 2) return null;
  const home = resp[0];
  const away = resp[1];
  if (!home || !away) return null;
  const homeMap = new Map<string, string | number | null>();
  const awayMap = new Map<string, string | number | null>();
  const order: string[] = [];
  for (const s of home.statistics ?? []) {
    if (!s.type) continue;
    if (!homeMap.has(s.type)) order.push(s.type);
    homeMap.set(s.type, s.value ?? null);
  }
  for (const s of away.statistics ?? []) {
    if (!s.type) continue;
    if (!homeMap.has(s.type) && !awayMap.has(s.type)) order.push(s.type);
    awayMap.set(s.type, s.value ?? null);
  }
  const rows = order.map((type) => ({
    type,
    home: homeMap.get(type) ?? null,
    away: awayMap.get(type) ?? null,
  }));
  // Drop rows where both sides are empty.
  return rows.filter((r) => r.home != null || r.away != null);
}
