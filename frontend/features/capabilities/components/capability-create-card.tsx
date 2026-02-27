"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CapabilityCreateCardProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function CapabilityCreateCard({
  label,
  onClick,
  disabled = false,
  className,
}: CapabilityCreateCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto min-h-[64px] w-full justify-start rounded-xl border border-dashed border-border/70 bg-card px-4 py-3 text-left cursor-default hover:cursor-pointer hover:bg-card hover:shadow-sm",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Plus className="size-4" />
        <span className="font-medium">{label}</span>
      </span>
    </Button>
  );
}
