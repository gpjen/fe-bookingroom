"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Apply theme ke <html> dan persist cookie dengan nilai final agar SSR konsisten tanpa flicker
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const finalTheme =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;
    root.classList.toggle("dark", finalTheme === "dark");
    try {
      localStorage.setItem("app:themeMode", theme);
      localStorage.setItem("app:theme", finalTheme);
      document.cookie = `app:themeMode=${theme}; path=/; max-age=31536000`;
      document.cookie = `app:theme=${finalTheme}; path=/; max-age=31536000`;
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeContext not found");
  return ctx;
}
