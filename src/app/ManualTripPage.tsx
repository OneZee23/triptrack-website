import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCircle2, ChevronRight, LocateFixed, LockKeyhole, MapPin, Plus, RefreshCw, Route, Search, ShieldCheck, Undo2, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { codeOf, errorKey } from './errors';
import { formatDistance, formatDuration } from './format';
import { buildRoadRoute, createManualTrip, listVehicles, searchPlaces, type Coordinate, type ManualTripInput, type Place, type RouteResult, type RoutingCapabilities, type Vehicle } from './manualApi';
import { localDateTime, manualValidation, parseCoordinate, routeDistance } from './manualTrip';
import { manualCopy } from './manualCopy';
import type { ManualWaypoint } from './ManualTripMap';
import { useProStatus } from './useProStatus';
import { useManualTripCapabilities } from './useManualTripCapabilities';
import { ErrorNote, Spinner } from './ui';
import './trip-explorer.css';
import './manual-trip.css';

const ManualTripMap = lazy(() => import('./ManualTripMap'));
type Step = 'route' | 'details';

export default function ManualTripPage() {
  const { lang, href } = useTranslation();
  const c = manualCopy[lang];
  const { loading, capabilities } = useManualTripCapabilities();
  if (loading) return <div><Link className="manual-back" to={href('/app/trips')}><ArrowLeft size={16} />{c.back}</Link><Spinner label={c.checkingAvailability} /></div>;
  if (capabilities?.manualTrips !== true) return <div className="trip-explorer manual-pro-gate"><Link className="manual-back" to={href('/app/trips')}><ArrowLeft size={16} />{c.back}</Link><span className="manual-pro-icon"><Route size={36} /></span><h1>{c.availableSoon}</h1><p>{c.availableSoonBody}</p></div>;
  return <ManualTripEditor caps={capabilities} />;
}

