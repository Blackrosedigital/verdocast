"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLeaderboard,
  getMemberPredictions,
  type LeaderboardRow,
  type MemberPredictionRow,
} from "@/lib/leaderboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LIVE_INTERVAL = 30_000;
const IDLE_INTERVAL = 300_000;

export function Leaderboard({
  code,
  initialRows,
  initialLiveCount,
}: {
  code: string;
  initialRows: LeaderboardRow[];
  initialLiveCount: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [liveCount, setLiveCount] = useState(initialLiveCount);
  const [openMember, setOpenMember] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const res = await getLeaderboard(code);
    if (res.ok) {
      setRows(res.data.rows);
      setLiveCount(res.data.liveCount);
    }
  }, [code]);

  useEffect(() => {
    const interval = liveCount > 0 ? LIVE_INTERVAL : IDLE_INTERVAL;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [liveCount, refresh]);

  return (
    <div>
      {liveCount > 0 && (
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span
            className="inline-block size-2 animate-pulse rounded-full"
            style={{ backgroundColor: "var(--accent-2)" }}
          />
          {liveCount} match{liveCount === 1 ? "" : "es"} live · updating every 30s
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 text-right font-medium">Pts</th>
              <th className="px-4 py-3 text-right font-medium">Exact</th>
              <th className="px-4 py-3 text-right font-medium">Played</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.member_id}
                onClick={() =>
                  setOpenMember({ id: r.member_id, name: r.display_name })
                }
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {r.display_name}
                </td>
                <td className="px-4 py-3 text-right font-mono text-lg text-primary">
                  {r.total_points}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {r.exact_scores}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {r.matches_scored}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MemberDrawer
        code={code}
        member={openMember}
        onClose={() => setOpenMember(null)}
      />
    </div>
  );
}

function MemberDrawer({
  code,
  member,
  onClose,
}: {
  code: string;
  member: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<MemberPredictionRow[] | null>(null);

  useEffect(() => {
    if (!member) {
      setRows(null);
      return;
    }
    let active = true;
    setRows(null);
    getMemberPredictions(code, member.id).then((res) => {
      if (active && res.ok) setRows(res.data.rows);
    });
    return () => {
      active = false;
    };
  }, [code, member]);

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wide">
            {member?.name}&rsquo;s predictions
          </DialogTitle>
        </DialogHeader>
        {rows === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.matchId}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="flex-1 truncate text-right text-foreground">
                  {r.homeTeam}
                </span>
                <span className="font-mono text-muted-foreground">
                  {r.predicted
                    ? `${r.predicted.home}–${r.predicted.away}`
                    : "-"}
                </span>
                <span className="flex-1 truncate text-left text-foreground">
                  {r.awayTeam}
                </span>
                <span className="w-24 text-right font-mono text-xs text-muted-foreground">
                  {r.actual
                    ? `(${r.actual.home}–${r.actual.away})`
                    : ""}
                  {r.pointsEarned != null ? ` ${r.pointsEarned}pt` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
