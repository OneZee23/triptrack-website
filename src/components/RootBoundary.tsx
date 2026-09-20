import { LanguageProvider } from '../i18n/LanguageContext';
import NotFound from '../pages/NotFound';

/**
 * Any thrown route error (including a bad lazy chunk) renders the same branded
 * page instead of React Router's developer error screen, which is what a user
 * following an expired share link used to see.
 *
 * It carries its own `LanguageProvider` because an ErrorBoundary replaces the
 * layout that normally provides one — without it, a Russian visitor would be
 * told in English that something went wrong.
 */
export default function RootBoundary() {
  return (
    <LanguageProvider>
      <NotFound />
    </LanguageProvider>
  );
}
