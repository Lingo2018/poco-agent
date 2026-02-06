"use client";

import * as React from "react";

import { useT } from "@/lib/i18n/client";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCustomInstructionsStore } from "@/features/personalization/hooks/use-custom-instructions-store";
import { PersonalizationHeader } from "@/features/personalization/components/personalization-header";

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

  const handleSave = React.useCallback(async () => {
    await store.save({ enabled, content });
    setInitialized(false);
  }, [content, enabled, store]);

  const handleClear = React.useCallback(async () => {
    await store.clear();
    setInitialized(false);
  }, [store]);

  const handleRefresh = React.useCallback(async () => {
    await store.refresh();
    setInitialized(false);
  }, [store]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <PersonalizationHeader
        onSave={handleSave}
        onClear={handleClear}
        onRefresh={handleRefresh}
        isSaving={store.isSaving}
        isLoading={store.isLoading}
      />

      <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-base font-medium">
                  {t(
                    "library.personalization.customInstructions.title",
                    "自定义指令",
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t(
                    "library.personalization.customInstructions.description",
                    "这些指令会影响你后续所有任务的回复方式与行为。",
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Label className="text-sm text-muted-foreground">
                  {isEffectiveEnabled
                    ? t(
                        "library.personalization.customInstructions.status.enabled",
                        "已启用",
                      )
                    : t(
                        "library.personalization.customInstructions.status.disabled",
                        "未启用",
                      )}
                </Label>
                <Switch
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  disabled={store.isLoading || store.isSaving}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {t(
                "library.personalization.customInstructions.hintScope",
                "该设置为用户级全局：创建新会话、继续会话、定时任务都会生效。",
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {t(
                "library.personalization.customInstructions.hintSecrets",
                "不要在这里存放 API Key 等敏感信息。",
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium">
                {t(
                  "library.personalization.customInstructions.editor.label",
                  "指令内容",
                )}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (content.trim().length > 0) return;
                  setContent(
                    t(
                      "library.personalization.customInstructions.editor.template",
                    ),
                  );
                }}
                disabled={store.isLoading || store.isSaving}
              >
                {t(
                  "library.personalization.customInstructions.editor.insertTemplate",
                  "插入示例",
                )}
              </Button>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                "library.personalization.customInstructions.editor.placeholder",
                "例如：始终用中文回答；保持专业语气；回答要点优先……",
              )}
              className={cn("min-h-[360px] font-mono text-sm")}
              disabled={store.isLoading || store.isSaving}
            />

            <div className="text-xs text-muted-foreground">
              {t(
                "library.personalization.customInstructions.editor.tip",
                "提示：关闭开关表示不应用该指令；你仍可编辑并保存内容以便之后启用。",
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
