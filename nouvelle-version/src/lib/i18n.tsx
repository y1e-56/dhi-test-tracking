import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { frDict, type DictShape } from "./i18n/fr";
import { enDict } from "./i18n/en";

export type AppLanguage = "fr" | "en";
export type AppTheme = "light" | "dark";
export type TextDirection = "ltr" | "rtl";

const LANGUAGES: { id: AppLanguage; label: string; native: string; dir: TextDirection }[] = [
  { id: "fr", label: "Français", native: "Français", dir: "ltr" },
  { id: "en", label: "English", native: "English", dir: "ltr" },
];

const DICTS: Record<AppLanguage, DictShape> = {
  fr: frDict,
  en: enDict,
};

const LS_LANG = "dhi.lang";
const LS_THEME = "dhi.theme";

const DEFAULT_LANG: AppLanguage = "fr";
const DEFAULT_THEME: AppTheme = "light";

function getStoredLang(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const raw = window.localStorage.getItem(LS_LANG);
    if (raw === "fr" || raw === "en") return raw;
  } catch {}
  return DEFAULT_LANG;
}

function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(LS_THEME);
    if (raw === "light" || raw === "dark") return raw;
    const prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch {
    return DEFAULT_THEME;
  }
}

type NestedDict = DictShape;
type NestedKey<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & (string | number)]: T[K] extends object
        ? NestedKey<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & (string | number)]
  : never;

export type TranslationKey = NestedKey<NestedDict>;

function getByPath(d: DictShape, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = d;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

interface I18nContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  dir: TextDirection;
  t: (key: TranslationKey, fallback?: string) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(DEFAULT_LANG);
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME);

  const setLang = useCallback((l: AppLanguage) => {
    setLangState(l);
    try {
      window.localStorage.setItem(LS_LANG, l);
    } catch {}
    const cfg = LANGUAGES.find((x) => x.id === l);
    const dir = cfg?.dir ?? "ltr";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", l);
      document.documentElement.setAttribute("dir", dir);
    }
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(LS_THEME, t);
    } catch {}
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (t === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const dir: TextDirection =
    LANGUAGES.find((l) => l.id === lang)?.dir ?? "ltr";

  useEffect(() => {
    const storedLang = getStoredLang();
    if (storedLang !== lang) {
      setLangState(storedLang);
    }
    try {
      window.localStorage.setItem(LS_LANG, storedLang);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", storedLang);
      const cfg = LANGUAGES.find((l) => l.id === storedLang);
      document.documentElement.setAttribute("dir", cfg?.dir ?? "ltr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== theme) {
      setThemeState(storedTheme);
    }
    try {
      window.localStorage.setItem(LS_THEME, storedTheme);
    } catch {}
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (storedTheme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const dict = DICTS[lang];
      const value = getByPath(dict, key);
      if (typeof value === "string") return value;
      if (typeof fallback === "string") return fallback;
      if (lang !== "fr") {
        const enValue = getByPath(frDict, key);
        if (typeof enValue === "string") return enValue;
      }
      return key;
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      theme,
      setTheme,
      toggleTheme,
      dir,
      t,
      languages: LANGUAGES,
    }),
    [lang, setLang, theme, setTheme, toggleTheme, dir, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const fallback: I18nContextValue = {
      lang: DEFAULT_LANG,
      setLang: () => {},
      theme: DEFAULT_THEME,
      setTheme: () => {},
      toggleTheme: () => {},
      dir: "ltr",
      t: (k, fb) => (typeof fb === "string" ? fb : k),
      languages: LANGUAGES,
    };
    return fallback;
  }
  return ctx;
}

export { LANGUAGES };
