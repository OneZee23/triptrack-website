import { Link, useLocation } from 'react-router';
import { Compass, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';

/// Catch-all page. It has two jobs, and the second one is why it exists:
/// a plain "404" is fine for a mistyped URL, but most people who land here
/// followed a SHARED TRIP link (`/s/<code>`) that has expired, was revoked,
/// or lost its route on the way through a messenger. Those people don't need
/// a status code — they need to be told the trip lives in the app.
export default function NotFound() {
  const { lang } = useTranslation();
  const { pathname } = useLocation();
  const isSharedTrip = pathname.startsWith('/s/');
  const isRu = lang === 'ru';

  usePageMeta(
    isRu ? 'Страница не найдена — TripTrack' : 'Page not found — TripTrack',
    isRu
      ? 'Ссылка не открылась. Если это была поездка — откройте её в приложении TripTrack.'
      : "This link didn't open. If it was a trip, open it in the TripTrack app.",
  );

  const title = isSharedTrip
    ? isRu ? 'Поездка не открылась' : "This trip didn't open"
    : isRu ? 'Такой страницы нет' : 'No such page';

  const body = isSharedTrip
    ? isRu
      ? 'Ссылка на поездку могла устареть, её мог отозвать автор, или она потерялась по дороге через мессенджер. Сама поездка никуда не делась — она в приложении.'
      : 'The trip link may have expired, been revoked by its author, or got mangled on its way through a messenger. The trip itself is still there — inside the app.'
    : isRu
      ? 'Возможно, адрес набран с опечаткой или страница переехала. Начните с главной — или загляните в приложение.'
      : 'The address may have a typo, or the page moved. Start from the home page — or open the app.';

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-40 px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#EB571E]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col items-center text-center max-w-2xl relative z-10 w-full">
        <div className="w-16 h-16 rounded-full bg-[#f4f2ee] flex items-center justify-center mb-10">
          <Compass className="w-8 h-8 text-[#EB571E]" />
        </div>

        <p className="font-mono text-[14px] tracking-[0.2em] text-[#1e1e23]/40 mb-6">404</p>

        <h1 className="text-[36px] md:text-[56px] font-bold tracking-tighter mb-8 leading-tight text-[#1e1e23]">
          {title}
        </h1>

        <p className="text-[18px] text-[#1e1e23]/50 mb-14 max-w-xl leading-relaxed">{body}</p>

        {isSharedTrip && (
          <div className="mb-12 flex flex-col items-center gap-6">
            <p className="text-[15px] text-[#1e1e23]/50">
              {isRu ? 'Откройте TripTrack — поездка ждёт там' : 'Open TripTrack — the trip is waiting there'}
            </p>
            <AppStoreBadge className="h-[56px]" />
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#EB571E] text-white font-semibold text-[16px] hover:scale-[1.03] active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            {isRu ? 'На главную' : 'Go home'}
          </Link>
          {!isSharedTrip && (
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#f4f2ee] text-[#1e1e23] font-semibold text-[16px] hover:scale-[1.03] active:scale-95 transition-transform"
            >
              {isRu ? 'Скачать приложение' : 'Get the app'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
