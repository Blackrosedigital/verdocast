"use client";

import { useMemo, useState, useTransition } from "react";
import { sendInvitations, type InviteResult } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

const STATUS_LABEL: Record<InviteResult["status"], string> = {
  sent: "Sent",
  link_only: "Link ready (email not configured)",
  failed: "Failed",
  already_member: "Already a member",
};

export function InviteForm({
  leagueId,
  seatsRemaining,
}: {
  leagueId: string;
  seatsRemaining: number;
}) {
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const parsed = useMemo(() => parseEmails(raw), [raw]);

  function submit() {
    if (parsed.length === 0) {
      toast({ title: "Add at least one email address." });
      return;
    }
    startTransition(async () => {
      const res = await sendInvitations(leagueId, parsed);
      if (!res.ok) {
        toast({
          title: "Couldn’t send invitations",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setResults(res.data.results);
      const sent = res.data.results.filter(
        (r) => r.status === "sent" || r.status === "link_only",
      ).length;
      toast({
        title: `Processed ${res.data.results.length} invite(s)`,
        description: `${sent} ready · ${res.data.seatsRemaining} seat(s) left`,
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="emails" className="text-sm font-medium text-foreground">
          Email addresses
        </label>
        <textarea
          id="emails"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder={"alex@acme.com\njordan@acme.com\n…or paste a CSV"}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-ring"
        />
        <p className="text-xs text-muted-foreground">
          {parsed.length} address{parsed.length === 1 ? "" : "es"} · one per line
          or comma/semicolon separated · {seatsRemaining} seat(s) left
        </p>
      </div>

      <Button onClick={submit} disabled={pending}>
        {pending ? "Sending…" : `Send ${parsed.length || ""} invitation${parsed.length === 1 ? "" : "s"}`}
      </Button>

      {results && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {results.map((r) => (
            <li
              key={r.email}
              className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-mono text-foreground">{r.email}</span>
              <span className="text-muted-foreground">
                {STATUS_LABEL[r.status]}
                {r.status === "link_only" && r.joinUrl && (
                  <a
                    href={r.joinUrl}
                    className="ml-2 text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    open link
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
