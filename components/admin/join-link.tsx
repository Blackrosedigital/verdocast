"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function JoinLinkInner({ joinUrl }: { joinUrl: string }) {
  const [copied, setCopied] = useState(false);
  const params = useSearchParams();
  const { toast } = useToast();
  const toasted = useRef(false);

  // Fire the "league is ready" toast once, right after onboarding.
  useEffect(() => {
    if (toasted.current) return;
    if (params.get("welcome")) {
      toasted.current = true;
      toast({
        title: "Your league is ready! 🎉",
        description: `Share this link to invite your team: ${joinUrl}`,
      });
    }
  }, [params, toast, joinUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn’t copy", description: joinUrl });
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={joinUrl} className="font-mono text-sm" />
      <Button variant="secondary" onClick={copy} className="shrink-0">
        {copied ? (
          <>
            <Check className="size-4" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-4" /> Copy
          </>
        )}
      </Button>
    </div>
  );
}

export function JoinLink({ joinUrl }: { joinUrl: string }) {
  return (
    <Suspense fallback={null}>
      <JoinLinkInner joinUrl={joinUrl} />
    </Suspense>
  );
}
