# TripTrack — «Живой глобус» (Globe Hero) — Design Spec

- **Date:** 2026-06-09
- **Status:** Approved design (brainstorm complete) → ready for implementation plan
- **Author:** OneZee + Claude
- **Repos affected:** `trip-track-website` (lead), `trip-track-backend` (new public endpoint)
- **Branch suggestion:** `feat/globe-hero`

---

## 1. Goal & concept

Replace the current static/draggable-tile-map hero on **trip-track.app** with an interactive, auto-spinning, realistic **3D globe** that is the main product presentation. The globe plots **real public trips** (seeded with mock trips so it's never empty) as glowing route lines you can rotate, drag, and click to reveal an anonymous trip card. This embodies the product thesis ("Google Photos для дорог") on the landing page itself.

Reframing note: the competitor (Tofu Maps) that inspired this has **no globe** — its app is a flat 2D Mapbox map. The spinning globe is a net-new differentiator, not a copy.

## 2. UX / interaction model

- **Full-bleed hero**: realistic night Earth (city lights) on a near-black "space" background fills the first screen. Globe is the primary element.
- **Overlay**: headline + subheadline + "Скачать в App Store" CTA, anchored left over a darkening gradient scrim so text always reads. A live stat chip ("**N поездок · M городов**") from the API.
- **Idle** → slow auto-rotation. **User interacts (drag)** → rotation pauses, resumes after ~2.5s idle.
- **Click a route/point** → anonymous **minimal** trip card: region label + a small route-shape thumbnail (drawn from the anonymized coords) + generated anonymous avatar + App Store CTA. **No numeric distance/duration/time** (per §9 privacy — and the data contract §7 carries none). No real names, no real user photos.
- **Affordance hint** ("покрути · приблизь · нажми") so it reads as interactive, not a picture.
- **Mobile**: drag-to-rotate kept; zoom disabled (no scroll-hijack); reduced-motion / no-WebGL → static poster image.

## 3. Decisions locked (brainstorm outcomes)

| Topic | Decision |
|---|---|
| Globe style | **Realistic Earth** (react-globe.gl / three.js), night city-lights texture |
| Layout | **Full-bleed**, globe is the main hero, interactive (rotate/drag/zoom*/click) |
| What's plotted | **Real route polylines** as glowing lines + endpoint dots |
| Data source | **Live API** via new `GET /public/map`, **seeded** with 16 mock RU trips |
| Privacy | **Server-side deterministic anonymization** (clip ends, round, de-time) |
| Click card | **Minimal + anonymous** (route + stats + generated avatar + CTA); no real names/photos |
| Data delivery | **Website nginx reverse-proxy + 5-min micro-cache** at `/api/globe` (same-origin; no CORS) |

\* zoom is camera zoom on the textured sphere (region level), not street-level tiles.

## 4. Architecture

```
Browser (trip-track.app)
  └─ GlobeHero (React) ── fetch same-origin GET /api/globe
        └─ TripGlobe (react-globe.gl, lazy) renders Earth + glowing route paths + dots
                 │
   nginx (website container)  location /api/globe
        ├─ proxy_cache (5-min micro-cache, stale-while-revalidate)
        └─ proxy_pass → https://api.trip-track.app/public/map   (server-to-server, SNI on)
                 │
   NestJS backend  GET /public/map  (PublicModule, no auth, ThrottlerGuard)
        ├─ query: public, non-deleted, ended trips (mirrors social public filter)
        ├─ decode preview_polyline (bytea → [lat,lng][])
        ├─ ANONYMIZE (clip 500m ends, round 3dp, drop short, de-time)  ← privacy lives here, can't regress
        ├─ in-process TTL cache (~60s)
        └─ return { stats:{trips,cities}, trips:[{id,region,coords:[[lat,lng]…]}] }
                 │
   Postgres  trip ⨝ account
```

## 5. Components & files

### Frontend (`trip-track-website`, React 19 + Vite 8 + Tailwind 4 + motion)

New:
- `src/components/globe/GlobeHero.tsx` — hero section: scrim + headline/CTA/stat-chip overlay + `<Suspense>`-wrapped `TripGlobe` + `TripCard` overlay; owns `selectedTrip` state and data fetch.
- `src/components/globe/TripGlobe.tsx` — **lazy** WebGL globe (react-globe.gl). Owns scene config, auto-rotate, paths/points, click handlers, perf guards, fallbacks. (See §10 for the verified component sketch.)
- `src/components/globe/TripCard.tsx` — anonymous minimal card (region label + route-shape SVG thumbnail + generated avatar + CTA; **no numeric stats**), animated in with `motion`.
- `src/hooks/useGlobeData.ts` — fetch `/api/globe` (same-origin), map to globe data, `loading/error/empty` states, `AbortController` on unmount.
- `src/lib/anonAvatar.ts` — deterministic avatar (gradient/identicon) + label ("Путешественник из {region}") from `trip.id`.
- `public/textures/earth-night-4k.avif` (+ `.webp` fallback, + `earth-night-2k.avif` LCP poster), `public/globe-poster.webp` (static fallback image). (See §11.)

Edited:
- `src/pages/Home.tsx` — mount `GlobeHero` as the top hero; **remove** the mobile carousel (≈ lines 285–339) and the desktop draggable CartoDB canvas (≈ lines 342–405); **keep** the headline hero (≈ 262–280) and the lower content sections (≈ 408–565). Remove now-dead imports/constants/hooks freed by that deletion (verify exact ranges at implementation time; the globe supersedes the tile map). Run `tsc -b`.
- `src/routes.tsx` / `src/components/AppLayout.tsx` — ensure Home (and the lazy globe) sit under a `<Suspense>` boundary.
- `vite.config.ts` — `resolve.dedupe:['three']`, `optimizeDeps.include:['three','react-globe.gl']`, and `build.rollupOptions.output.manualChunks` to split `three` + the globe libs into their own vendor chunk (use the function form to avoid breaking `React.lazy` — Vite #17653).
- `src/i18n/en.json` + `src/i18n/ru.json` — new `home.globe.*` keys (headline, sub, CTA, hint, stat labels, card labels) in lockstep.
- `src/globals.css` — globe-related keyframes/utilities appended after existing keyframes.
- `index.html` — CSP: **no change needed** (texture self-hosted → `img-src 'self'`; `/api/globe` same-origin → `connect-src 'self'`). Confirm current CSP at implementation.
- `nginx.conf` — add the `/api/globe` proxy+cache location (see §12); add the cache zone via a `conf.d` file.
- `package.json` — add `react-globe.gl`, `three@^0.179`, `-D @types/three`.

### Backend (`trip-track-backend`, NestJS)

New `src/modules/public/`:
- `public.module.ts` (registered in `app.module.ts`; does **not** extend social)
- `public.controller.ts` — `@Controller('public')`, **plain** `@Get('map')` (NOT the `GetApiEntry`/JSON-RPC decorator — we want plain REST JSON for the web), `@UseGuards(ThrottlerGuard)`, no auth guard.
- `public.service.ts` — the query, polyline decode, anonymization transform, in-process TTL cache.
- `dto/public-map.dto.ts` — response shape.

Query mirrors the public-feed filter (`social.service.ts` ≈ :190): `trip` INNER JOIN `account` WHERE `is_private = false AND is_deleted = false AND end_date IS NOT NULL AND account.is_public = true AND preview_polyline IS NOT NULL`, `ORDER BY end_date DESC`, `LIMIT 500`.

CORS: with the nginx-proxy approach the browser hits the website origin, so **no CORS change required**. (If we ever expose the endpoint directly, add `trip-track.app` to `CORS_ORIGINS`.)

## 6. Data flow

1. Visitor loads trip-track.app → `Home` renders `GlobeHero`; **headline/CTA paint immediately** (not blocked on the globe).
2. After first paint, `TripGlobe` lazy-chunk loads; `useGlobeData` fetches same-origin `/api/globe`.
3. nginx serves a cached copy or proxies to backend `/public/map` (also TTL-cached there).
4. JS renders Earth + glowing route paths + endpoint dots; auto-rotate starts; stat chip fills.
5. Drag/zoom (rotation pauses) / click a route → `TripCard` with anonymous avatar + stats + App Store CTA.
6. Empty/error → globe with no routes + headline (seed makes empty rare); fetch errors are swallowed gracefully.

## 7. Data contract

`GET /api/globe` (→ backend `GET /public/map`) returns plain JSON:

```jsonc
{
  "stats": { "trips": 1240, "cities": 38 },
  "trips": [
    { "id": "uuid", "region": "Краснодарский край", "coords": [[45.1,38.9],[45.0,39.1], …] }
  ]
}
```

- `coords` is the **anonymized** `[lat,lng]` route (see §9). No timestamps, no distance/duration, no user id, no name, no photos.
- `id` is used only for the deterministic anonymous avatar; it is not a stable cross-reference exposed elsewhere.
- Frontend may emit `[lng,lat]` to globe libs if a layer expects it — keep wire format `[lat,lng]`.

## 8. Polyline format (verified — Trip.swift:60-89)

- Flat array of `(lat, lng)` pairs; each value **IEEE-754 Float32, little-endian**; **8 bytes/point**; lat first; **no header/count**. `pointCount = byteLength / 8`. Valid iff `byteLength ≥ 8 && byteLength % 8 === 0`.
- Stored as Postgres `bytea` (`trip.entity.ts` `preview_polyline`), currently served as base64 in `social.service.ts` (:352, :666, :836).
- **Mock generator is byte-identical** (`generate-mock-polylines.js` `writeFloatLE`), so one decoder serves mock + real.

Server-side decoder (Node), runs before anonymization:
```ts
function decodePreviewPolyline(buf: Buffer | null): [number, number][] | null {
  if (!buf || buf.length < 8 || buf.length % 8 !== 0) return null;
  const out: [number, number][] = [];
  for (let off = 0; off < buf.length; off += 8) out.push([buf.readFloatLE(off), buf.readFloatLE(off + 4)]);
  return out;
}
```
The backend returns **decoded `[lat,lng][]` JSON** to the web (never raw binary).

## 9. Privacy & anonymization (server-side, deterministic)

Real route endpoints are often a user's home/work. Research (KU Leuven Strava study) recovered ~85% of "hidden" homes from clipped routes + leaked metadata; De Montjoye: 4 spatio-temporal points identify 95% of people (timestamps are the quasi-identifier). Therefore the transform is **deterministic** (no random jitter — it averages out across re-renders) and runs **only in `public.service.ts`** so it cannot regress.

Algorithm (input `[[lat,lng]…]` → output anonymized array or `null` to suppress):
1. If total haversine length `< 3 km` → **suppress** (drop trip).
2. **Haversine-clip 500 m** off the **front** and **back** (walk inward by great-circle distance, not by point count — GPS sampling is non-uniform).
3. If remaining length `< 1 km` → suppress.
4. **Round** every point to **3 decimal places** (~110 m lat / ~55–62 m lng at 55–60°N — coarse enough to not pin a building, fine enough that route shape stays crisp at globe zoom).
5. Collapse consecutive duplicate rounded points.
6. If `< 2` points remain → suppress.
7. Emit **shape only** — never attach time, date, distance, duration, user id, name.

Defense-in-depth (recommended, can be a follow-up): suppress isolated rural single-route areas; pre-bake the anonymized projection. This is anonymization for a public marketing artifact, not formal differential privacy — documented as such.

## 10. Performance (react-globe.gl — verified)

- **Routes via Paths layer with `pathStroke={null}`** (cheap 1px GL lines — scales to 300–500 routes). Numeric `pathStroke` upgrades each path to a costly `THREE.Line2` fat-line (the main jank source) **and** disables dash animation. Glow comes from a bright additive `pathColor` gradient (+ optional `UnrealBloomPass`), not line width. Reserve a fat stroke only for the 1 currently-selected route.
- "Comet" flow: `pathDashLength≈0.4`, `pathDashGap≈0.6`, `pathDashAnimateTime≈4000` (0 when reduced-motion).
- Endpoint dots: **Points layer with `pointsMerge`** (one geometry) for static dots; use non-merged + `onPointClick` only where per-dot click is needed.
- Cap DPR: `renderer().setPixelRatio(Math.min(devicePixelRatio, 1.5))`; `rendererConfig={ antialias: devicePixelRatio < 2, powerPreference:'high-performance', alpha:true }`.
- **Lazy-load** the whole globe behind `React.lazy(() => import('./TripGlobe'))` so `three` (~150KB gz) never blocks LCP; LCP served by static poster. `manualChunks` for `three`/globe libs + `resolve.dedupe:['three']`.
- Init OrbitControls in **`onGlobeReady`** (StrictMode-safe), not a bare `useEffect`: `autoRotate=true`, `autoRotateSpeed=0.35`, `enableZoom=false` (no mobile scroll-hijack), `enablePan=false`; pause autoRotate on `'start'`, resume after ~2.5s idle on `'end'`.
- **IntersectionObserver** → `pauseAnimation()` offscreen / `resumeAnimation()` on-screen (biggest battery win). Handle `webglcontextlost/restored`.

(Verified `TripGlobe.tsx` reference component captured in the research output; use it as the implementation starting point.)

## 11. Earth texture

- Source: **Solar System Scope "8k earth nightmap"** (CC BY 4.0, NASA-derived) → downscale to **4096×2048**, encode **AVIF (~400–700 KB) + WebP fallback**; keep a **2048×1024** AVIF as LCP/mobile poster. Self-host in `public/textures/`. (Public-domain alternative with zero attribution: NASA Black Marble.)
- three.js: color/night map `tex.colorSpace = THREE.SRGBColorSpace` (else washed-out); `tex.anisotropy = getMaxAnisotropy()` (~16); mipmaps on. Bump/specular maps (optional) use `NoColorSpace`.
- Lazy-load: poster (2K or CSS gradient) first, swap to 4K via `requestIdleCallback`/IntersectionObserver. Do **not** `<link rel=preload>` the 4K map.
- Atmosphere tinted to brand: `atmosphereColor` ≈ `#ff7a18`, `atmosphereAltitude ≈ 0.18`.
- Credit line in footer if SSS: "Earth night texture: Solar System Scope, CC BY 4.0".

## 12. nginx proxy-cache (verified)

`proxy_cache_path` is `http{}`-context; the stock nginx Docker image `include`s `conf.d/*.conf` inside `http{}`, so put the zone in a new `conf.d/00-globe-cache.conf` (sorts before `default.conf`) and the location in the existing server block.

Cache zone file:
```nginx
proxy_cache_path /var/cache/nginx/globe levels=1:2 keys_zone=globe_cache:1m
                 max_size=64m inactive=60m use_temp_path=off;   # inactive MUST be > TTL
limit_req_zone $binary_remote_addr zone=globe_rl:1m rate=30r/s;
```
Location (in server block):
```nginx
location = /api/globe {
    limit_except GET { deny all; }
    limit_req zone=globe_rl burst=60 nodelay;
    proxy_set_header Cookie "";
    proxy_pass https://api.trip-track.app/public/map;
    proxy_set_header Host api.trip-track.app;
    proxy_ssl_server_name on;            # REQUIRED (default off) — SNI for Cloudflare/multi-cert
    proxy_ssl_name api.trip-track.app;
    proxy_http_version 1.1;
    proxy_cache globe_cache;
    proxy_cache_key $scheme$proxy_host$uri$http_accept_encoding;  # no $args → ?cachebust collapses
    proxy_cache_valid 200 5m;
    proxy_cache_valid 404 10s;
    proxy_ignore_headers Set-Cookie Cache-Control Expires X-Accel-Expires;
    proxy_hide_header Set-Cookie;
    proxy_cache_lock on; proxy_cache_lock_timeout 5s;
    proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
    proxy_cache_background_update on; proxy_cache_revalidate on;
    proxy_connect_timeout 3s; proxy_read_timeout 5s;
    gzip on; gzip_types application/json; gzip_proxied any;
    add_header X-Cache-Status $upstream_cache_status always;
    add_header Cache-Control "public, max-age=60";
}
```
Docker: mount the new conf file + a writable cache dir. Verify: `curl -sI https://trip-track.app/api/globe` → MISS then HIT; STALE while backend stopped.

## 13. Accessibility & fallbacks

- `prefers-reduced-motion: reduce` → no auto-rotate; render static globe `<img>` (no canvas).
- No-WebGL (`WebGL.isWebGLAvailable()`) → static poster `<img alt="Trip routes plotted on a globe">`.
- Decorative canvas `aria-hidden`; click-to-card actions also reachable via a non-globe list (a small "recent routes" list under the hero) for keyboard/SR users.
- Mobile: `enableZoom=false` to avoid scroll-trap; cap DPR; pause offscreen.

## 14. Error handling

- `useGlobeData`: `AbortController` on unmount; timeout; on error → render globe with empty routes + headline (never a broken hero). Log to console only (no user-facing error on a marketing page).
- nginx `proxy_cache_use_stale` serves last-good JSON if the backend is down → hero still populated.
- Backend: guard malformed `bytea` (`% 8 !== 0` → skip trip); cache prevents Postgres hammering.
- WebGL context loss → show poster, `resumeAnimation()` on restore.

## 15. Testing strategy

Frontend (vitest + RTL):
- `lib/anonAvatar` determinism (same id → same avatar).
- `useGlobeData` state machine (loading/success/empty/error) with mocked fetch + abort.
- `GlobeHero` renders headline/CTA and the **static fallback** when WebGL/`matchMedia` mocked off (no canvas required in jsdom).
- (TripGlobe WebGL itself is validated manually / via a smoke check, not unit-tested in jsdom.)

Backend (jest):
- `decodePreviewPolyline` round-trips known bytes (build a Buffer with `writeFloatLE`, assert pairs).
- **Anonymization**: total length `<3km` → null; endpoints clipped ≥500m (no output point within 500m of original start/end); rounding to 3dp; `<1km` remaining → null; no time/distance fields present.
- Query returns only public, non-deleted, ended, public-account trips (seeded fixtures).
- Endpoint shape `{stats,trips}`; cache returns identical object within TTL.

Manual / verify: desktop + mobile visual pass, reduced-motion, backend-down (STALE), Lighthouse LCP not regressed by globe.

## 16. Scope

**v1 (this spec):** backend `GET /public/map` + decode + anonymization + TTL cache + seed; website nginx proxy/cache; `GlobeHero` full-bleed with real routes, auto-rotate + drag + (camera) zoom; click → anonymous card; stat chip; lazy-load + manualChunks; texture assets; mobile + reduced-motion + no-WebGL fallbacks; i18n RU/EN; tests above.

**Out of scope (later):** per-trip photos on the globe; filter by region/time; "trip of the day"; websocket live updates; isolated-rural-route suppression (privacy hardening follow-up); k-anonymity/heatmap mode; non-mock real-trip volume growth (accrues naturally).

## 17. Risks & open items

- **Privacy is the highest risk** — the anonymization transform must land server-side and be unit-tested before any real (non-mock) public trips render. Until then, the seed is mock-only (safe).
- Verify exact `Home.tsx` line ranges before deleting (the tile-map section + freed imports/hooks) — ranges above are from research and must be re-confirmed.
- Confirm the website Dockerfile/compose path for mounting the new nginx `conf.d` file and a writable cache dir.
- Bundle budget: confirm the globe vendor chunk is **not** in the initial HTML (Vite #17653 lazy-load regression).
- Decide deterministic-avatar visual (gradient vs identicon) — design detail, not blocking.

## 18. Seed / run instructions (backend)

```bash
cd ~/OneZeeProjects/trip-track-backend
docker compose exec -T db psql -U postgres -d trip_track < scripts/seed-mocks.sql
docker compose exec -T db psql -U postgres -d trip_track < scripts/seed-private-user.sql
node scripts/generate-mock-polylines.js | docker compose exec -T db psql -U postgres -d trip_track
# seed SQL creates trip rows; the JS pass populates preview_polyline via title-matched UPDATEs — run last.
```
