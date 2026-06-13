"use client";

import { useEffect, useState } from "react";

/**
 * Render a kickoff timestamp in the VIEWER's local timezone. The public pages
 * are server-rendered (UTC), so formatting there would show UTC to everyone.
 * These format on the client instead. First paint uses the server value (UTC);
 * the effect re-formats to local on mount — suppressHydrationWarning covers the
 * expected server/client text difference.
 */
function useLocalFormat(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const [text, setText] = useState(() =>
    new Date(iso).toLocaleString(undefined, opts),
  );
  useEffect(() => {
    setText(new Date(iso).toLocaleString(undefined, opts));
    // opts is a stable literal per call site; iso is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);
  return text;
}

/** Local time, e.g. "05:00". */
export function LocalTime({ iso }: { iso: string }) {
  const text = useLocalFormat(iso, { hour: "2-digit", minute: "2-digit" });
  return <span suppressHydrationWarning>{text}</span>;
}

/** Local date, e.g. "13 Jun". */
export function LocalDate({ iso }: { iso: string }) {
  const text = useLocalFormat(iso, { day: "numeric", month: "short" });
  return <span suppressHydrationWarning>{text}</span>;
}
