"use client";

import { useState, useTransition } from "react";
import { createFreeLeague } from "@/lib/free";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function CreateLeagueForm({ defaultOrgName }: { defaultOrgName: string }) {
  const [orgName, setOrgName] = useState(defaultOrgName);
  const [leagueName, setLeagueName] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function submit() {
    if (!orgName.trim() || !leagueName.trim()) {
      toast({ title: "Add a company/group name and a league name." });
      return;
    }
    startTransition(async () => {
      const result = await createFreeLeague({
        orgName: orgName.trim(),
        leagueName: leagueName.trim(),
      });
      if (result && !result.ok) {
        toast({
          title: "Couldn’t create your league",
          description: result.error,
          variant: "destructive",
        });
      }
      // On success the action redirects to the admin dashboard.
    });
  }

  return (
    <Card className="w-full max-w-md border-border bg-surface">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Free for the group stage
        </p>
        <CardTitle className="font-display text-3xl tracking-wide">
          Create your league
        </CardTitle>
        <CardDescription>
          Name your company or group and your league. You&rsquo;ll get a
          shareable join link straight away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="orgName" className="text-sm font-medium text-foreground">
            Company / group name
          </label>
          <Input
            id="orgName"
            value={orgName}
            autoFocus
            placeholder="Acme Inc."
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="leagueName"
            className="text-sm font-medium text-foreground"
          >
            League name
          </label>
          <Input
            id="leagueName"
            value={leagueName}
            placeholder="The Office World Cup"
            onChange={(e) => setLeagueName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <Button className="w-full" onClick={submit} disabled={pending}>
          {pending ? "Creating…" : "Create my league"}
        </Button>
      </CardContent>
    </Card>
  );
}