function ManualTripEditor({ caps }: { caps: RoutingCapabilities }) {
  const { lang, t, href } = useTranslation();
  const c = manualCopy[lang];
  const pro = useProStatus();
  const [waypoints, setWaypoints] = useState<ManualWaypoint[]>([]);
  const [mode, setMode] = useState<'roads' | 'draw'>(caps.routing ? 'roads' : 'draw');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesError, setVehiclesError] = useState(false);
  const [vehicleRetry, setVehicleRetry] = useState(0);
  const [vehicleId, setVehicleId] = useState('');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchGeneration = useRef(0);
  const [route, setRoute] = useState<{ key: string; result?: RouteResult; error?: string } | null>(null);
  const [routeRetry, setRouteRetry] = useState(0);
  const [focus, setFocus] = useState<{ id: string; request: number } | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [step, setStep] = useState<Step>('route');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(() => localDateTime(new Date(Date.now() - 86_400_000)));
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [validation, setValidation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [frozen, setFrozen] = useState<ManualTripInput | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID());
  const alive = useRef(true);
  const inFlight = useRef(false);
  const busy = saving || !!frozen;
  const dirty = !savedId && (waypoints.length > 0 || title.trim().length > 0);
  const blocker = useBlocker(dirty);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [dirty]);

  // These responses are advisory. Creation repeats entitlement and vehicle
  // ownership checks on the server at the instant of saving.
  useEffect(() => {
    let current = true;
    void listVehicles().then(({ vehicles: list }) => {
      if (current) { setVehicles(list); setVehiclesError(false); }
    }, () => { if (current) setVehiclesError(true); });
    return () => { current = false; };
  }, [vehicleRetry]);

  const pointCoordinates = useMemo<Coordinate[]>(() => waypoints.map((p) => [p.latitude, p.longitude]), [waypoints]);
  const routeKey = JSON.stringify(pointCoordinates);
  const currentRoute = mode === 'roads' && route?.key === routeKey ? route : null;
  const routePending = mode === 'roads' && waypoints.length >= 2 && !currentRoute?.result && !currentRoute?.error;
  const coordinates = mode === 'draw' ? pointCoordinates : currentRoute?.result?.coordinates ?? [];
  const distance = routeDistance(coordinates);
  const hasRoute = coordinates.length >= 2 && distance >= 10;
  const totalMinutes = hours * 60 + minutes;

  useEffect(() => {
    if (mode !== 'roads' || pointCoordinates.length < 2 || !pro.status?.active) return;
    let current = true;
    const timer = window.setTimeout(() => {
      void buildRoadRoute(pointCoordinates).then(
        (result) => { if (current) setRoute({ key: routeKey, result }); },
        (error: unknown) => { if (current) setRoute({ key: routeKey, error: codeOf(error) ?? 'UNKNOWN' }); },
      );
    }, 500);
    return () => { current = false; window.clearTimeout(timer); };
  }, [mode, pointCoordinates, routeKey, routeRetry, pro.status?.active]);

  function addPoint(coordinate: Coordinate, name?: string, focusPoint = false) {
    if (busy) return;
    const limit = mode === 'roads' ? 25 : 500;
    if (waypoints.length >= limit) { setSearchError(c.pointLimit); return; }
    const point: ManualWaypoint = { id: crypto.randomUUID(), name: name ?? `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`, latitude: coordinate[0], longitude: coordinate[1] };
    setWaypoints((value) => [...value, point]); setValidation(null);
    if (focusPoint && waypoints.length === 0) setFocus({ id: point.id, request: Date.now() });
    else if (focusPoint) { setFocus(null); setFitRequest((value) => value + 1); }
  }

  function movePoint(id: string, coordinate: Coordinate) {
    if (busy) return;
    setWaypoints((value) => value.map((p) => p.id === id ? { ...p, latitude: coordinate[0], longitude: coordinate[1], name: `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}` } : p));
  }

  async function search() {
    if (busy || !query.trim()) return;
    const run = ++searchGeneration.current;
    setSearchError(null); setPlaces(null);
    const coordinate = parseCoordinate(query);
    if (coordinate) { addPoint(coordinate, undefined, true); setQuery(''); return; }
    if (!caps?.search) { setSearchError(c.invalidCoordinate); return; }
    setSearching(true);
    try {
      const result = await searchPlaces(query.trim(), lang);
      if (run === searchGeneration.current && alive.current) setPlaces(result.places);
    } catch (error: unknown) {
      if (run === searchGeneration.current && alive.current) setSearchError(t(errorKey(codeOf(error))));
    } finally {
      if (run === searchGeneration.current && alive.current) setSearching(false);
    }
  }

  function reorder(index: number, delta: number) {
    setWaypoints((value) => { const next = [...value]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  }

  function toDetails() {
    if (!hasRoute) return;
    if (!title.trim() && waypoints.length >= 2) {
      const named = waypoints.filter((p) => !parseCoordinate(p.name));
      if (named.length >= 2) setTitle(`${named[0].name.split(',')[0]} → ${named[named.length - 1].name.split(',')[0]}`.slice(0, 200));
    }
    setStep('details'); setValidation(null);
  }

  async function save() {
    if (inFlight.current) return;
    if (!frozen) {
      if (!Number.isInteger(hours) || hours < 0 || hours > 168 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) { setValidation('duration_error'); return; }
      const error = manualValidation({ title, start, minutes: totalMinutes, coordinates });
      if (error) { setValidation(error); return; }
      if (!pro.status?.active) { setSaveError('PRO_REQUIRED'); return; }
    }
    const payload = frozen ?? { id: attemptId, title: title.trim(), startDate: new Date(start).toISOString(), durationSeconds: totalMinutes * 60, ...(vehicleId ? { vehicleId } : {}), coordinates };
    inFlight.current = true; setSaving(true); setFrozen(payload); setSaveError(null); setValidation(null);
    try {
      const result = await createManualTrip(payload);
      if (alive.current) { setSavedId(result.id); setFrozen(null); }
    } catch (error: unknown) {
      if (!alive.current) return;
      const code = codeOf(error) ?? 'UNKNOWN';
      setSaveError(code);
      // Only explicit refusals prove that nothing was written. After a lost
      // reply preserve the exact payload and id, even if the user retries.
      if (['PRO_REQUIRED', 'PLUS_UNAVAILABLE', 'MANUAL_TRIPS_DISABLED', 'MANUAL_TRIP_INVALID', 'MANUAL_TRIP_ID_CONFLICT', 'VALIDATION_FAILED', 'VEHICLE_NOT_FOUND', 'TOO_MANY_REQUESTS'].includes(code)) setFrozen(null);
      if (code === 'MANUAL_TRIP_ID_CONFLICT') setAttemptId(crypto.randomUUID());
      if (code === 'PRO_REQUIRED') void pro.refresh();
    } finally {
      inFlight.current = false;
      if (alive.current) setSaving(false);
    }
  }

  function reset() {
    setWaypoints([]); setTitle(''); setSavedId(null); setStep('route'); setRoute(null); setFrozen(null); setSaveError(null); setValidation(null); setAttemptId(crypto.randomUUID()); setQuery(''); setPlaces(null); setFocus(null); setSearchError(null);
  }

  const exitDialog = blocker.state === 'blocked' ? <Confirm title={c.exitTitle} body={c.exitBody} cancel={c.stay} confirm={c.leave} onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()} /> : null;
  const backLink = <Link className="manual-back" to={href('/app/trips')}><ArrowLeft size={16} />{c.back}</Link>;

  if (savedId) return <div className="trip-explorer manual-success">{backLink}<CheckCircle2 size={54} strokeWidth={1.4} /><p className="explorer-eyebrow">TripTrack</p><h1>{c.saved}</h1><p>{c.savedBody}</p><div className="manual-saved-summary"><Route size={21} /><div><strong>{title}</strong><span>{formatDistance(distance, lang)} · {formatDuration(totalMinutes * 60, lang)}</span></div><ShieldCheck size={20} /></div><Link className="manual-primary" to={href(`/app/trips/${savedId}`)}>{c.open}<ArrowRight size={17} /></Link><button className="explorer-text-button" onClick={reset}>{c.another}</button></div>;
  if (pro.loading && !dirty && !pro.status) return <div>{backLink}<Spinner label={c.checking} /></div>;
  if (!pro.status?.active && !dirty) return <div className="trip-explorer manual-pro-gate">{backLink}<span className="manual-pro-icon"><Route size={36} /><span>PRO</span></span><h1>{c.pro}</h1><p>{c.proBody}</p><p className="manual-muted">{c.proHint}</p>{pro.error && <ErrorNote message={t(errorKey(pro.error))} />}<AppStoreBadge /><button className="explorer-text-button" onClick={() => { void pro.refresh(); }} disabled={pro.loading}><RefreshCw size={16} />{pro.loading ? c.checking : c.check}</button></div>;

  return <div className="trip-explorer manual-editor">
    {backLink}
    <div className="explorer-heading"><div><p className="explorer-eyebrow">{c.add}</p><h1>{c.title}</h1><p className="explorer-intro">{c.intro}</p></div><span className="manual-pro-pill"><Check size={13} />{pro.status?.active ? c.proActive : 'PRO'}</span></div>
    {!pro.status?.active && <ErrorNote message={c.proLost} onRetry={() => { void pro.refresh(); }} retryLabel={c.check} />}
    <div className="manual-workspace">
      <section className="manual-panel" aria-label={c.add}>
        <nav className="manual-steps" aria-label={c.add}><button disabled={busy} aria-current={step === 'route' ? 'step' : undefined} onClick={() => setStep('route')}><span>{step === 'details' ? <Check size={13} /> : '1'}</span>{c.routeStep}</button><ChevronRight size={15} /><button disabled={!hasRoute || busy} aria-current={step === 'details' ? 'step' : undefined} onClick={toDetails}><span>2</span>{c.detailsStep}</button></nav>
        <div className="manual-panel-scroll">
          {step === 'route' ? <>
            <div className="manual-mode" role="group" aria-label={c.routeStep}><button disabled={!caps.routing || busy || waypoints.length > 25} aria-pressed={mode === 'roads'} onClick={() => setMode('roads')}>{c.roads}</button><button disabled={busy} aria-pressed={mode === 'draw'} onClick={() => setMode('draw')}>{c.draw}</button></div>
            <p className="manual-hint">{mode === 'roads' ? c.roadsHint : c.drawHint}</p>
            {!caps.routing && <p className="manual-service-note">{c.noProvider}</p>}
            <form className="manual-search" onSubmit={(event) => { event.preventDefault(); void search(); }}><label className="explorer-search"><Search size={17} /><input aria-label={c.searchLabel} type="search" maxLength={200} value={query} onChange={(e) => { setQuery(e.target.value); searchGeneration.current++; setSearching(false); setPlaces(null); setSearchError(null); }} placeholder={caps?.search ? c.search : c.coordinateSearch} disabled={busy} /></label><button className="manual-secondary" disabled={!query.trim() || searching || busy} type="submit">{searching ? c.searching : c.searchAction}</button></form>
            {searchError && <p className="manual-inline-error" role="alert">{searchError}</p>}
            {places && <div className="manual-search-results" role="region" aria-label={c.searchLabel}>{places.length ? places.map((place, i) => <button key={`${place.latitude}:${place.longitude}:${i}`} disabled={busy} onClick={() => { addPoint([place.latitude, place.longitude], place.name, true); setPlaces(null); setQuery(''); }}><MapPin size={16} /><span>{place.name}</span><Plus size={15} /></button>) : <p>{c.noPlaces}</p>}</div>}
            <div className="manual-route-label"><strong>{c.routeStep}</strong><span>{waypoints.length} / {mode === 'roads' ? 25 : 500}</span></div>
            {waypoints.length === 0 ? <div className="manual-points-empty"><MapPin size={26} /><p>{c.addMap}</p><small>{c.coordinatesHint}</small></div> : <ol className="manual-waypoints">{waypoints.map((point, index) => <li key={point.id}><span className="manual-point-number">{index + 1}</span><button className="manual-point-name" title={c.focus} onClick={() => setFocus({ id: point.id, request: Date.now() })}><small>{index === 0 ? c.start : index === waypoints.length - 1 ? c.finish : c.point}</small><span>{point.name}</span></button><div className="manual-point-actions"><button aria-label={`${c.up}: ${index + 1}`} disabled={index === 0 || busy} onClick={() => reorder(index, -1)}><ArrowUp size={14} /></button><button aria-label={`${c.down}: ${index + 1}`} disabled={index === waypoints.length - 1 || busy} onClick={() => reorder(index, 1)}><ArrowDown size={14} /></button><button aria-label={`${c.remove}: ${index + 1}`} disabled={busy} onClick={() => setWaypoints((value) => value.filter((p) => p.id !== point.id))}><X size={15} /></button></div></li>)}</ol>}
            {waypoints.length > 0 && <div className="manual-route-actions"><button disabled={busy || waypoints.length < 2} onClick={() => setWaypoints((value) => [...value].reverse())}><RefreshCw size={14} />{c.reverse}</button><button disabled={busy} onClick={() => setClearConfirm(true)}>{c.clear}</button></div>}
            {currentRoute?.error && <ErrorNote message={currentRoute.error === 'ROUTING_NOT_CONFIGURED' ? c.routeUnconfigured : currentRoute.error === 'ROUTE_NOT_FOUND' ? c.noRoute : c.routeFailed} onRetry={() => { setRoute(null); setRouteRetry((value) => value + 1); }} retryLabel={c.retryRoute} />}
          </> : <>
            <label className="manual-field"><span>{c.tripTitle}</span><input autoFocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder={c.titlePlaceholder} disabled={busy} /></label>
            <label className="manual-field"><span>{c.when}</span><input type="datetime-local" value={start} max={localDateTime(new Date())} onChange={(e) => setStart(e.target.value)} disabled={busy} /><small>{c.timeZone} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</small></label>
            <fieldset className="manual-duration" disabled={busy}><legend>{c.duration}</legend><label><input aria-label={c.hours} type="number" min={0} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} /><span>{c.hours}</span></label><label><input aria-label={c.minutes} type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /><span>{c.minutes}</span></label></fieldset>
            {currentRoute?.result && <button className="explorer-text-button manual-estimate" disabled={busy} onClick={() => { const estimate = Math.max(1, Math.ceil(currentRoute.result!.durationSeconds / 60)); setHours(Math.floor(estimate / 60)); setMinutes(estimate % 60); }}>{c.useEstimate} · {formatDuration(currentRoute.result.durationSeconds, lang)}</button>}
            <label className="manual-field"><span>{c.vehicle}</span><select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={busy}><option value="">{c.noVehicle}</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.avatarEmoji} {vehicle.name}</option>)}</select></label>
            {vehiclesError && <ErrorNote message={c.vehiclesError} onRetry={() => setVehicleRetry((value) => value + 1)} retryLabel={c.vehicleRetry} />}
            <div className="manual-review"><ShieldCheck size={20} /><div><strong>{c.review}</strong><p>{c.private}</p><p>{c.homePrivacy}</p><p>{c.manualNote}</p></div></div>
          </>}

        </div>
        <div className="manual-panel-footer">
          {validation && <p className="manual-inline-error" role="alert">{c[validation as keyof typeof c]}</p>}
          {saveError && <ErrorNote message={frozen ? c.uncertain : saveError === 'MANUAL_TRIPS_DISABLED' ? c.temporarilyUnavailable : saveError === 'PRO_REQUIRED' ? c.pro_required : saveError === 'VEHICLE_NOT_FOUND' ? c.vehicle_missing : saveError === 'MANUAL_TRIP_ID_CONFLICT' ? c.id_conflict : saveError === 'MANUAL_TRIP_INVALID' ? c.duration_error : t(errorKey(saveError))} />}<div className="manual-route-total"><div><small>{c.distance}</small><strong>{hasRoute ? formatDistance(distance, lang) : '—'}</strong></div><span role="status">{routePending ? c.building : hasRoute ? c.ready : c.routeNeeded}</span></div>{step === 'route' ? <button className="manual-primary" disabled={!hasRoute || routePending || busy} onClick={toDetails}>{c.next}<ArrowRight size={17} /></button> : <><button className="manual-primary" disabled={saving || (!frozen && !pro.status?.active)} onClick={() => { void save(); }}>{saving ? c.saving : frozen ? c.retrySave : c.save}{saving ? <RefreshCw size={17} className="animate-spin" /> : <Check size={17} />}</button><button className="explorer-text-button" disabled={busy} onClick={() => setStep('route')}>{c.previous}</button></>}</div>
      </section>
      <section className="manual-map-panel" aria-label={c.routeStep}>
        <Suspense fallback={<Spinner label={t('app.explorer.map_loading')} />}><ManualTripMap waypoints={waypoints} coordinates={coordinates} routePending={mode === 'roads' && !currentRoute?.result} onAdd={addPoint} onMove={movePoint} focus={focus} fitRequest={fitRequest} disabled={busy || step !== 'route'} /></Suspense>
        <div className="manual-map-toolbar"><button className="explorer-map-button" onClick={() => setFitRequest((value) => value + 1)} title={c.fit} aria-label={c.fit}><LocateFixed size={19} /></button><button className="explorer-map-button" disabled={waypoints.length === 0 || busy || step !== 'route'} onClick={() => setWaypoints((value) => value.slice(0, -1))} title={c.undo} aria-label={c.undo}><Undo2 size={18} /></button></div>
        <div className="manual-map-instruction"><span className="manual-map-instruction-icon">{step === 'route' ? <Plus size={18} /> : <LockKeyhole size={17} />}</span><div><strong>{step === 'route' ? c.addMap : c.review}</strong><p>{step === 'route' ? c.drag : `${formatDistance(distance, lang)} · ${formatDuration(totalMinutes * 60, lang)}`}</p></div></div>
      </section>
    </div>
    {(caps?.routing || caps?.search) && <p className="manual-attribution"><a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">{c.providerCredit}</a> · {c.providerPrivacy}</p>}
    {clearConfirm && <Confirm title={c.confirmClear} cancel={c.cancel} confirm={c.clear} onCancel={() => setClearConfirm(false)} onConfirm={() => { setWaypoints([]); setClearConfirm(false); }} />}
    {exitDialog}
  </div>;
}

function Confirm({ title, body, cancel, confirm, onCancel, onConfirm }: { title: string; body?: string; cancel: string; confirm: string; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="manual-confirm" onCancel={(event) => { event.preventDefault(); onCancel(); }} aria-labelledby="manual-confirm-title"><h2 id="manual-confirm-title">{title}</h2>{body && <p>{body}</p>}<div><button className="manual-secondary" autoFocus onClick={onCancel}>{cancel}</button><button className="manual-primary" onClick={onConfirm}>{confirm}</button></div></dialog>;
}
