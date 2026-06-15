import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  lang: string;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'fr' });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => {
    console.log('[LanguageProvider] État initial — langue:', i18n.language);
    return i18n.language;
  });

  console.log('[LanguageProvider] Render — lang:', lang, '| i18n.language:', i18n.language);

  useEffect(() => {
    const handleChange = (lng: string) => {
      console.log('[LanguageProvider] languageChanged →', lng, '| has EN:', i18n.hasResourceBundle?.('en', 'translation'), '| has FR:', i18n.hasResourceBundle?.('fr', 'translation'), '| t(dashboard):', i18n.t('nav.dashboard'));
      setLang(lng);
    };
    console.log('[LanguageProvider] Subscription au languageChanged');
    i18n.on('languageChanged', handleChange);
    return () => {
      console.log('[LanguageProvider] Nettoyage subscription');
      i18n.off('languageChanged', handleChange);
    };
  }, [i18n]);

  return <LanguageContext.Provider value={{ lang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
