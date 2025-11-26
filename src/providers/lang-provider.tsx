"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  useEffect(() => {
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
      router.refresh();
    })();
  }, [lang]);
  const t = (k: string) => messages[k] ?? k;
  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, t }),
    [lang, messages]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("LangContext");
  return ctx;
}
