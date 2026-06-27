"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useUIStore } from "@/lib/store/useUIStore";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSyncToDataAttr />
      {children}
    </NextThemesProvider>
  );
}

/**
 * Component that syncs the useUIStore theme to the data-theme attribute.
 * Mount this anywhere inside the ThemeProvider.
 */
export function ThemeSyncToDataAttr() {
  const theme = useUIStore((s) => s.theme);
  const { setTheme: setNextTheme } = useTheme();

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const resolvedTheme = theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
      
      setNextTheme(theme);
      document.documentElement.setAttribute("data-theme", resolvedTheme);
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    }
  }, [theme, setNextTheme]);

  return null;
}
