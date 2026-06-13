"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Inline editor for the signed-in member's display name in a league.
 * Renders as the name with an "Edit" affordance; expands to an input on click.
 */
export function DisplayNameForm({
  code,
  initialName,
}: {
  code: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast({ title: "Enter your name", variant: "destructive" });
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateDisplayName({ code, displayName: trimmed });
      if (!res.ok) {
        toast({
          title: "Couldn’t update your name",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setName(res.data.displayName);
      setEditing(false);
      toast({ title: "Name updated" });
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span>{name}</span>
        <button
          type="button"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
          className="text-[11px] uppercase tracking-widest text-muted-foreground underline hover:text-foreground"
        >
          Edit
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <Input
        autoFocus
        value={draft}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-8 w-44"
        aria-label="Display name"
      />
      <Button size="sm" onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </span>
  );
}
