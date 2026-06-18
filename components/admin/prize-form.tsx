"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeaguePrize } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/** Owner sets the league prize + how many top players qualify for it. */
export function PrizeForm({
  slug,
  initialPrize,
  initialQualifyCount,
}: {
  slug: string;
  initialPrize: string;
  initialQualifyCount: number;
}) {
  const [prize, setPrize] = useState(initialPrize);
  const [qualify, setQualify] = useState(String(initialQualifyCount));
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function save() {
    const n = Number.parseInt(qualify, 10);
    const qualifyCount = Number.isFinite(n) ? Math.min(50, Math.max(0, n)) : 0;
    startTransition(async () => {
      const res = await updateLeaguePrize({
        slug,
        prize: prize.trim(),
        qualifyCount,
      });
      if (!res.ok) {
        toast({
          title: "Couldn’t save the prize",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Prize saved" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="prize" className="text-sm font-medium text-foreground">
          Prize
        </label>
        <Input
          id="prize"
          value={prize}
          maxLength={140}
          placeholder="e.g. Team lunch on me 🍕"
          onChange={(e) => setPrize(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="qualify" className="text-sm font-medium text-foreground">
          How many top players qualify? (0 = off)
        </label>
        <Input
          id="qualify"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          value={qualify}
          onChange={(e) => setQualify(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="max-w-28 font-mono"
        />
      </div>
      <Button onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save prize"}
      </Button>
      <p className="text-xs text-muted-foreground">
        The top players on your leaderboard get a &ldquo;Q&rdquo; badge and play
        for the prize. Keep it free to enter and skill-based - no entry fees or
        cash pools.
      </p>
    </div>
  );
}
