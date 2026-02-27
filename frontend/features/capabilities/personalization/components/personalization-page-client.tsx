"use client";

import * as React from "react";
import { Save, Trash2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useCustomInstructionsStore } from "@/features/capabilities/personalization/hooks/use-custom-instructions-store";
import { CapabilityContentShell } from "@/features/capabilities/components/capability-content-shell";

export function PersonalizationPageClient() {
  const { t } = useT("translation");
  const store = useCustomInstructionsStore();

  const [enabled, setEnabled] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (initialized) return;
    if (!store.settings) return;
    setEnabled(Boolean(store.settings.enabled));
    setContent(store.settings.content || "");
    setInitialized(true);
  }, [initialized, store.settings]);

  const isEffectiveEnabled = React.useMemo(() => {
    return enabled && content.trim().length > 0;
  }, [enabled, content]);

  const emptyPlaceholder = React.useMemo(() => {
    return [
      t("library.personalization.customInstructions.description"),
      t("library.personalization.customInstructions.hintScope"),
    ].join("\n\n");
  }, [t]);

  const handleSave = React.useCallback(async () => {
    setEnabled(true);
    await store.save({ enabled: true, content });
    setInitialized(false);
  }, [content, store]);

  const handleClear = React.useCallback(async () => {
    setEnabled(false);
    setContent("");
    await store.clear();
    setInitialized(false);
  }, [store]);

  const handleInsertTemplate = React.useCallback(() => {
    if (content.trim().length > 0) return;
    setContent(t("library.personalization.customInstructions.editor.template"));
  }, [content, t]);

  const actionsDisabled = store.isLoading || store.isSaving;
  const canSave = content.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <CapabilityContentShell className="overflow-auto">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-base font-medium">
              {t("library.personalization.customInstructions.title")}
              <p className="text-xs text-muted-foreground">
                {t("library.personalization.customInstructions.description")}
              </p>
            </div>

            <div className="flex w-full flex-nowrap items-center justify-end gap-2 overflow-x-auto sm:w-auto">
              <span className="text-xs text-muted-foreground shrink-0">
                {isEffectiveEnabled
                  ? t(
                      "library.personalization.customInstructions.status.enabled",
                    )
                  : t(
                      "library.personalization.customInstructions.status.disabled",
                    )}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                  aria-label={t("library.personalization.header.clear")}
                  title={t("library.personalization.header.clear")}
                  disabled={actionsDisabled}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleSave}
                  aria-label={t("library.personalization.header.save")}
                  title={t("library.personalization.header.save")}
                  disabled={actionsDisabled || !canSave}
                >
                  <Save className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={emptyPlaceholder}
            className="mt-4 min-h-[360px] font-mono text-sm"
            disabled={actionsDisabled}
          />

          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{t("library.personalization.customInstructions.hintSecrets")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertTemplate}
              disabled={actionsDisabled}
              className="w-full sm:w-auto"
            >
              {t(
                "library.personalization.customInstructions.editor.insertTemplate",
              )}
            </Button>
          </div>
        </div>
      </CapabilityContentShell>
    </div>
  );
}
