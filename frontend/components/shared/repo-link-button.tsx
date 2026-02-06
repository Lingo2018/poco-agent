"use client";

import type { ComponentProps } from "react";
import { Github } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/poco-ai/poco-agent";

export function RepoLinkButton({
  variant = "ghost",
  size = "sm",
  className,
}: {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const { t } = useT("translation");

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      asChild
    >
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={t("header.repoLink")}
        title={REPO_URL}
      >
        <Github className="size-4" />
      </a>
    </Button>
  );
}
