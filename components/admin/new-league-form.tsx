"use client";

import { useState, useTransition } from "react";
import { createAnotherLeague } from "@/lib/free";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/** Create an additional league under the current org (org already exists). */
export function NewLeagueForm() {
  const [leagueName, setLeagueName] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function submit() {
    if (!leagueName.trim()) {
      toast({ title: "Enter a league name." });
      return;
    }
    startTransition(async () => {
      const res = await createAnotherLeague({ leagueName: leagueName.trim() });
      // On success the action redirects to the new league's dashboard.
      if (res && !res.ok) {
        toast({
          title: "Couldn’t create the league",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={leagueName}
        placeholder="e.g. Marketing World Cup"
        onChange={(e) => setLeagueName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        aria-label="New league name"
      />
      <Button onClick={submit} disabled={pending} className="shrink-0">
        {pending ? "Creating…" : "Create league"}
      </Button>
    </div>
  );
}
