import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

console.log('[i18n] Initialisé — langue:', i18n.language, '| EN keys:', Object.keys(en).length, '| FR keys:', Object.keys(fr).length);
console.log('[i18n] hasResourceBundle — en:', i18n.hasResourceBundle?.('en', 'translation'), '| fr:', i18n.hasResourceBundle?.('fr', 'translation'));
console.log('[i18n] t(nav.dashboard):', i18n.t('nav.dashboard'));
console.log('[i18n] languages:', i18n.languages);
console.log('[i18n] options.fallbackLng:', i18n.options?.fallbackLng);

i18n.on('languageChanged', (lng) => {
  console.log('[i18n] languageChanged event — lng:', lng, '| has EN bundle:', i18n.hasResourceBundle?.('en', 'translation'), '| has FR bundle:', i18n.hasResourceBundle?.('fr', 'translation'));
  console.log('[i18n] t(nav.dashboard):', i18n.t('nav.dashboard'));
});

export default i18n;
