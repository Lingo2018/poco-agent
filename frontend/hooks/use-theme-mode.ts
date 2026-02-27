"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

const resolveThemeMode = (theme: string | undefined): ThemeMode => {
  if (theme === "light" || theme === "dark" || theme === "system") {
    return theme;
  }

  return "system";
};

const resolveActiveThemeMode = (
  theme: string | undefined,
  resolvedTheme: string | undefined,
): ResolvedThemeMode => {
  if (resolvedTheme === "light" || resolvedTheme === "dark") {
    return resolvedTheme;
  }
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return "dark";
};

export function useThemeMode() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const mode = React.useMemo(() => resolveThemeMode(theme), [theme]);
  const activeMode = React.useMemo(
    () => resolveActiveThemeMode(theme, resolvedTheme),
    [theme, resolvedTheme],
  );

  const setMode = React.useCallback(
    (nextMode: ThemeMode) => setTheme(nextMode),
    [setTheme],
  );

  return {
    theme,
    resolvedTheme,
    mode,
    activeMode,
    setMode,
  };
}
