"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/client";
import type { ApiProviderConfig } from "@/features/settings/types";

interface ApiProviderSectionProps {
  title: string;
  description: string;
  keyPlaceholder: string;
  baseUrlTitle: string;
  baseUrlDescription: string;
  baseUrlPlaceholder: string;
  config: ApiProviderConfig;
  onChange: (patch: Partial<ApiProviderConfig>) => void;
}

function ApiProviderSection({
  title,
  description,
  keyPlaceholder,
  baseUrlTitle,
  baseUrlDescription,
  baseUrlPlaceholder,
  config,
  onChange,
}: ApiProviderSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {config.enabled ? (
        <>
          <Input
            type="password"
            value={config.key}
            onChange={(event) => onChange({ key: event.target.value })}
            placeholder={keyPlaceholder}
          />

          <div className="flex items-start justify-between gap-4 pt-1">
            <div>
              <p className="text-sm font-medium text-foreground">
                {baseUrlTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {baseUrlDescription}
              </p>
            </div>
            <Switch
              checked={config.useCustomBaseUrl}
              onCheckedChange={(checked) =>
                onChange({ useCustomBaseUrl: checked })
              }
            />
          </div>

          <Input
            value={config.baseUrl}
            onChange={(event) => onChange({ baseUrl: event.target.value })}
            placeholder={baseUrlPlaceholder}
            disabled={!config.useCustomBaseUrl}
          />
        </>
      ) : null}
    </div>
  );
}

interface ModelsSettingsTabProps {
  isGlmEnabled: boolean;
  openAiConfig: ApiProviderConfig;
  anthropicConfig: ApiProviderConfig;
  onToggleGlm: (checked: boolean) => void;
  onUpdateOpenAiConfig: (patch: Partial<ApiProviderConfig>) => void;
  onUpdateAnthropicConfig: (patch: Partial<ApiProviderConfig>) => void;
}

export function ModelsSettingsTab({
  isGlmEnabled,
  openAiConfig,
  anthropicConfig,
  onToggleGlm,
  onUpdateOpenAiConfig,
  onUpdateAnthropicConfig,
}: ModelsSettingsTabProps) {
  const { t } = useT("translation");

  return (
    <div className="flex-1 space-y-8 overflow-y-auto p-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          {t("settings.modelConfigTitle")}
        </h3>
        <div className="flex items-center justify-between gap-4 py-2">
          <p className="text-sm font-medium text-foreground">
            {t("settings.modelGlm")}
          </p>
          <Switch checked={isGlmEnabled} onCheckedChange={onToggleGlm} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          {t("settings.apiKeys")}
        </h3>

        <div className="space-y-6">
          <ApiProviderSection
            title={t("settings.openAiApiKey")}
            description={t("settings.openAiApiKeyHint")}
            keyPlaceholder={t("settings.openAiApiKeyPlaceholder")}
            baseUrlTitle={t("settings.openAiBaseUrl")}
            baseUrlDescription={t("settings.openAiBaseUrlHint")}
            baseUrlPlaceholder={t("settings.openAiBaseUrlPlaceholder")}
            config={openAiConfig}
            onChange={onUpdateOpenAiConfig}
          />

          <ApiProviderSection
            title={t("settings.anthropicApiKey")}
            description={t("settings.anthropicApiKeyHint")}
            keyPlaceholder={t("settings.anthropicApiKeyPlaceholder")}
            baseUrlTitle={t("settings.anthropicBaseUrl")}
            baseUrlDescription={t("settings.anthropicBaseUrlHint")}
            baseUrlPlaceholder={t("settings.anthropicBaseUrlPlaceholder")}
            config={anthropicConfig}
            onChange={onUpdateAnthropicConfig}
          />
        </div>
      </section>
    </div>
  );
}
