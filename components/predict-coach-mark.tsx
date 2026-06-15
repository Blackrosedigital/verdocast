"use client";

import { useEffect, useState } from "react";

const KEY = "vc_predict_coach_dismissed";

/**
 * One-time hint that scores save automatically (the autosave is great but not
 * obvious). Dismissed state persists in localStorage. Render only for members
 * who haven't predicted yet.
 */
export function PredictCoachMark() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Tip:</span> type a score for
        each match and it saves automatically — no submit button. You can change
        it any time before kickoff.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="shrink-0 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        Got it
      </button>
    </div>
  );
}
