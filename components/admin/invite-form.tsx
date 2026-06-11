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
  sent: "Emailed",
  link_only: "Copy link to share",
  failed: "Email failed — copy link",
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

  const shareable = (results ?? []).filter(
    (r) => r.joinUrl && (r.status === "failed" || r.status === "link_only"),
  );

  async function copyOne(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn’t copy", description: url });
    }
  }

  async function copyAll() {
    const text = shareable.map((r) => `${r.email}: ${r.joinUrl}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `Copied ${shareable.length} link(s)` });
    } catch {
      toast({ title: "Couldn’t copy" });
    }
  }

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
      const emailed = res.data.results.filter((r) => r.status === "sent").length;
      const links = res.data.results.filter(
        (r) => r.joinUrl && r.status !== "sent" && r.status !== "already_member",
      ).length;
      toast({
        title: `Processed ${res.data.results.length} invite(s)`,
        description: `${emailed} emailed · ${links} link(s) to copy · ${res.data.seatsRemaining} seat(s) left`,
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

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={pending}>
          {pending ? "Sending…" : `Send ${parsed.length || ""} invitation${parsed.length === 1 ? "" : "s"}`}
        </Button>
        {shareable.length > 0 && (
          <Button variant="secondary" onClick={copyAll}>
            Copy all {shareable.length} link{shareable.length === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      {results && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {results.map((r) => (
            <li
              key={r.email}
              className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-mono text-foreground">{r.email}</span>
              <span className="flex items-center gap-2 text-muted-foreground">
                {STATUS_LABEL[r.status]}
                {r.joinUrl && r.status !== "sent" && r.status !== "already_member" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyOne(r.joinUrl!)}
                  >
                    Copy link
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
