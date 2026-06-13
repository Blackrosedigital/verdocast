"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeagueBranding } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function BrandingForm({
  slug,
  initialColor,
  initialLogo,
}: {
  slug: string;
  initialColor: string;
  initialLogo: string;
}) {
  const [brandColor, setBrandColor] = useState(initialColor);
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialLogo);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      const res = await updateLeagueBranding({ slug, brandColor, brandLogoUrl });
      if (!res.ok) {
        toast({
          title: "Couldn’t save branding",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Branding saved" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="brandColor" className="text-sm font-medium text-foreground">
            Accent colour (hex)
          </label>
          <div className="flex items-center gap-2">
            <span
              className="size-9 shrink-0 rounded-md border border-border"
              style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "transparent" }}
            />
            <Input
              id="brandColor"
              value={brandColor}
              placeholder="#e6ff3d"
              onChange={(e) => setBrandColor(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="brandLogoUrl" className="text-sm font-medium text-foreground">
            Logo URL
          </label>
          <Input
            id="brandLogoUrl"
            value={brandLogoUrl}
            placeholder="https://…/logo.png"
            onChange={(e) => setBrandLogoUrl(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save branding"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Shown on your league&rsquo;s join page (and across its pages). Leave blank
        to use the default Verdocast look.
      </p>
    </div>
  );
}
