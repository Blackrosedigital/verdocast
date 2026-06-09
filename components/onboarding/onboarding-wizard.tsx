"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/lib/onboarding-actions";
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

export function OnboardingWizard({
  sessionId,
  defaultOrgName,
}: {
  sessionId: string;
  defaultOrgName: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState(defaultOrgName);
  const [leagueName, setLeagueName] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function goNext() {
    if (!orgName.trim()) {
      toast({ title: "Add your company name to continue." });
      return;
    }
    setStep(2);
  }

  function submit() {
    if (!leagueName.trim()) {
      toast({ title: "Give your league a name to finish." });
      return;
    }
    startTransition(async () => {
      // On success this redirects server-side; we only get a value back on error.
      const result = await completeOnboarding({
        sessionId,
        orgName: orgName.trim(),
        leagueName: leagueName.trim(),
      });
      if (result && !result.ok) {
        toast({
          title: "Something went wrong",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="w-full max-w-md border-border bg-surface">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Step {step} of 2
        </p>
        <CardTitle className="font-display text-3xl tracking-wide">
          {step === 1 ? "Name your company" : "Name your first league"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? "This is how your league will be branded for employees."
            : "Pick something fun — you can run more leagues later."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {step === 1 ? (
          <div className="space-y-2">
            <label
              htmlFor="orgName"
              className="text-sm font-medium text-foreground"
            >
              Company name
            </label>
            <Input
              id="orgName"
              value={orgName}
              autoFocus
              placeholder="Acme Inc."
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
            />
            <Button className="w-full" onClick={goNext}>
              Continue
            </Button>
          </div>
        ) : (
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
              autoFocus
              placeholder="The Office World Cup"
              onChange={(e) => setLeagueName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={pending}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={submit}
                disabled={pending}
              >
                {pending ? "Creating…" : "Create league"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
