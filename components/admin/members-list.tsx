"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateMemberName } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface AdminMember {
  id: string;
  displayName: string;
  email: string;
}

/** Owner-only member list with inline rename for each member. */
export function MembersList({
  slug,
  members,
}: {
  slug: string;
  members: AdminMember[];
}) {
  if (members.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No members yet - invite your team to get started.
      </p>
    );
  }
  return (
    <ul className="mt-4 divide-y divide-border">
      {members.map((m) => (
        <MemberRow key={m.id} slug={slug} member={m} />
      ))}
    </ul>
  );
}

function MemberRow({ slug, member }: { slug: string; member: AdminMember }) {
  const [name, setName] = useState(member.displayName);
  const [draft, setDraft] = useState(member.displayName);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast({ title: "Enter a name", variant: "destructive" });
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await adminUpdateMemberName({
        slug,
        memberId: member.id,
        displayName: trimmed,
      });
      if (!res.ok) {
        toast({
          title: "Couldn’t rename member",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setName(res.data.displayName);
      setEditing(false);
      toast({ title: "Member renamed" });
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      {editing ? (
        <>
          <Input
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-8 max-w-48"
            aria-label={`Rename ${member.email}`}
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
        </>
      ) : (
        <>
          <span className="flex-1 truncate">
            <span className="text-foreground">{name}</span>
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {member.email}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="text-[11px] uppercase tracking-widest text-muted-foreground underline hover:text-foreground"
          >
            Rename
          </button>
        </>
      )}
    </li>
  );
}
