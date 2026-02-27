"use client";

import * as React from "react";

export type BackendOption = "claude-code";

const BACKEND_STORAGE_KEY = "poco.settings.backend";

function readStoredBackend(): BackendOption {
  return "claude-code";
}

export function useBackendPreference() {
  const [backend, setBackendState] =
    React.useState<BackendOption>("claude-code");

  React.useEffect(() => {
    setBackendState(readStoredBackend());
  }, []);

  const setBackend = React.useCallback((nextBackend: BackendOption) => {
    setBackendState(nextBackend);

    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(BACKEND_STORAGE_KEY, nextBackend);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  return {
    backend,
    setBackend,
  };
}
