import { useContext } from 'react';
import { LanguageContext } from './LanguageContextValue';

export function useTranslation() {
  return useContext(LanguageContext);
}
