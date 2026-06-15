import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  lang: string;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'fr' });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const handleChange = () => setLang(i18n.language);
    i18n.on('languageChanged', handleChange);
    return () => { i18n.off('languageChanged', handleChange); };
  }, [i18n]);

  return <LanguageContext.Provider value={{ lang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
