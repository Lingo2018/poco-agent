"use client";

import { Clock, Plus } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { PageHeaderShell } from "@/components/shared/page-header-shell";

interface ScheduledTasksHeaderProps {
  onAddClick?: () => void;
}

export function ScheduledTasksHeader({
  onAddClick,
}: ScheduledTasksHeaderProps) {
  const { t } = useT("translation");

  return (
    <PageHeaderShell
      left={
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <Clock
            className="hidden size-5 text-muted-foreground md:block"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight text-foreground">
              {t("library.scheduledTasks.page.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("library.scheduledTasks.description")}
            </p>
          </div>
        </div>
      }
      right={
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onAddClick}
        >
          <Plus className="size-4" />
          {t("library.scheduledTasks.page.create")}
        </Button>
      }
    />
  );
}
