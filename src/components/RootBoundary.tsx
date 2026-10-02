import { useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { LanguageProvider } from '../i18n/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import NotFound from '../pages/NotFound';

/**
 * A route may exist even when its code could not load. Only an actual 404
 * should say the address is missing; other failures offer a document reload.
 * Recovery is explicit: an automatic reload could discard a trip draft.
 * The boundary replaces AppLayout, so it needs its own language provider.
 */
export default function RootBoundary() {
  const error = useRouteError();
  return (
    <LanguageProvider>
      {isRouteErrorResponse(error) && error.status === 404 ? <NotFound /> : <PageFailure />}
    </LanguageProvider>
  );
}

function PageFailure() {
  const { lang, href } = useTranslation();
  const title = lang === 'ru' ? 'Не удалось открыть страницу' : 'Could not open this page';

  useEffect(() => {
    document.title = `${title} — TripTrack`;
  }, [title]);

  return (
    <main className="min-h-screen bg-[#f8f6f2] px-5 py-24 flex flex-col items-center justify-center text-center text-[#1e1e23]">
      <div className="max-w-xl">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#EB571E]/10 text-[#EB571E]">
          <RefreshCw aria-hidden className="h-7 w-7" />
        </div>
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-tight leading-tight">{title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#1e1e23]/65">
          {lang === 'ru'
            ? 'Не получилось загрузить или показать содержимое. Обнови страницу, чтобы попробовать снова.'
            : 'The content could not be loaded or displayed. Reload the page to try again.'}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#EB571E] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d14e1a]"
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            {lang === 'ru' ? 'Обновить страницу' : 'Reload page'}
          </button>
          {/* A document navigation also recovers a router with failed imports. */}
          <a href={href('/')} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-black/5 px-6 py-3 font-semibold transition-colors hover:bg-black/10">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {lang === 'ru' ? 'На главную' : 'Go home'}
          </a>
        </div>
      </div>
    </main>
  );
}
