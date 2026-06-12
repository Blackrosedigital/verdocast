"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/db-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Google button only shows once the provider is configured (set in Vercel).
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

export function LoginForm({
  next = "/admin",
  allowSignup = false,
}: {
  next?: string;
  allowSignup?: boolean;
} = {}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  function continueWithGoogle() {
    const supabase = createClient();
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
  }

  function sendCode() {
    const value = email.trim().toLowerCase();
    if (!value) {
      toast({ title: "Enter your email to continue." });
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          shouldCreateUser: allowSignup,
          // Keeps the email's magic link working as a fallback to the code.
          emailRedirectTo: callbackUrl(),
        },
      });
      if (error) {
        toast({
          title: "Couldn’t send the code",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setStage("code");
    });
  }

  function verifyCode() {
    const value = email.trim().toLowerCase();
    if (!code.trim()) {
      toast({ title: "Enter the 6-digit code." });
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: value,
        token: code.trim(),
        type: "email",
      });
      if (error) {
        toast({
          title: "Invalid or expired code",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      window.location.assign(next);
    });
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      {GOOGLE_ENABLED && (
        <>
          <Button
            variant="secondary"
            className="w-full"
            onClick={continueWithGoogle}
          >
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {stage === "email" ? (
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
            onKeyDown={(e) => e.key === "Enter" && sendCode()}
          />
          <Button className="w-full" onClick={sendCode} disabled={pending}>
            {pending ? "Sending…" : "Send code"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No passwords. We&rsquo;ll email you a 6-digit code.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            Enter the code sent to {email.trim().toLowerCase()}
          </label>
          <Input
            id="code"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={code}
            placeholder="123456"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
          <Button className="w-full" onClick={verifyCode} disabled={pending}>
            {pending ? "Verifying…" : "Verify & sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}
