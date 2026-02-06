"use client";

import * as React from "react";
import {
  Loader2,
  Monitor,
  CheckCircle2,
  XCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
  AppWindow,
  SquareTerminal,
} from "lucide-react";
import { PanelHeader } from "@/components/shared/panel-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { getBrowserScreenshotAction } from "@/features/chat/actions/query-actions";
import type { ToolExecutionResponse } from "@/features/chat/types";
import { useToolExecutions } from "./hooks/use-tool-executions";
import { ApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const POCO_PLAYWRIGHT_MCP_PREFIX = "mcp____poco_playwright__";

interface ComputerPanelProps {
  sessionId: string;
  sessionStatus?:
    | "running"
    | "accepted"
    | "completed"
    | "failed"
    | "canceled"
    | "stopped";
  browserEnabled?: boolean;
  headerAction?: React.ReactNode;
}

type ReplayFilter = "all" | "browser" | "terminal";
type ReplayKind = "browser" | "terminal";

interface ReplayFrame {
  kind: ReplayKind;
  execution: ToolExecutionResponse;
  label: string;
}

function truncateMiddle(value: string, maxLen: number): string {
  const text = value.trim();
  if (text.length <= maxLen) return text;
  if (maxLen <= 8) return text.slice(0, maxLen);
  const head = Math.ceil((maxLen - 3) / 2);
  const tail = Math.floor((maxLen - 3) / 2);
  return `${text.slice(0, head)}...${text.slice(text.length - tail)}`;
}

function pickFirstString(
  input: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!input) return null;
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function getBrowserStepLabel(execution: ToolExecutionResponse): string {
  const name = execution.tool_name || "";
  if (!name.startsWith(POCO_PLAYWRIGHT_MCP_PREFIX)) return name;
  const rawTool = name.slice(POCO_PLAYWRIGHT_MCP_PREFIX.length).trim();
  const action = rawTool.startsWith("browser_")
    ? rawTool.slice("browser_".length)
    : rawTool;

  const input = execution.tool_input || {};
  const summary = (() => {
    if (action === "navigate") {
      return pickFirstString(input, ["url", "href"]);
    }
    if (action === "click" || action === "hover") {
      return pickFirstString(input, ["selector", "text", "role", "name"]);
    }
    if (action === "type" || action === "fill" || action === "press") {
      return (
        pickFirstString(input, ["selector", "role", "name", "text"]) ||
        pickFirstString(input, ["key", "value"])
      );
    }
    return pickFirstString(input, [
      "url",
      "selector",
      "text",
      "role",
      "name",
      "value",
      "query",
      "path",
    ]);
  })();

  const meta = summary ? ` - ${truncateMiddle(summary, 80)}` : "";
  return `${action}${meta}`;
}

function parseBashResult(execution: ToolExecutionResponse): {
  output: string;
  exitCode?: number;
  killed?: boolean;
  shellId?: string | null;
} {
  const raw = execution.tool_output?.["content"];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        const output = typeof obj["output"] === "string" ? obj["output"] : raw;
        const exitCode =
          typeof obj["exitCode"] === "number" ? obj["exitCode"] : undefined;
        const killed =
          typeof obj["killed"] === "boolean" ? obj["killed"] : undefined;
        const shellId =
          typeof obj["shellId"] === "string" ? obj["shellId"] : null;
        return { output, exitCode, killed, shellId };
      }
    } catch {
      // fall back to raw
    }
    return { output: raw };
  }
  if (raw === undefined || raw === null) return { output: "" };
  return { output: JSON.stringify(raw) };
}

