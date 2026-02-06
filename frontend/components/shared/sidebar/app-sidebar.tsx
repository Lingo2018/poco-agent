"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { GlobalSearchDialog } from "@/features/search/components/global-search-dialog";
import { useSearchDialog } from "@/features/search/hooks/use-search-dialog";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { MainSidebar } from "./main-sidebar";
import type { ProjectItem, TaskHistoryItem } from "@/features/projects/types";

interface AppSidebarProps {
  projects: ProjectItem[];
  taskHistory: TaskHistoryItem[];
  onNewTask?: () => void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
  onRenameTask?: (taskId: string, newName: string) => Promise<void> | void;
  onMoveTaskToProject?: (taskId: string, projectId: string | null) => void;
  onCreateProject?: (name: string) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
  onOpenSettings?: () => void;
}

// 默认空函数
const noop = () => {};

/**
 * 统一的侧边栏组件，根据当前路由自动调整行为
 * 所有页面应使用此组件以保持侧边栏一致
 */
export function AppSidebar({
  projects,
  taskHistory,
  onNewTask,
  onDeleteTask,
  onRenameTask,
  onMoveTaskToProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onOpenSettings,
}: AppSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const { isSearchOpen, setIsSearchOpen } = useSearchDialog();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    React.useState(false);

  const lng = React.useMemo(() => {
    const value = params?.lng;
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  // 处理新建任务
  const handleNewTask = React.useCallback(() => {
    // 在首页或其他页面，执行默认行为
    if (onNewTask) {
      onNewTask();
    } else {
      // Prefer keeping current language when we're under /[lng]/...
      router.push(lng ? `/${lng}/home` : "/");
    }
  }, [router, onNewTask, lng]);

  // 处理创建项目
  const handleCreateProject = React.useCallback(
    (name: string) => {
      onCreateProject?.(name);
    },
    [onCreateProject],
  );

  return (
    <>
      <MainSidebar
        projects={projects}
        taskHistory={taskHistory}
        onNewTask={handleNewTask}
        onDeleteTask={onDeleteTask ?? noop}
        onRenameTask={onRenameTask}
        onMoveTaskToProject={onMoveTaskToProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
        onOpenSettings={onOpenSettings}
        onOpenCreateProjectDialog={() => setIsCreateProjectDialogOpen(true)}
      />

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </>
  );
}
