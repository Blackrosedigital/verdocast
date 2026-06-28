"use client";

import { useEffect, useState } from "react";

function format(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Tomorrow, ${time}`;
  if (diff === -1) return `Yesterday, ${time}`;
  const label = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${label}, ${time}`;
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

/**
 * Viewer-local kickoff. Default: "Today, 20:00" / "Tomorrow, 21:30" /
 * "Tue 30 Jun, 02:00". With `full`: "Sunday 28 June, 20:00".
 */
export function KickoffLabel({ iso, full }: { iso: string; full?: boolean }) {
  const [text, setText] = useState(() => (full ? formatFull : format)(iso));
  useEffect(() => setText((full ? formatFull : format)(iso)), [iso, full]);
  return <span suppressHydrationWarning>{text}</span>;
}
