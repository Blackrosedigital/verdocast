"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { nudgeNonPredictors } from "@/lib/league-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Emails a reminder to members who haven't predicted yet. */
export function NudgeButton({
  slug,
  count,
}: {
  slug: string;
  count: number;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function nudge() {
    startTransition(async () => {
      const res = await nudgeNonPredictors({ slug });
      if (!res.ok) {
        toast({
          title: "Couldn’t send reminders",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      const { sent, remaining, skipped } = res.data;
      if (skipped && sent === 0) {
        toast({
          title: "Email isn’t configured",
          description: "Reminders couldn’t be sent. Check your email setup.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Reminder sent to ${sent} member${sent === 1 ? "" : "s"}`,
          description:
            remaining > 0
              ? `${remaining} more to go - run it again to nudge the rest.`
              : undefined,
        });
      }
      router.refresh();
    });
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={nudge}
      disabled={pending || count === 0}
    >
      {pending
        ? "Sending…"
        : count > 0
          ? `Nudge ${count} who haven’t predicted`
          : "Everyone has predicted"}
    </Button>
  );
}
