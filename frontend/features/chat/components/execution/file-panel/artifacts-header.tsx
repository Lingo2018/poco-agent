import { Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  PanelHeader,
  PanelHeaderAction,
} from "@/components/shared/panel-header";
import type { FileNode } from "@/features/chat/types";
import { useT } from "@/lib/i18n/client";

interface ArtifactsHeaderProps {
  title?: string;
  selectedFile?: FileNode;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  sessionId?: string;
  headerAction?: React.ReactNode;
}

/**
 * Header component for artifacts panel
 * Used across all view modes (artifacts list, document preview, empty state)
 */
export function ArtifactsHeader({
  title,
  selectedFile,
  isSidebarCollapsed = false,
  onToggleSidebar,
  headerAction,
}: ArtifactsHeaderProps) {
  const { t } = useT("translation");
  const headerTitle =
    title || selectedFile?.name || t("artifactsPanel.documentPreview");

  return (
    <PanelHeader
      icon={Layers}
      title={headerTitle}
      description={t("artifactsPanel.workspacePreview")}
      className="border-b"
      content={
        headerAction ? (
          <div className="flex min-w-0 items-center overflow-hidden">
            {headerAction}
          </div>
        ) : undefined
      }
      action={
        onToggleSidebar ? (
          <PanelHeaderAction
            onClick={onToggleSidebar}
            aria-label={
              isSidebarCollapsed
                ? t("artifactsPanel.sidebarOpen")
                : t("artifactsPanel.sidebarClose")
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </PanelHeaderAction>
        ) : undefined
      }
    />
  );
}
