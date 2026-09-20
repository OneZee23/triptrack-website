import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { listTrips, type TripSummary } from './api';
import { codeOf, errorKey } from './errors';
import { formatDate, formatDistance, formatDuration, tripDurationSeconds, type Lang } from './format';
import { RoutePreview } from './RoutePreview';
import { ErrorNote, Spinner } from './ui';

const PAGE = 20;

export default function TripsPage() {
  const { t, lang, href } = useTranslation();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = useCallback(async (offset: number) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    setErrorCode(null);
    try {
      const page = await listTrips(PAGE, offset);
      // Trips stay in component state only: nothing personal is written to
      // the browser's storage (see storage.ts).
      setTrips((prev) => (offset === 0 ? page.trips : [...prev, ...page.trips]));
      setTotal(page.total);
    } catch (error: unknown) {
      // The CODE is what we keep: translating here would put `t` in this
      // callback's deps, and switching language would refetch page one and
      // throw away everything "Show more" had collected.
      setErrorCode(codeOf(error) ?? 'UNKNOWN');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const errorText = errorCode ? t(errorKey(errorCode)) : null;

  if (loading) return <Spinner label={t('app.trips.loading')} />;

  if (errorText && trips.length === 0) {
    return <ErrorNote message={errorText} onRetry={() => { void load(0); }} retryLabel={t('app.retry')} />;
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <h1 className="text-[28px] font-bold text-[#1e1e23] mb-3">{t('app.trips.empty_title')}</h1>
        <p className="text-[17px] text-[#1e1e23]/50 mb-10 max-w-md leading-relaxed">
          {t('app.trips.empty_body')}
        </p>
        <AppStoreBadge className="h-[56px]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-8">
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#1e1e23]">
          {t('app.trips.title')}
        </h1>
        <span className="text-[14px] text-[#1e1e23]/40 font-medium">
          {t('app.trips.count').replace('{n}', String(total))}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            to={href(`/app/trips/${trip.id}`)}
            lang={lang as Lang}
            untitled={t('app.trips.untitled')}
          />
        ))}
      </div>

      {errorText && (
        <div className="mt-6">
          <ErrorNote message={errorText} onRetry={() => { void load(trips.length); }} retryLabel={t('app.retry')} />
        </div>
      )}

      {trips.length < total && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => { void load(trips.length); }}
            disabled={loadingMore}
            className="rounded-full border border-black/10 px-8 py-3 text-[15px] font-bold text-[#1e1e23] hover:bg-white transition-colors disabled:opacity-50"
          >
            {loadingMore ? t('app.loading') : t('app.trips.more')}
          </button>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, to, lang, untitled }: { trip: TripSummary; to: string; lang: Lang; untitled: string }) {
  const duration = tripDurationSeconds(trip);
  return (
    <Link
      to={to}
      className="block rounded-3xl bg-white border border-black/5 p-4 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
    >
      <RoutePreview polyline={trip.previewPolyline} />
      <div className="px-1 pt-4">
        <h2 className="font-bold text-[17px] text-[#1e1e23] truncate">
          {trip.title?.trim() || untitled}
        </h2>
        <div className="flex items-center gap-4 mt-2 text-[13px] text-[#1e1e23]/40 font-medium">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            {formatDate(trip.startDate, lang)}
          </span>
          {trip.region && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{trip.region}</span>
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3 mt-3">
          <span className="text-[20px] font-bold text-[#EB571E]">{formatDistance(trip.distance, lang)}</span>
          <span className="text-[15px] text-[#1e1e23]/40 font-medium">{formatDuration(duration, lang)}</span>
        </div>
      </div>
    </Link>
  );
}
