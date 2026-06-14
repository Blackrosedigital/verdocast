"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeMember } from "@/lib/league-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface RosterMember {
  id: string;
  displayName: string;
  predictions: number;
  isOwner: boolean;
}

/** Owner-facing member roster: display names + prediction progress + remove. */
export function MemberRoster({
  slug,
  members,
}: {
  slug: string;
  members: RosterMember[];
}) {
  if (members.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No members yet - share your link to get your team in.
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

function MemberRow({ slug, member }: { slug: string; member: RosterMember }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function remove() {
    if (
      !window.confirm(
        `Remove ${member.displayName}? Their predictions will be deleted. This can't be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await removeMember({ slug, memberId: member.id });
      if (!res.ok) {
        toast({
          title: "Couldn’t remove member",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: `${member.displayName} removed` });
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span className="flex-1 truncate text-foreground">
        {member.displayName}
        {member.isOwner && (
          <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            owner
          </span>
        )}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {member.predictions > 0 ? `${member.predictions} predicted` : "Not started"}
      </span>
      {!member.isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={remove}
          disabled={pending}
          className="shrink-0"
        >
          {pending ? "Removing…" : "Remove"}
        </Button>
      )}
    </li>
  );
}
