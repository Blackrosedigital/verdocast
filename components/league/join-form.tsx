"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { joinLeague } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function JoinForm({
  code,
  email: initialEmail,
  sig,
  emailLocked,
  leagueName,
  referral = "",
}: {
  code: string;
  email: string;
  sig: string;
  emailLocked: boolean;
  leagueName: string;
  referral?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function submit() {
    if (!emailLocked && !email.trim()) {
      toast({ title: "Enter your email to join." });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: "Enter your name to join." });
      return;
    }
    startTransition(async () => {
      const res = await joinLeague({
        code,
        email: email.trim(),
        sig,
        displayName: displayName.trim(),
        ref: referral || undefined,
      });
      if (!res.ok) {
        toast({
          title: "Couldn’t join",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setJoined(true);
    });
  }

  if (joined) {
    return (
      <div className="text-center">
        <h2 className="font-display text-4xl tracking-wide text-foreground">
          You&rsquo;re in! 🎉
        </h2>
        <p className="mt-3 text-muted-foreground">
          You&rsquo;ve joined <span className="text-foreground">{leagueName}</span>.
          Make your predictions before each match kicks off.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/league/${code}/predict`}>Make your predictions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          readOnly={emailLocked}
          autoFocus={!emailLocked}
          placeholder="you@company.com"
          onChange={(e) => setEmail(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium text-foreground">
          Display name
        </label>
        <Input
          id="displayName"
          autoFocus={emailLocked}
          value={displayName}
          placeholder="Alex Morgan"
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <Button className="w-full" onClick={submit} disabled={pending}>
        {pending ? "Joining…" : `Join ${leagueName}`}
      </Button>
    </div>
  );
}
