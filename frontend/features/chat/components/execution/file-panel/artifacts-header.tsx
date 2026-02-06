import { Layers, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  PanelHeader,
  PanelHeaderAction,
} from "@/components/shared/panel-header";
import type { FileNode } from "@/features/chat/types";
import { apiClient, API_ENDPOINTS } from "@/lib/api-client";
import { toast } from "sonner";

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
  sessionId,
  headerAction,
}: ArtifactsHeaderProps) {
  const headerTitle = title || selectedFile?.name || "文档预览";

  const handleDownload = async () => {
    if (!sessionId) return;
    try {
      const response = await apiClient.get<{
        url?: string | null;
        filename?: string | null;
      }>(API_ENDPOINTS.sessionWorkspaceArchive(sessionId));

      if (response.url) {
        // Trigger download
        const filename = response.filename || `workspace-${sessionId}.zip`;
        const link = document.createElement("a");
        link.href = response.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("开始下载工作区归档");
      } else {
        toast.error("归档文件暂不可用");
      }
    } catch (error) {
      console.error("[Artifacts] Failed to download workspace archive", error);
      toast.error("下载失败");
    }
  };

  return (
    <PanelHeader
      icon={Layers}
      title={headerTitle}
      description="工作区文件预览"
      className="border-b"
      content={
        headerAction ? (
          <div className="flex items-center">{headerAction}</div>
        ) : undefined
      }
      action={
        <div className="flex items-center gap-1">
          {sessionId && (
            <PanelHeaderAction
              onClick={handleDownload}
              aria-label="下载工作区归档"
            >
              <Download className="size-4" />
            </PanelHeaderAction>
          )}
          {onToggleSidebar && (
            <PanelHeaderAction
              onClick={onToggleSidebar}
              aria-label={
                isSidebarCollapsed ? "展开文件侧边栏" : "折叠文件侧边栏"
              }
            >
              {isSidebarCollapsed ? (
                <ChevronLeft className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </PanelHeaderAction>
          )}
        </div>
      }
    />
  );
}
