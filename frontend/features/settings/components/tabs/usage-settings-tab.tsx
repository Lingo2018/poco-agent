"use client";

import { useT } from "@/lib/i18n/client";

export function UsageSettingsTab() {
  const { t } = useT("translation");

  return (
    <div className="p-6">
      <div className="py-10 text-center text-muted-foreground">
        {t("settings.noUsageData")}
      </div>
    </div>
  );
}
