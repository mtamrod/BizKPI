import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es';
import en from './locales/en';
import fr from './locales/fr';
import pt from './locales/pt';
import it from './locales/it';
import de from './locales/de';

export const LANGUAGES = [
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

i18n
  .use(initReactI18next)
  .init({
    resources: { es: { t: es }, en: { t: en }, fr: { t: fr }, pt: { t: pt }, it: { t: it }, de: { t: de } },
    lng: 'es',
    fallbackLng: 'es',
    defaultNS: 't',
    interpolation: { escapeValue: false },
  });

export default i18n;
