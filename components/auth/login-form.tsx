"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/db-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function LoginForm({
  next = "/admin",
  allowSignup = false,
  cta = "Email me a sign-in link",
}: {
  next?: string;
  allowSignup?: boolean;
  cta?: string;
} = {}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function submit() {
    if (!email.trim()) {
      toast({ title: "Enter your email to continue." });
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          // Signup flows allow new accounts; re-auth (login) does not.
          shouldCreateUser: allowSignup,
        },
      });
      if (error) {
        toast({
          title: "Couldn’t send the link",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Check your email
        </h2>
        <p className="mt-3 text-muted-foreground">
          We sent a sign-in link to{" "}
          <span className="text-foreground">{email.trim().toLowerCase()}</span>.
          Open it on this device to continue.
        </p>
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
          autoFocus
          value={email}
          placeholder="you@company.com"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <Button className="w-full" onClick={submit} disabled={pending}>
        {pending ? "Sending…" : cta}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No passwords. We&rsquo;ll email you a magic link.
      </p>
    </div>
  );
}
