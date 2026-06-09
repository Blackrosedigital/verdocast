"use client";

import { useTransition } from "react";
import { startCheckout } from "@/lib/checkout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CheckoutButton({
  tierId,
  children,
  className,
  variant = "default",
}: {
  tierId: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function onClick() {
    startTransition(async () => {
      const result = await startCheckout(tierId);
      if (result.ok) {
        window.location.assign(result.data.url);
        return;
      }
      toast({
        title: "Checkout unavailable",
        description: result.error,
        variant: "destructive",
      });
    });
  }

  return (
    <Button
      onClick={onClick}
      disabled={pending}
      variant={variant}
      className={cn("w-full", className)}
    >
      {pending ? "Starting…" : children}
    </Button>
  );
}
