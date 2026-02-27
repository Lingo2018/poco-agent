"use client";

import * as React from "react";
import { Settings, Trash2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import type { SlashCommand } from "@/features/capabilities/slash-commands/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { StaggeredList } from "@/components/ui/staggered-entrance";
import { CapabilityCreateCard } from "@/features/capabilities/components/capability-create-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SlashCommandsListProps {
  commands: SlashCommand[];
  savingId?: number | null;
  isLoading?: boolean;
  onToggleEnabled?: (commandId: number, enabled: boolean) => void;
  onEdit?: (command: SlashCommand) => void;
  onDelete?: (command: SlashCommand) => void;
  createCardLabel?: string;
  onCreate?: () => void;
  toolbarSlot?: React.ReactNode;
}

export function SlashCommandsList({
  commands,
  savingId,
  isLoading = false,
  onToggleEnabled,
  onEdit,
  onDelete,
  createCardLabel,
  onCreate,
  toolbarSlot,
}: SlashCommandsListProps) {
  const { t } = useT("translation");
  const hoverActionsClass =
    "flex items-center gap-2 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto";
  const enabledCount = commands.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-muted/50 px-5 py-3 flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
        <span className="text-sm text-muted-foreground">
          {t("library.slashCommands.enabled")}: {enabledCount}
        </span>
        {toolbarSlot ? (
          <div className="flex flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto">
            {toolbarSlot}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {createCardLabel ? (
          <CapabilityCreateCard label={createCardLabel} onClick={onCreate} />
        ) : null}

        {isLoading && commands.length === 0 ? (
          <SkeletonShimmer count={5} itemClassName="min-h-[64px]" gap="md" />
        ) : commands.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-6 text-sm text-muted-foreground text-center">
            {t("library.slashCommands.empty")}
          </div>
        ) : (
          <StaggeredList
            items={commands}
            show={!isLoading}
            keyExtractor={(cmd) => cmd.id}
            staggerDelay={50}
            duration={400}
            renderItem={(cmd) => {
              const busy = savingId === cmd.id;
              const modeLabel =
                cmd.mode === "structured"
                  ? t("library.slashCommands.mode.structured")
                  : t("library.slashCommands.mode.raw");

              return (
                <div className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 min-h-[64px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium font-mono">/{cmd.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {modeLabel}
                      </Badge>
                    </div>
                    {cmd.description ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {cmd.description}
                      </p>
                    ) : null}
                    {cmd.argument_hint ? (
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                        {cmd.argument_hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={hoverActionsClass}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit?.(cmd)}
                        disabled={busy}
                        title={t("common.edit")}
                      >
                        <Settings className="size-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={busy}
                            title={t("common.delete")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("library.slashCommands.delete.title")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("library.slashCommands.delete.description")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("common.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete?.(cmd)}>
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Switch
                      checked={cmd.enabled}
                      onCheckedChange={(checked) =>
                        onToggleEnabled?.(cmd.id, checked)
                      }
                      disabled={busy}
                    />
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
