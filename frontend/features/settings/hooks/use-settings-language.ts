"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { cookieName, fallbackLng, languages } from "@/lib/i18n/settings";

export function useSettingsLanguage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLanguage = React.useMemo(() => {
    const value = params?.lng;
    if (!value) return fallbackLng;

    const resolvedLanguage = Array.isArray(value) ? value[0] : value;
    return languages.includes(resolvedLanguage)
      ? resolvedLanguage
      : fallbackLng;
  }, [params]);

  const changeLanguage = React.useCallback(
    (nextLanguage: string) => {
      if (nextLanguage === currentLanguage) return;

      document.cookie = `${cookieName}=${nextLanguage}; path=/; max-age=${60 * 60 * 24 * 365}`;

      const pathSegments = pathname.split("/");
      if (pathSegments.length > 1 && languages.includes(pathSegments[1])) {
        pathSegments[1] = nextLanguage;
      } else {
        pathSegments.splice(1, 0, nextLanguage);
      }

      const nextPath = pathSegments.join("/") || `/${nextLanguage}`;
      const query = window.location.search.replace(/^\?/, "");
      router.push(query ? `${nextPath}?${query}` : nextPath);
    },
    [currentLanguage, pathname, router],
  );

  return {
    currentLanguage,
    changeLanguage,
  };
}
