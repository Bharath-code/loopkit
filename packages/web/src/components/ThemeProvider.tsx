"use client";

/**
 * Theme provider for dark/light mode toggle.
 *
 * Uses next-themes (already installed). We:
 *   - Set class-based theming (toggled on <html> by next-themes)
 *   - Default to dark to match the existing design (the brand IS dark)
 *   - Persist preference in localStorage
 *   - Disable transitions during theme change to avoid flash
 *
 * The toggle itself lives in the dashboard sidebar; the homepage
 * stays dark-first because the marketing page is dark.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="loopkit-theme"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
