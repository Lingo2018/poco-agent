"use client";

import * as React from "react";

const ONBOARDING_SEEN_KEY = "poco_onboarding_seen_v1";

export function useOnboardingTour() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [runId, setRunId] = React.useState(0);

  const startTour = React.useCallback(() => {
    setRunId((current) => current + 1);
    setIsOpen(true);
  }, []);

  const closeTour = React.useCallback((completed: boolean) => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(
        ONBOARDING_SEEN_KEY,
        completed ? "completed" : "dismissed",
      );
    } catch {
      // Ignore localStorage errors in private mode.
    }
  }, []);

  React.useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(window.localStorage.getItem(ONBOARDING_SEEN_KEY));
    } catch {
      seen = false;
    }

    if (seen) return;

    const timer = window.setTimeout(() => {
      startTour();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [startTour]);

  return {
    isOpen,
    runId,
    startTour,
    closeTour,
  };
}
