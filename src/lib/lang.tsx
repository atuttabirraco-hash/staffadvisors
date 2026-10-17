import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { t, type Lang, type Translations } from "./i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: Translations };

const LangContext = createContext<Ctx>({ lang: "it", setLang: () => {}, tr: t.it });

/** Best guess from the device's own language list, e.g. "de-DE" -> "de". Falls back to Italian. */
function guessLang(): Lang {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const raw of list) {
      const code = (raw ?? "").toLowerCase().slice(0, 2);
      if (t[code as Lang]) return code as Lang;
    }
  } catch {
    /* device without language info: keep Italian */
  }
  return "it";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    const saved = window.localStorage.getItem("sa_lang") as Lang | null;
    const activeLang = saved && t[saved] ? saved : guessLang();
    setLangState(activeLang);
    document.documentElement.lang = activeLang;
    document.documentElement.dir = activeLang === "ar" ? "rtl" : "ltr";
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("sa_lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  return <LangContext.Provider value={{ lang, setLang, tr: t[lang] }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
