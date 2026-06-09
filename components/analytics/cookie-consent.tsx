"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "vc_consent";
let initialized = false;

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (initialized || !key || typeof window === "undefined") return;
  initialized = true;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });
}

/**
 * Cookie-consent banner that gates analytics. PostHog only initialises after the
 * visitor accepts (and only if NEXT_PUBLIC_POSTHOG_KEY is set). Choice persists
 * in localStorage. Sentry (errors only, no PII) is consent-exempt by design.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored === "granted") {
      initPostHog();
      setChoice("granted");
    } else if (stored === "denied") {
      setChoice("denied");
    }
    setReady(true);
  }, []);

  function decide(value: "granted" | "denied") {
    window.localStorage.setItem(CONSENT_KEY, value);
    if (value === "granted") initPostHog();
    setChoice(value);
  }

  if (!ready || choice !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use privacy-friendly analytics to improve Verdocast. Okay to enable
          them?
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => decide("denied")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => decide("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
