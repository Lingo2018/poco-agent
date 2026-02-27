"use client";

import * as React from "react";

import { Coins } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { UsageStats } from "@/types";

interface UsageTooltipProps {
  stats: UsageStats;
}

export function UsageTooltip({ stats }: UsageTooltipProps) {
  const { t } = useT("translation");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return t("usageTooltip.duration", { mins, secs });
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2 cursor-help">
          <Coins className="size-4 text-amber-500" />
          <span className="font-medium">{stats.credits.toLocaleString()}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-72">
        <div className="space-y-3">
          <div className="font-medium text-sm">
            Credits: {stats.credits.toLocaleString()}
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">
              {t("usageTooltip.currentSession")}:
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("usageTooltip.tokens")}:</span>
                <span className="font-medium text-foreground">
                  {stats.tokensUsed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("usageTooltip.duration")}:</span>
                <span className="font-medium text-foreground">
                  {formatDuration(stats.duration)}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">
              {t("usageTooltip.usageStatistics")}:
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("usageTooltip.today")}:</span>
                <span className="font-medium text-foreground">
                  {stats.todayUsage.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("usageTooltip.thisWeek")}:</span>
                <span className="font-medium text-foreground">
                  {stats.weekUsage.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("usageTooltip.thisMonth")}:</span>
                <span className="font-medium text-foreground">
                  {stats.monthUsage.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
