"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

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

  // ✅ Track if this is first mount to skip router.refresh
  const isFirstMount = useRef(true);
  const previousLang = useRef(initialLang);

  useEffect(() => {
    // ✅ Only process if language actually changed
    if (previousLang.current === lang && !isFirstMount.current) {
      return;
    }

    // Update previous lang
    // const didLangChange = previousLang.current !== lang;
    previousLang.current = lang;
    isFirstMount.current = false;

    // Save to localStorage and cookie
    try {
      localStorage.setItem("app:lang", lang);
      document.cookie = `app:lang=${lang}; path=/; max-age=31536000`;
    } catch {}

    // Load messages asynchronously
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

      // ✅ REMOVED router.refresh() - causes infinite loop!
      // Language change will be reflected on next navigation
      // If you REALLY need refresh, user can manually refresh page
    })();

    // ✅ Only watch 'lang' - NOT router, NOT initialMessages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const t = useCallback((k: string) => messages[k] ?? k, [messages]);
  const value = useMemo<LangCtx>(() => ({ lang, setLang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("LangContext");
  return ctx;
}
