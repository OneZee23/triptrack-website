import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Flag } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { tripDetail, type TripDetail } from './api';
import { codeOf, errorKey } from './errors';
import { formatDate, formatDistance, formatDuration, formatSpeed, tripDurationSeconds, type Lang } from './format';
import { decodePreviewPolyline } from './polyline';
import { ErrorNote, Spinner } from './ui';

// MapLibre is a megabyte; it arrives only when a trip is actually opened.
const TripMap = lazy(() => import('./TripMap'));

export default function TripPage() {
  const { t, lang, href } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorCode(null);
    try {
      setTrip(await tripDetail(id));
    } catch (error: unknown) {
      // Kept as a code, translated at render — see TripsPage.
      setErrorCode(codeOf(error) ?? 'UNKNOWN');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // The recorded track when the server sent one; the preview polyline is
  // the fallback, so an older trip still draws something.
  const coords = useMemo<[number, number][]>(() => {
    if (!trip) return [];
    if (trip.trackPoints && trip.trackPoints.length > 1) {
      return trip.trackPoints.map((p) => [p.latitude, p.longitude]);
    }
    return decodePreviewPolyline(trip.previewPolyline) ?? [];
  }, [trip]);

  const errorText = errorCode ? t(errorKey(errorCode)) : null;

  const back = (
    <Link
      to={href('/app/trips')}
      className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1e1e23]/65 hover:text-[#1e1e23] transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      {t('app.trip.back')}
    </Link>
  );

  if (loading) return <div>{back}<Spinner label={t('app.loading')} /></div>;

  if (!trip) {
    return (
      <div>
        {back}
        <ErrorNote message={errorText ?? t('app.error.generic')} onRetry={() => { void load(); }} retryLabel={t('app.retry')} />
      </div>
    );
  }

  const duration = tripDurationSeconds(trip);
  const language = lang as Lang;

  return (
    <div>
      {back}

      <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#1e1e23] mb-2">
        {trip.title?.trim() || t('app.trips.untitled')}
      </h1>
      <p className="text-[15px] text-[#1e1e23]/65 font-medium mb-8">
        {formatDate(trip.startDate, language)}
        {trip.region ? ` · ${trip.region}` : ''}
      </p>

      {coords.length > 1 ? (
        <Suspense fallback={<div className="w-full rounded-3xl bg-[#f4f2ee] border border-black/5" style={{ height: 420 }} />}>
          <TripMap coords={coords} />
        </Suspense>
      ) : (
        <div className="rounded-3xl bg-[#f4f2ee] border border-black/5 flex items-center justify-center text-[15px] text-[#1e1e23]/65 px-6 text-center" style={{ height: 220 }}>
          {t('app.trip.no_track')}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Stat label={t('app.trip.distance')} value={formatDistance(trip.distance, language)} accent />
        <Stat label={t('app.trip.duration')} value={formatDuration(duration, language)} />
        <Stat label={t('app.trip.avg_speed')} value={formatSpeed(trip.averageSpeed, language)} />
        <Stat label={t('app.trip.max_speed')} value={formatSpeed(trip.maxSpeed, language)} />
      </div>

      {trip.description?.trim() && (
        <p className="mt-8 text-[16px] text-[#1e1e23]/70 leading-relaxed whitespace-pre-line">
          {trip.description}
        </p>
      )}

      {trip.checkpoints && trip.checkpoints.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[20px] font-bold text-[#1e1e23] mb-4">{t('app.trip.checkpoints')}</h2>
          <ul className="rounded-3xl bg-white border border-black/5 divide-y divide-black/5 overflow-hidden">
            {trip.checkpoints.map((checkpoint, index) => (
              <li key={checkpoint.id} className="flex items-center gap-4 px-5 py-4">
                <Flag className="w-4 h-4 text-[#EB571E] shrink-0" aria-hidden="true" />
                <span className="font-semibold text-[#1e1e23] flex-1 truncate">
                  {/* The app doesn't store a default name either — the
                      number comes from the order in time (TripMoments). */}
                  {checkpoint.name?.trim()
                    || t('app.trip.checkpoint_n').replace('{n}', String(index + 1))}
                </span>
                <span className="text-[14px] text-[#1e1e23]/65 font-medium whitespace-nowrap">
                  {formatDistance(checkpoint.distanceFromStart, language)}
                  {' · '}
                  {formatDuration(checkpoint.elapsedFromStart, language)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* No photos, on purpose: `TripsService.serializeTrip` sends no photo
          field at all, and the stored values are private R2 keys that would
          need `POST /photos/url` to presign. Nothing here guesses a URL. */}

      {errorText && (
        <div className="mt-8">
          <ErrorNote message={errorText} onRetry={() => { void load(); }} retryLabel={t('app.retry')} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white border border-black/5 px-5 py-4">
      <div className="text-[12px] uppercase tracking-wider text-[#1e1e23]/65 font-semibold mb-1">{label}</div>
      <div className={`text-[22px] font-bold ${accent ? 'text-[#EB571E]' : 'text-[#1e1e23]'}`}>{value}</div>
    </div>
  );
}
