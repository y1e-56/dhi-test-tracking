import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n/i18n';

interface LanguageContextType {
  lang: string;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'fr' });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const handleChange = () => setLang(i18n.language);
    i18n.on('languageChanged', handleChange);
    return () => { i18n.off('languageChanged', handleChange); };
  }, []);

  return <LanguageContext.Provider value={{ lang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
