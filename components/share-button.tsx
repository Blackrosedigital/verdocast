"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Share via the native share sheet (mobile) with a clipboard fallback (desktop).
 * The viral primitive: a Wordle-style line + a join link.
 */
export function ShareButton({
  text,
  url,
  label = "Share",
  variant = "default",
}: {
  text: string;
  url: string;
  label?: string;
  variant?: "default" | "secondary" | "outline";
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function onClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // user cancelled the share sheet — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied — paste it anywhere" });
    } catch {
      toast({ title: "Share this", description: `${text} ${url}` });
    }
  }

  return (
    <Button onClick={onClick} variant={variant} className="shrink-0">
      {copied ? (
        <>
          <Check className="size-4" /> Copied
        </>
      ) : (
        <>
          <Share2 className="size-4" /> {label}
        </>
      )}
    </Button>
  );
}
