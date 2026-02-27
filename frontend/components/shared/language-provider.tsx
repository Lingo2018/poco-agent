"use client";

import { useEffect, useLayoutEffect } from "react";
import i18next from "@/lib/i18n/i18next";

export function LanguageProvider({
  lng,
  children,
}: {
  lng: string;
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    if (i18next.resolvedLanguage !== lng) {
      void i18next.changeLanguage(lng);
    }
  }, [lng]);

  useEffect(() => {
    document.documentElement.lang = lng;
  }, [lng]);

  return <>{children}</>;
}
