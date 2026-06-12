"use client";

import { useEffect } from "react";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

/**
 * Windows (and some other platforms) don't render country-flag emoji - they
 * show the two-letter code instead. This injects a flag-capable web font
 * ("Twemoji Country Flags") only where needed, so flags render everywhere.
 * Pair with the font prepended to the Tailwind sans stack.
 */
export function FlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);
  return null;
}
