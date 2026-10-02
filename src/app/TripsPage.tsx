import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Clock3, Flag, LocateFixed, Map, MapPin, Plus, RefreshCw, Route, Search, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { tripDetail, type TripDetail, type TripSummary } from './api';
import { codeOf, errorKey } from './errors';
import { formatDate, formatDistance, formatDuration, formatSpeed, tripDurationSeconds } from './format';
import { detailCoordinates, filterTrips, previewCoordinates, validCoordinate } from './tripExplorer';
import { useTripLibrary } from './useTripLibrary';
import { ErrorNote, Spinner } from './ui';
import './trip-explorer.css';
import './manual-trip.css';
import { manualCopy } from './manualCopy';
import { useManualTripCapabilities } from './useManualTripCapabilities';

const TripsMap = lazy(() => import('./TripsMap'));
const NO_CHECKPOINTS: NonNullable<TripDetail['checkpoints']> = [];

export default function TripsPage() {
  const { t, lang, href } = useTranslation();
  const library = useTripLibrary();
  const { capabilities } = useManualTripCapabilities();
  const manualTripsAvailable = capabilities?.manualTrips === true;
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<{ id: string; trip?: TripDetail; error?: string } | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const [focusedCheckpointId, setFocusedCheckpointId] = useState<string | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const mapPanel = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => filterTrips(library.trips, { query, from, to }), [library.trips, query, from, to]);
  // Filtering away a selected trip closes the detail immediately, including
  // while its network request is still pending.
  const selected = visible.find((trip) => trip.id === selectedId) ?? null;
  const activeId = selected?.id ?? null;
  const detail = detailState?.id === activeId ? detailState.trip ?? null : null;
  const detailError = detailState?.id === activeId ? detailState.error : null;
  const detailLoading = !!activeId && !detail && !detailError;

  useEffect(() => {
    if (!activeId) return;
    let current = true;
    void tripDetail(activeId).then(
      (trip) => { if (current) setDetailState({ id: activeId, trip }); },
      (error: unknown) => { if (current) setDetailState({ id: activeId, error: codeOf(error) ?? 'UNKNOWN' }); },
    );
    return () => { current = false; };
  }, [activeId, detailRetry]);

  const routes = useMemo(() => visible.map((trip) => ({ id: trip.id, coords: previewCoordinates(trip) })), [visible]);
  const selectedCoords = useMemo(() => detail ? detailCoordinates(detail) : null, [detail]);
  const checkpoints = detail?.checkpoints ?? NO_CHECKPOINTS;
  const filtered = !!(query || from || to);
  const totalDistance = visible.reduce((sum, trip) => sum + (Number.isFinite(trip.distance) ? trip.distance : 0), 0);
  const routeCount = routes.filter((route) => route.coords.length > 1).length;

  function selectTrip(id: string) {
    setSelectedId(id);
    setFocusedCheckpointId(null);
    setMobileTab('map');
  }

  function showOverview() {
    setSelectedId(null);
    setFocusedCheckpointId(null);
    setFitRequest((value) => value + 1);
  }

  function resetFilters() {
    setQuery(''); setFrom(''); setTo('');
  }

  function retryDetail() {
    if (activeId) setDetailState({ id: activeId });
    setDetailRetry((value) => value + 1);
  }

  if (library.loading && library.trips.length === 0) return <Spinner label={t('app.trips.loading')} />;
  if (library.error && library.trips.length === 0) {
    return <ErrorNote message={t(errorKey(library.error))} onRetry={() => { void library.retry(); }} retryLabel={t('app.retry')} />;
  }
  if (library.trips.length === 0) {
    return (
      <div className="explorer-empty">
        <span className="explorer-empty-icon"><Route size={32} aria-hidden="true" /></span>
        <h1>{t('app.trips.empty_title')}</h1>
        <p>{t('app.trips.empty_body')}</p>
        <AppStoreBadge className="h-[56px]" />
        {manualTripsAvailable && <Link className="explorer-create" to={href('/app/trips/new')}><Plus size={16} />{manualCopy[lang].add}<small>PRO</small></Link>}
        <button className="explorer-text-button" onClick={() => { void library.refresh(); }}><RefreshCw size={15} />{t('app.explorer.refresh')}</button>
      </div>
    );
  }

  return (
    <div className="trip-explorer">
      <div className="explorer-heading">
        <div>
          <p className="explorer-eyebrow">{t('app.explorer.eyebrow')}</p>
          <h1>{t('app.trips.title')}<span className="explorer-count">{library.total}</span></h1>
          <p className="explorer-intro">{t('app.explorer.intro')}</p>
        </div>
        <div className="explorer-sync">
          {manualTripsAvailable && <Link className="explorer-create" to={href('/app/trips/new')}><Plus size={16} />{manualCopy[lang].add}<small>PRO</small></Link>}
          <span role="status"><span className={library.loading ? 'sync-dot is-loading' : 'sync-dot'} />
            {library.loading || library.error || library.trips.length !== library.total
              ? t('app.explorer.loaded').replace('{n}', String(library.trips.length)).replace('{total}', String(library.total))
              : t('app.explorer.synced')}
          </span>
          <button className="explorer-icon-button" disabled={library.loading} onClick={() => { setSelectedId(null); setDetailState(null); void library.refresh(); }} aria-label={t('app.explorer.refresh')} title={t('app.explorer.refresh')}><RefreshCw size={17} /></button>
        </div>
      </div>

      {library.error && <ErrorNote message={t(errorKey(library.error))} onRetry={() => { void library.retry(); }} retryLabel={t('app.retry')} />}

      <div className="explorer-mobile-tabs" role="group" aria-label={t('app.explorer.view')}>
        <button aria-pressed={mobileTab === 'list'} onClick={() => setMobileTab('list')}><Route size={17} />{t('app.explorer.list')}</button>
        <button aria-pressed={mobileTab === 'map'} onClick={() => setMobileTab('map')}><Map size={17} />{t('app.explorer.map')}</button>
      </div>

      <div className={`explorer-workspace mobile-${mobileTab}`}>
        <aside className="explorer-sidebar" aria-label={t('app.explorer.list')}>
          <div className="explorer-filters">
            <label className="explorer-search">
              <Search size={18} aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('app.explorer.search')} aria-label={t('app.explorer.search')} type="search" />
            </label>
            <div className="explorer-date-range">
              <label><span>{t('app.explorer.from')}</span><input type="date" aria-label={t('app.explorer.from')} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
              <span className="date-divider">—</span>
              <label><span>{t('app.explorer.to')}</span><input type="date" aria-label={t('app.explorer.to')} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
            <div className="explorer-list-summary">
              <span>{t('app.trips.count').replace('{n}', String(visible.length))}</span>
              {filtered ? <button onClick={resetFilters}>{t('app.explorer.reset')}<X size={13} /></button> : <span>{t('app.explorer.newest')}</span>}
            </div>
            {from && to && from > to && <p role="alert" className="explorer-date-error">{t('app.explorer.date_error')}</p>}
          </div>

          <div className="explorer-trip-list">
            {visible.length === 0 ? <div className="explorer-no-results"><Search size={26} /><h2>{t('app.explorer.no_results')}</h2><p>{t('app.explorer.no_results_body')}</p><button className="explorer-text-button" onClick={resetFilters}>{t('app.explorer.reset')}</button></div> :
              visible.map((trip, index) => <TripRow key={trip.id} trip={trip} index={index} selected={trip.id === activeId} onSelect={() => selectTrip(trip.id)} />)}
          </div>
          <div className="explorer-library-note"><Check size={14} aria-hidden="true" />{t('app.explorer.private')}</div>
        </aside>

        <section className="explorer-map-panel" ref={mapPanel} aria-label={t('app.explorer.map')}>
          <Suspense fallback={<div className="explorer-map-loading"><Spinner label={t('app.explorer.map_loading')} /></div>}>
            <TripsMap routes={routes} selectedId={activeId} selectedCoords={selectedCoords} checkpoints={checkpoints} focusedCheckpointId={focusedCheckpointId} onSelect={selectTrip} fitRequest={fitRequest} />
          </Suspense>
          <div className="explorer-map-toolbar">
            <button className={`explorer-map-button ${!selected ? 'is-current' : ''}`} onClick={showOverview}><Map size={16} />{t('app.explorer.overview')}</button>
            <button className="explorer-map-button" onClick={() => { setFocusedCheckpointId(null); setFitRequest((value) => value + 1); }} aria-label={t('app.explorer.fit')} title={t('app.explorer.fit')}><LocateFixed size={18} /></button>
          </div>

          {selected ? (
            <div className="explorer-detail" aria-live="polite">
              <div className="explorer-detail-heading">
                <div><p className="explorer-eyebrow">{formatDate(selected.startDate, lang)}</p><h2>{selected.title?.trim() || t('app.trips.untitled')}</h2>{selected.region && <p className="explorer-detail-region"><MapPin size={13} />{selected.region}</p>}</div>
                <button className="explorer-icon-button" onClick={showOverview} aria-label={t('app.explorer.close')}><X size={19} /></button>
              </div>
              <div className="explorer-detail-stats">
                <Metric label={t('app.trip.distance')} value={formatDistance(selected.distance, lang)} />
                <Metric label={t('app.trip.duration')} value={formatDuration(tripDurationSeconds(selected), lang)} />
                <Metric label={t('app.trip.avg_speed')} value={formatSpeed(selected.averageSpeed, lang)} />
              </div>
              {detailLoading && <p role="status" className="explorer-detail-status">{t('app.explorer.track_loading')}</p>}
              {detailError && <ErrorNote message={t(errorKey(detailError))} onRetry={retryDetail} retryLabel={t('app.retry')} />}
              {detail && selectedCoords?.length === 0 && <p className="explorer-detail-status">{t('app.trip.no_track')}</p>}
              {checkpoints.length > 0 && <div className="explorer-checkpoints" aria-label={t('app.trip.checkpoints')}>
                {checkpoints.map((point, index) => <button key={point.id} disabled={!validCoordinate(point.latitude, point.longitude)} aria-pressed={focusedCheckpointId === point.id} onClick={() => setFocusedCheckpointId(point.id)} title={validCoordinate(point.latitude, point.longitude) ? formatDistance(point.distanceFromStart, lang) : t('app.explorer.no_coordinate')}><Flag size={13} />{point.name?.trim() || t('app.trip.checkpoint_n').replace('{n}', String(index + 1))}</button>)}
              </div>}
              <Link className="explorer-detail-link" to={href(`/app/trips/${selected.id}`)}>{t('app.explorer.details')}<ArrowUpRight size={16} /></Link>
            </div>
          ) : (
            <div className="explorer-overview-note">
              <span className="explorer-overview-icon"><Route size={22} /></span>
              <div><strong>{formatDistance(totalDistance, lang)}</strong><p>{visible.length ? t('app.explorer.overview_hint') : t('app.explorer.no_results_body')}</p>{routeCount < visible.length && <small>{t('app.explorer.mapped').replace('{n}', String(routeCount)).replace('{total}', String(visible.length))}</small>}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TripRow({ trip, index, selected, onSelect }: { trip: TripSummary; index: number; selected: boolean; onSelect: () => void }) {
  const { t, lang } = useTranslation();
  return <button className={`explorer-trip ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <div className="explorer-trip-number">{String(index + 1).padStart(2, '0')}</div>
    <div className="explorer-trip-content"><p className="explorer-trip-date"><CalendarDays size={12} />{formatDate(trip.startDate, lang)}</p><h2>{trip.title?.trim() || t('app.trips.untitled')}</h2>{trip.source === 'manual' && <span className="explorer-manual-label">{t('app.trip.manual_label')}</span>}{trip.region && <p className="explorer-trip-region">{trip.region}</p>}<div className="explorer-trip-stats"><strong>{formatDistance(trip.distance, lang)}</strong><span><Clock3 size={12} />{formatDuration(tripDurationSeconds(trip), lang)}</span></div></div>
    <ChevronRight className="explorer-trip-arrow" size={16} aria-hidden="true" />
  </button>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
