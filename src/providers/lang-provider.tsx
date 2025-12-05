"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export type Lang = "id" | "en" | "zh";
type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
};
const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({
  children,
  initialLang = "id",
  initialMessages,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
  initialMessages?: Record<string, string>;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [messages, setMessages] = useState<Record<string, string>>(
    initialMessages || {}
  );
  const router = useRouter();
  const isFirstMount = useRef(true);
  
  useEffect(() => {
    // Skip router.refresh() on first mount to prevent infinite reload
    const shouldRefresh = !isFirstMount.current;
    isFirstMount.current = false;
    
    try {
      localStorage.setItem("app:lang", lang);
      document.cookie = `app:lang=${lang}; path=/; max-age=31536000`;
    } catch {}
    (async () => {
      if (!initialMessages || lang !== initialLang) {
        switch (lang) {
          case "en":
            setMessages((await import("@/i18n/en")).default);
            break;
          case "zh":
            setMessages((await import("@/i18n/zh")).default);
            break;
          default:
            setMessages((await import("@/i18n/id")).default);
            break;
        }
      }
      // Only refresh when language actually changes (not on first mount)
      if (shouldRefresh) {
        router.refresh();
      }
    })();
  }, [lang, initialLang, initialMessages, router]);
  const t = useCallback((k: string) => messages[k] ?? k, [messages]);
  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, t }),
    [lang, t]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("LangContext");
  return ctx;
}