function clampIndex(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function ComputerPanel({
  sessionId,
  sessionStatus,
  headerAction,
}: ComputerPanelProps) {
  const { t } = useT("translation");
  const isActive = sessionStatus === "running" || sessionStatus === "accepted";

  const { executions, isLoading } = useToolExecutions({
    sessionId,
    isActive,
    pollingIntervalMs: 2000,
    limit: 2000,
  });

  // --- Screenshot caching (persists across tab switches) ---
  const screenshotCacheRef = React.useRef(new Map<string, string | null>());
  const [browserScreenshotUrls, setBrowserScreenshotUrls] = React.useState<
    Record<string, string | null>
  >({});
  const inflightRef = React.useRef(new Set<string>());

  const fetchBrowserScreenshot = React.useCallback(
    async (toolUseId: string, retryOn404: boolean): Promise<void> => {
      const id = toolUseId.trim();
      if (
        !id ||
        screenshotCacheRef.current.has(id) ||
        inflightRef.current.has(id)
      ) {
        return;
      }

      inflightRef.current.add(id);

      const fetchWithRetry = async (attempts = 0): Promise<void> => {
        try {
          const res = await getBrowserScreenshotAction({
            sessionId,
            toolUseId: id,
          });
          screenshotCacheRef.current.set(id, res.url);
          setBrowserScreenshotUrls((prev) => ({ ...prev, [id]: res.url }));
        } catch (err) {
          const statusCode =
            err instanceof ApiError
              ? err.statusCode
              : (err as { statusCode?: number })?.statusCode;

          if (statusCode === 404 && retryOn404 && attempts < 10) {
            setTimeout(() => fetchWithRetry(attempts + 1), 800);
            return;
          }

          screenshotCacheRef.current.set(id, null);
          setBrowserScreenshotUrls((prev) => ({ ...prev, [id]: null }));
        } finally {
          inflightRef.current.delete(id);
        }
      };

      await fetchWithRetry();
    },
    [sessionId],
  );

  const replayFramesAll: ReplayFrame[] = React.useMemo(() => {
    const frames: ReplayFrame[] = [];
    for (const e of executions) {
      const toolName = e.tool_name || "";
      if (toolName === "Bash") {
        const cmd =
          typeof e.tool_input?.["command"] === "string"
            ? (e.tool_input?.["command"] as string)
            : "";
        frames.push({
          kind: "terminal",
          execution: e,
          label: cmd
            ? truncateMiddle(cmd, 80)
            : t("computer.terminal.unknownCommand"),
        });
        continue;
      }
      if (toolName.startsWith(POCO_PLAYWRIGHT_MCP_PREFIX)) {
        frames.push({
          kind: "browser",
          execution: e,
          label: getBrowserStepLabel(e),
        });
      }
    }
    return frames;
  }, [executions, t]);

  const browserCount = React.useMemo(
    () => replayFramesAll.filter((f) => f.kind === "browser").length,
    [replayFramesAll],
  );
  const terminalCount = React.useMemo(
    () => replayFramesAll.filter((f) => f.kind === "terminal").length,
    [replayFramesAll],
  );

  const [replayFilter, setReplayFilter] = React.useState<ReplayFilter>("all");
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [followLatest, setFollowLatest] = React.useState(true);
  const [selectedFrameId, setSelectedFrameId] = React.useState<string | null>(
    null,
  );

  const replayFrames: ReplayFrame[] = React.useMemo(() => {
    if (replayFilter === "browser") {
      return replayFramesAll.filter((f) => f.kind === "browser");
    }
    if (replayFilter === "terminal") {
      return replayFramesAll.filter((f) => f.kind === "terminal");
    }
    return replayFramesAll;
  }, [replayFilter, replayFramesAll]);

  const selectedIndex = React.useMemo(() => {
    if (!selectedFrameId) return -1;
    return replayFrames.findIndex((f) => f.execution.id === selectedFrameId);
  }, [replayFrames, selectedFrameId]);

  const selectedFrame = selectedIndex >= 0 ? replayFrames[selectedIndex] : null;

  // Stop playback when filter changes (avoid surprising jumps).
  React.useEffect(() => {
    setIsPlaying(false);
  }, [replayFilter]);

  // Keep selection valid; default to the latest completed step (or latest any step).
  React.useEffect(() => {
    if (replayFrames.length === 0) {
      if (selectedFrameId !== null) setSelectedFrameId(null);
      setIsPlaying(false);
      return;
    }

    const exists =
      selectedFrameId &&
      replayFrames.some((f) => f.execution.id === selectedFrameId);

    if (exists) {
      if (followLatest && !isPlaying) {
        const lastId = replayFrames[replayFrames.length - 1]?.execution.id;
        if (lastId && selectedFrameId !== lastId) {
          setSelectedFrameId(lastId);
        }
      }
      return;
    }

    const latestCompleted = [...replayFrames]
      .reverse()
      .find((f) => Boolean(f.execution.tool_output));
    const pick =
      latestCompleted?.execution.id ||
      replayFrames[replayFrames.length - 1]!.execution.id;
    setSelectedFrameId(pick);
    setFollowLatest(true);
    setIsPlaying(false);
  }, [followLatest, isPlaying, replayFrames, selectedFrameId]);

  // Playback: advance to the next step using a step-based cadence (video-like, but not real video).
  React.useEffect(() => {
    if (!isPlaying) return;
    if (!selectedFrame) return;
    if (selectedIndex < 0) return;
    if (selectedIndex >= replayFrames.length - 1) {
      setIsPlaying(false);
      return;
    }

    const baseMs = selectedFrame.kind === "browser" ? 1200 : 1800;
    const delayMs = Math.max(80, baseMs);
    const id = window.setTimeout(() => {
      const next = replayFrames[selectedIndex + 1];
      if (next) {
        setSelectedFrameId(next.execution.id);
      }
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [isPlaying, replayFrames, selectedFrame, selectedIndex]);

  const selectedBrowserToolUseId =
    selectedFrame?.kind === "browser" &&
    typeof selectedFrame.execution.tool_use_id === "string"
      ? selectedFrame.execution.tool_use_id
      : null;
  const selectedBrowserIsDone = Boolean(
    selectedFrame?.kind === "browser" && selectedFrame.execution.tool_output,
  );

  // Fetch screenshot URL on demand for the selected browser step (cache per tool_use_id).
  React.useEffect(() => {
    if (!selectedBrowserToolUseId) return;
    if (!selectedBrowserIsDone) return;
    if (selectedBrowserToolUseId in browserScreenshotUrls) return;
    void fetchBrowserScreenshot(selectedBrowserToolUseId, isActive);
  }, [
    browserScreenshotUrls,
    fetchBrowserScreenshot,
    isActive,
    selectedBrowserIsDone,
    selectedBrowserToolUseId,
  ]);

  // Prefetch screenshots for the next 1-2 browser steps to keep playback smooth.
  React.useEffect(() => {
    if (!selectedFrame) return;
    if (selectedIndex < 0) return;

    const candidates = replayFrames
      .slice(selectedIndex + 1, selectedIndex + 3)
      .filter((f) => f.kind === "browser")
      .map((f) => f.execution)
      .filter(
        (e) =>
          Boolean(e.tool_output) &&
          typeof e.tool_use_id === "string" &&
          Boolean(e.tool_use_id),
      )
      .map((e) => e.tool_use_id as string);

    for (const toolUseId of candidates) {
      if (toolUseId in browserScreenshotUrls) continue;
      void fetchBrowserScreenshot(toolUseId, isActive);
    }
  }, [
    browserScreenshotUrls,
    fetchBrowserScreenshot,
    isActive,
    replayFrames,
    selectedFrame,
    selectedIndex,
  ]);

  const selectedBrowserUrl =
    selectedBrowserToolUseId &&
    selectedBrowserToolUseId in browserScreenshotUrls
      ? browserScreenshotUrls[selectedBrowserToolUseId]
      : undefined;

  const formatDuration = React.useCallback(
    (durationMs: number): string => {
      if (durationMs < 1000) {
        return t("computer.replay.durationMs", { ms: String(durationMs) });
      }
      const sec = (durationMs / 1000).toFixed(1);
      return t("computer.replay.durationSec", { sec });
    },
    [t],
  );

  const currentLabel = selectedFrame?.label || "";
  const currentDuration =
    selectedFrame?.execution.duration_ms != null
      ? formatDuration(selectedFrame.execution.duration_ms)
      : null;

  const currentStepText =
    selectedIndex >= 0
      ? t("computer.replay.stepCounter", {
          current: String(selectedIndex + 1),
          total: String(replayFrames.length),
        })
      : t("computer.replay.stepCounter", {
          current: "0",
          total: String(replayFrames.length),
        });

  const viewer = (() => {
    if (!selectedFrame) {
      return (
        <div className="h-full w-full bg-muted/30 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {t("computer.replay.empty")}
          </div>
        </div>
      );
    }

    if (selectedFrame.kind === "browser") {
      if (!selectedBrowserIsDone) {
        return (
          <div className="h-full w-full bg-muted/30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("computer.terminal.running")}
            </div>
          </div>
        );
      }

      if (!selectedBrowserToolUseId) {
        return (
          <div className="h-full w-full bg-muted/30 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              {t("computer.browser.screenshotUnavailable")}
            </div>
          </div>
        );
      }

      return (
        <div className="h-full w-full bg-muted/30 flex items-center justify-center">
          {selectedBrowserUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedBrowserUrl}
              alt={t("computer.browser.screenshotAlt")}
              className="w-full h-full object-contain"
            />
          ) : selectedBrowserUrl === null ? (
            <div className="text-sm text-muted-foreground">
              {t("computer.browser.screenshotUnavailable")}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("computer.browser.screenshotLoading")}
            </div>
          )}
        </div>
      );
    }

    const cmd =
      typeof selectedFrame.execution.tool_input?.["command"] === "string"
        ? (selectedFrame.execution.tool_input?.["command"] as string)
        : "";
    const isDone = Boolean(selectedFrame.execution.tool_output);
    const isError = selectedFrame.execution.is_error;
    const result = parseBashResult(selectedFrame.execution);

    return (
      <div className="h-full w-full bg-card">
        <ScrollArea className="h-full">
          <div className="p-4 font-mono text-xs space-y-3">
            <div className="flex items-start gap-2">
              <span className="select-none text-muted-foreground">$</span>
              <span className="whitespace-pre-wrap break-all flex-1">
                {cmd || t("computer.terminal.unknownCommand")}
              </span>
              <span className="shrink-0">
                {!isDone ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : isError ? (
                  <XCircle className="size-3.5 text-destructive" />
                ) : (
                  <CheckCircle2 className="size-3.5 text-success" />
                )}
              </span>
            </div>
            {isDone ? (
              <div className="whitespace-pre-wrap break-words text-foreground/90 rounded-md border bg-background p-3">
                {result.output || (
                  <span className="text-muted-foreground">
                    {t("computer.terminal.noOutput")}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {t("computer.terminal.running")}
              </div>
            )}
            {isDone && typeof result.exitCode === "number" ? (
              <div
                className={cn(
                  "text-[11px]",
                  result.exitCode === 0
                    ? "text-muted-foreground"
                    : "text-destructive",
                )}
              >
                {t("computer.terminal.exitCode", {
                  code: String(result.exitCode),
                })}
                {result.killed ? ` · ${t("computer.terminal.killed")}` : ""}
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    );
  })();

  const canGoPrev = replayFrames.length > 0 && selectedIndex > 0;
  const canGoNext =
    replayFrames.length > 0 &&
    selectedIndex >= 0 &&
    selectedIndex < replayFrames.length - 1;

  const goToIndex = (index: number) => {
    if (replayFrames.length === 0) return;
    const safe = clampIndex(index, 0, replayFrames.length - 1);
    const frame = replayFrames[safe];
    if (!frame) return;
    setIsPlaying(false);
    setSelectedFrameId(frame.execution.id);
    setFollowLatest(safe === replayFrames.length - 1);
  };

  const controls = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{currentStepText}</div>
          <div className="text-xs font-mono truncate">
            {currentLabel || t("computer.replay.noSelection")}
            {currentDuration ? (
              <span className="text-muted-foreground">
                {" "}
                · {currentDuration}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(0)}
          disabled={replayFrames.length === 0 || selectedIndex <= 0}
          title={t("computer.replay.controls.first")}
          aria-label={t("computer.replay.controls.first")}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(selectedIndex - 1)}
          disabled={!canGoPrev}
          title={t("computer.replay.controls.prev")}
          aria-label={t("computer.replay.controls.prev")}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          onClick={() => {
            if (replayFrames.length === 0) return;
            if (isPlaying) {
              setIsPlaying(false);
              return;
            }
            // If we're at the end, restart from the beginning.
            if (selectedIndex >= replayFrames.length - 1) {
              goToIndex(0);
            }
            setFollowLatest(false);
            setIsPlaying(true);
          }}
          disabled={replayFrames.length === 0}
          title={
            isPlaying
              ? t("computer.replay.controls.pause")
              : t("computer.replay.controls.play")
          }
          aria-label={
            isPlaying
              ? t("computer.replay.controls.pause")
              : t("computer.replay.controls.play")
          }
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => goToIndex(selectedIndex + 1)}
          disabled={!canGoNext}
          title={t("computer.replay.controls.next")}
          aria-label={t("computer.replay.controls.next")}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            if (replayFrames.length === 0) return;
            setIsPlaying(false);
            setFollowLatest(true);
            const last = replayFrames[replayFrames.length - 1];
            if (last) setSelectedFrameId(last.execution.id);
          }}
          disabled={
            replayFrames.length === 0 ||
            selectedIndex >= replayFrames.length - 1
          }
          title={t("computer.replay.controls.latest")}
          aria-label={t("computer.replay.controls.latest")}
        >
          <ChevronsRight className="size-4" />
        </Button>

        <ToggleGroup
          type="single"
          value={replayFilter}
          onValueChange={(value) => {
            if (!value) return;
            if (
              value === "all" ||
              value === "browser" ||
              value === "terminal"
            ) {
              setReplayFilter(value);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="all">
            {t("computer.replay.filter.all")}
          </ToggleGroupItem>
          <ToggleGroupItem value="browser" disabled={browserCount === 0}>
            <AppWindow className="size-4" />
            {t("computer.replay.filter.browser")}
          </ToggleGroupItem>
          <ToggleGroupItem value="terminal" disabled={terminalCount === 0}>
            <SquareTerminal className="size-4" />
            {t("computer.replay.filter.terminal")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Slider
        min={0}
        max={Math.max(0, replayFrames.length - 1)}
        value={[Math.max(0, selectedIndex)]}
        onValueChange={(value) => {
          const nextIndex = value[0] ?? 0;
          goToIndex(nextIndex);
        }}
        disabled={replayFrames.length <= 1}
      />

      {executions.length >= 2000 ? (
        <div className="text-[11px] text-muted-foreground">
          {t("computer.replay.limitHint", { limit: "2000" })}
        </div>
      ) : null}
    </div>
  );

  const timelineList = (
    <ScrollArea className="h-full rounded-xl border bg-card">
      <div className="p-2 space-y-1">
        {replayFrames.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {t("computer.replay.empty")}
          </div>
        ) : (
          replayFrames.map((frame, idx) => {
            const isSelected = frame.execution.id === selectedFrameId;
            const isDone = Boolean(frame.execution.tool_output);
            const isError = frame.execution.is_error;
            const kindIcon =
              frame.kind === "browser" ? (
                <AppWindow className="size-4 text-muted-foreground" />
              ) : (
                <SquareTerminal className="size-4 text-muted-foreground" />
              );
            const statusIcon = !isDone ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : isError ? (
              <XCircle className="size-4 text-destructive" />
            ) : (
              <CheckCircle2 className="size-4 text-success" />
            );
            return (
              <button
                key={frame.execution.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50",
                )}
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedFrameId(frame.execution.id);
                  setFollowLatest(idx === replayFrames.length - 1);
                }}
              >
                <div className="shrink-0 flex items-center gap-2">
                  {statusIcon}
                  {kindIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono truncate">
                    {frame.label}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex h-full min-h-0 flex-col min-w-0 overflow-hidden">
      <PanelHeader
        icon={Monitor}
        title={t("computer.title")}
        description={t("computer.description")}
        content={
          headerAction ? (
            <div className="flex items-center">{headerAction}</div>
          ) : undefined
        }
      />
      <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
        <div className="h-full min-h-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
            {viewer}
          </div>

          {controls}

          <div className="min-h-0 flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t("computer.replay.timeline")}
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("status.loading")}
                </div>
              )}
            </div>
            {timelineList}
          </div>
        </div>
      </div>
    </div>
  );
}
