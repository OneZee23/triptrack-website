# Globe Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the trip-track.app landing hero with an interactive, auto-spinning 3D globe (react-globe.gl) that plots anonymized real public trips as glowing routes, served by a new cached backend endpoint.

**Architecture:** New NestJS `GET /public/map` returns anonymized `[lat,lng]` route arrays (decode `bytea` → clip endpoints → round → de-time). The website's nginx reverse-proxies + 5-min micro-caches it at same-origin `/api/globe`. A lazy-loaded React `GlobeHero` renders the globe (`three`/react-globe.gl) with click-to-anonymous-card, plus reduced-motion/no-WebGL CSS fallback.

**Tech Stack:** Backend — NestJS, TypeORM (`@InjectEntityManager`), Jest, path aliases `@modules/*`. Frontend — React 19, Vite 8, Tailwind v4, `motion`, react-globe.gl + three, Vitest + jsdom (new).

**Repos:** Backend = `/Users/onezee/OneZeeProjects/trip-track-backend` (yarn, `yarn test`). Website = `/Users/onezee/OneZeeProjects/trip-track-website` (npm, `npm run build`).

**Conventions note:** Backend uses path aliases (`@modules/*`, `@common/*`, `@infra/*`), `@InjectEntityManager()`, no `TypeOrmModule.forFeature` (DatabaseModule is `@Global`, entities auto-globbed). Website has NO test runner yet (this plan adds Vitest); `verbatimModuleSyntax: true` → use `import type` for type-only imports; no path aliases (relative imports). Line numbers below are from a 2026-06-09 read — confirm anchors before editing.

**Commits:** The repo owner uses no-autocommit. Each task ends with a commit step per skill convention, but the executor must get the owner's go-ahead before committing (or batch commits for owner review).

---

## PHASE 1 — Backend: `GET /public/map`

### Task 1: Polyline decoder (`bytea` → `[lat,lng][]`)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/polyline.util.ts`
- Test: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/polyline.util.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/public/polyline.util.spec.ts
import { decodePreviewPolyline } from './polyline.util';

function encode(coords: [number, number][]): Buffer {
  const buf = Buffer.alloc(coords.length * 8);
  coords.forEach(([lat, lng], i) => {
    buf.writeFloatLE(lat, i * 8);
    buf.writeFloatLE(lng, i * 8 + 4);
  });
  return buf;
}

describe('decodePreviewPolyline', () => {
  it('round-trips lat,lng pairs (little-endian Float32)', () => {
    const decoded = decodePreviewPolyline(encode([[55.75, 37.62], [43.6, 39.73]]));
    expect(decoded).not.toBeNull();
    expect(decoded!.length).toBe(2);
    expect(decoded![0][0]).toBeCloseTo(55.75, 3);
    expect(decoded![0][1]).toBeCloseTo(37.62, 3);
    expect(decoded![1][0]).toBeCloseTo(43.6, 3);
  });

  it('returns null for null/empty/misaligned buffers', () => {
    expect(decodePreviewPolyline(null)).toBeNull();
    expect(decodePreviewPolyline(Buffer.alloc(0))).toBeNull();
    expect(decodePreviewPolyline(Buffer.alloc(7))).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test polyline.util`
Expected: FAIL — `Cannot find module './polyline.util'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/modules/public/polyline.util.ts
/**
 * Decode the binary `preview_polyline` (Postgres bytea) into [lat, lng] pairs.
 * Wire format (matches iOS Trip.encodePolyline, Trip.swift:60-89, and the mock
 * generator scripts/generate-mock-polylines.js): flat (lat, lng) pairs, each a
 * 32-bit IEEE-754 float, LITTLE-ENDIAN, 8 bytes/point, latitude first. No header.
 */
export function decodePreviewPolyline(
  buf: Buffer | null | undefined,
): [number, number][] | null {
  if (!buf || buf.length < 8 || buf.length % 8 !== 0) return null;
  const out: [number, number][] = [];
  for (let off = 0; off < buf.length; off += 8) {
    out.push([buf.readFloatLE(off), buf.readFloatLE(off + 4)]);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test polyline.util`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
git add src/modules/public/polyline.util.ts src/modules/public/polyline.util.spec.ts
git commit -m "feat: public polyline decoder"
```

---

### Task 2: Anonymization transform

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/anonymize.util.ts`
- Test: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/anonymize.util.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/public/anonymize.util.spec.ts
import { anonymizeRoute, haversineMeters, CLIP_METERS } from './anonymize.util';

// straight northbound route, ~100 m spacing
function line(startLat: number, lng: number, meters: number): [number, number][] {
  const stepLat = 100 / 111_320;
  const n = Math.floor(meters / 100);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push([startLat + i * stepLat, lng]);
  return pts;
}

describe('anonymizeRoute', () => {
  it('suppresses trips shorter than 3 km', () => {
    expect(anonymizeRoute(line(55, 37, 2000))).toBeNull();
  });

  it('clips ~500 m from each end', () => {
    const raw = line(55, 37, 10_000);
    const out = anonymizeRoute(raw)!;
    expect(out).not.toBeNull();
    const start = raw[0];
    const end = raw[raw.length - 1];
    for (const p of out) {
      expect(haversineMeters(p, start)).toBeGreaterThanOrEqual(CLIP_METERS - 120);
      expect(haversineMeters(p, end)).toBeGreaterThanOrEqual(CLIP_METERS - 120);
    }
  });

  it('rounds to 3 decimal places', () => {
    const out = anonymizeRoute(line(55.123456, 37.654321, 8000))!;
    for (const [lat, lng] of out) {
      expect(lat).toBeCloseTo(Math.round(lat * 1000) / 1000, 9);
      expect(lng).toBeCloseTo(Math.round(lng * 1000) / 1000, 9);
    }
  });

  it('returns null for null / too-few points', () => {
    expect(anonymizeRoute(null)).toBeNull();
    expect(anonymizeRoute([[55, 37]])).toBeNull();
  });

  it('is deterministic', () => {
    const raw = line(55, 37, 9000);
    expect(anonymizeRoute(raw)).toEqual(anonymizeRoute(raw));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test anonymize.util`
Expected: FAIL — `Cannot find module './anonymize.util'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/modules/public/anonymize.util.ts
/**
 * Deterministic server-side anonymization of a raw GPS route for the public
 * marketing globe (design spec §9). Drops short trips, haversine-clips the
 * home/work endpoints, rounds to a coarse grid. NO time/distance ever passes
 * through. Deterministic — no random jitter (random averages out over re-renders).
 */
export const CLIP_METERS = 500;
export const MIN_RAW_LENGTH_M = 3000;
export const MIN_KEPT_LENGTH_M = 1000;
export const ROUND_DECIMALS = 3;
const EARTH_R_M = 6_371_000;

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function totalLength(pts: [number, number][]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += haversineMeters(pts[i - 1], pts[i]);
  return s;
}

// index of first point to KEEP after shedding `meters` from the front
function clipFrontIndex(pts: [number, number][], meters: number): number {
  let acc = 0;
  let i = 0;
  while (i < pts.length - 1 && acc < meters) {
    acc += haversineMeters(pts[i], pts[i + 1]);
    i += 1;
  }
  return i;
}

function round(n: number): number {
  const f = 10 ** ROUND_DECIMALS;
  return Math.round(n * f) / f;
}

export function anonymizeRoute(route: [number, number][] | null): [number, number][] | null {
  if (!route || route.length < 2) return null;
  if (totalLength(route) < MIN_RAW_LENGTH_M) return null;

  const f = clipFrontIndex(route, CLIP_METERS);
  let clipped = route.slice(f);
  const rev = clipped.slice().reverse();
  const b = clipFrontIndex(rev, CLIP_METERS);
  clipped = rev.slice(b).reverse();

  if (clipped.length < 2) return null;
  if (totalLength(clipped) < MIN_KEPT_LENGTH_M) return null;

  const out: [number, number][] = [];
  for (const p of clipped) {
    const rp: [number, number] = [round(p[0]), round(p[1])];
    const last = out[out.length - 1];
    if (!last || last[0] !== rp[0] || last[1] !== rp[1]) out.push(rp);
  }
  return out.length < 2 ? null : out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test anonymize.util`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
git add src/modules/public/anonymize.util.ts src/modules/public/anonymize.util.spec.ts
git commit -m "feat: route anonymization transform"
```

---

### Task 3: Response DTO types

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/dto/public-map.dto.ts`

- [ ] **Step 1: Create the file**

```ts
// src/modules/public/dto/public-map.dto.ts
export interface PublicMapTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
}

export interface PublicMapResponse {
  stats: { trips: number; cities: number };
  trips: PublicMapTrip[];
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
git add src/modules/public/dto/public-map.dto.ts
git commit -m "feat: public map dto"
```

---

### Task 4: PublicService (query + decode + anonymize + cache)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/public.service.ts`
- Test: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/public.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/public/public.service.spec.ts
import { Test } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { PublicService } from './public.service';

function encode(coords: [number, number][]): Buffer {
  const buf = Buffer.alloc(coords.length * 8);
  coords.forEach(([lat, lng], i) => {
    buf.writeFloatLE(lat, i * 8);
    buf.writeFloatLE(lng, i * 8 + 4);
  });
  return buf;
}
function line(startLat: number, lng: number, meters: number): [number, number][] {
  const step = 100 / 111_320;
  const n = Math.floor(meters / 100);
  const p: [number, number][] = [];
  for (let i = 0; i <= n; i++) p.push([startLat + i * step, lng]);
  return p;
}
function qbStub(rows: any[]) {
  const qb: any = {};
  for (const m of ['innerJoin', 'select', 'where', 'andWhere', 'orderBy', 'take']) qb[m] = () => qb;
  qb.getMany = async () => rows;
  return qb;
}

describe('PublicService', () => {
  async function build(em: any) {
    const mod = await Test.createTestingModule({
      providers: [PublicService, { provide: getEntityManagerToken(), useValue: em }],
    }).compile();
    return mod.get(PublicService);
  }

  it('returns anonymized trips + stats, skipping short/undecodable rows', async () => {
    const em = {
      getRepository: () => ({
        createQueryBuilder: () =>
          qbStub([
            { id: 'a', region: 'Moscow Oblast', previewPolyline: encode(line(55, 37, 10_000)) },
            { id: 'b', region: 'Moscow Oblast', previewPolyline: encode(line(56, 38, 1000)) },
            { id: 'c', region: null, previewPolyline: null },
          ]),
      }),
    };
    const svc = await build(em);
    const res = await svc.getMap();
    expect(res.trips.length).toBe(1);
    expect(res.trips[0].id).toBe('a');
    expect(res.trips[0].coords.length).toBeGreaterThan(1);
    expect(res.stats.trips).toBe(1);
    expect(res.stats.cities).toBe(1);
    expect(Object.keys(res.trips[0]).sort()).toEqual(['coords', 'id', 'region']);
  });

  it('caches within TTL (second call does not re-query)', async () => {
    let calls = 0;
    const em = {
      getRepository: () => ({
        createQueryBuilder: () => {
          calls++;
          return qbStub([]);
        },
      }),
    };
    const svc = await build(em);
    await svc.getMap();
    await svc.getMap();
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test public.service`
Expected: FAIL — `Cannot find module './public.service'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/modules/public/public.service.ts
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { TripEntity } from '@modules/trips/entities/trip.entity';
import { decodePreviewPolyline } from './polyline.util';
import { anonymizeRoute } from './anonymize.util';
import { PublicMapResponse, PublicMapTrip } from './dto/public-map.dto';

const MAX_TRIPS = 500;
const CACHE_TTL_MS = 60_000;

@Injectable()
export class PublicService {
  private cache: { data: PublicMapResponse; expires: number } | null = null;

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getMap(): Promise<PublicMapResponse> {
    const now = Date.now();
    if (this.cache && this.cache.expires > now) return this.cache.data;

    const rows = await this.em
      .getRepository(TripEntity)
      .createQueryBuilder('t')
      .innerJoin('t.account', 'a')
      .select(['t.id', 't.region', 't.previewPolyline'])
      .where('t.is_private = false')
      .andWhere('t.is_deleted = false')
      .andWhere('t.end_date IS NOT NULL')
      .andWhere('a.is_public = true')
      .andWhere('t.preview_polyline IS NOT NULL')
      .orderBy('t.endDate', 'DESC')
      .take(MAX_TRIPS)
      .getMany();

    const trips: PublicMapTrip[] = [];
    const cities = new Set<string>();
    for (const t of rows) {
      const coords = anonymizeRoute(decodePreviewPolyline(t.previewPolyline));
      if (!coords) continue;
      trips.push({ id: t.id, region: t.region ?? null, coords });
      if (t.region) cities.add(t.region);
    }

    const data: PublicMapResponse = { stats: { trips: trips.length, cities: cities.size }, trips };
    this.cache = { data, expires: now + CACHE_TTL_MS };
    return data;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test public.service`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
git add src/modules/public/public.service.ts src/modules/public/public.service.spec.ts
git commit -m "feat: public map service"
```

---

### Task 5: PublicController + PublicModule + register

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/public.controller.ts`
- Create: `/Users/onezee/OneZeeProjects/trip-track-backend/src/modules/public/public.module.ts`
- Modify: `/Users/onezee/OneZeeProjects/trip-track-backend/src/app.module.ts`

- [ ] **Step 1: Create the controller** (plain `@Get`, NOT `GetApiEntry` — we want a bare JSON body for the web/CDN, not the iOS `{status,payload}` envelope)

```ts
// src/modules/public/public.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { PublicMapResponse } from './dto/public-map.dto';

@Controller('public')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('map')
  async map(): Promise<PublicMapResponse> {
    return this.publicService.getMap();
  }
}
```

- [ ] **Step 2: Create the module**

```ts
// src/modules/public/public.module.ts
import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
```

- [ ] **Step 3: Register in app.module.ts**

In `/Users/onezee/OneZeeProjects/trip-track-backend/src/app.module.ts`, add the import after the `RecapModule` import (line 17):

```ts
import { PublicModule } from '@modules/public/public.module';
```

And add `PublicModule,` to the `imports` array, after `RecapModule,` (line 36):

```ts
    RecapModule,
    PublicModule,
```

- [ ] **Step 4: Verify it builds and boots**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn build`
Expected: build succeeds (no TS errors).

- [ ] **Step 5: Verify the route locally** (requires local DB; if unavailable, skip to Task 6 and verify after seeding)

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn start:dev` then in another shell `curl -s localhost:3003/public/map | head -c 300`
Expected: a JSON object `{"stats":{"trips":...},"trips":[...]}` (bare body, NOT `{"status":"ok",...}`).

- [ ] **Step 6: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
git add src/modules/public/public.controller.ts src/modules/public/public.module.ts src/app.module.ts
git commit -m "feat: public map endpoint"
```

---

### Task 6: Seed mock public trips (ops, no code)

**Goal:** populate the globe with 16 mock RU trips so it's never empty. (Run order matters — SQL creates trip rows; the JS pass fills `preview_polyline` via title-matched UPDATEs.)

- [ ] **Step 1: Run the seeds (against the target DB)**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-backend
docker compose exec -T db psql -U postgres -d trip_track < scripts/seed-mocks.sql
docker compose exec -T db psql -U postgres -d trip_track < scripts/seed-private-user.sql
node scripts/generate-mock-polylines.js | docker compose exec -T db psql -U postgres -d trip_track
```
(Adjust the psql service/db/user names to the actual environment if they differ.)

- [ ] **Step 2: Verify the endpoint now returns trips**

Run: `curl -s localhost:3003/public/map | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['stats']); print(len(d['trips']),'trips')"`
Expected: non-zero `stats.trips` and trips with `coords` arrays.

(No commit — this is data, not code.)

---

## PHASE 2 — Website: deps, test infra, assets

### Task 7: Add dependencies + Vitest test infra

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/package.json`
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/vitest.config.ts`
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/test/setup.ts`

- [ ] **Step 1: Install runtime + dev deps**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
npm i react-globe.gl three@^0.179
npm i -D @types/three vitest jsdom @testing-library/react @testing-library/dom
```

- [ ] **Step 2: Add the `test` script** to `package.json` (in the `"scripts"` block, after the `"preview"` line):

```json
    "preview": "vite preview",
    "test": "vitest run"
```
(Add a comma after the `preview` line.)

- [ ] **Step 3: Create the Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // jsdom opted-in per-file via `// @vitest-environment jsdom`
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create the test setup (jsdom shims)**

```ts
// src/test/setup.ts
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    // @ts-expect-error minimal shim
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }
  // @ts-expect-error minimal shim
  window.IntersectionObserver ||= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // @ts-expect-error minimal shim
  window.ResizeObserver ||= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
```

- [ ] **Step 5: Verify the runner works**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test`
Expected: Vitest runs and reports "No test files found" (exit 0) — runner is wired.

- [ ] **Step 6: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "chore: globe deps + vitest"
```

---

### Task 8: Earth texture assets

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/public/textures/earth-night-4k.jpg`
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/public/textures/earth-night-2k.jpg`

- [ ] **Step 1: Download the source night map** (Solar System Scope "8k earth nightmap", CC BY 4.0)

Download `8k_earth_nightmap.jpg` from https://www.solarsystemscope.com/textures/ (or the Wikimedia mirror `Solarsystemscope_texture_8k_earth_nightmap.jpg`) to a temp path, e.g. `~/Downloads/sss-8k-nightmap.jpg`.

- [ ] **Step 2: Resize to 4K + 2K JPG**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
mkdir -p public/textures
npx --yes sharp-cli@5 -i ~/Downloads/sss-8k-nightmap.jpg -o public/textures/earth-night-4k.jpg resize 4096 2048
npx --yes sharp-cli@5 -i ~/Downloads/sss-8k-nightmap.jpg -o public/textures/earth-night-2k.jpg resize 2048 1024
```
(If `sharp-cli` flags differ, any image tool works — target 4096×2048 and 2048×1024 JPGs, quality ~80, each well under ~1 MB.)

- [ ] **Step 3: Verify files exist and are reasonable size**

Run: `ls -la public/textures/`
Expected: `earth-night-4k.jpg` (~0.6–1 MB) and `earth-night-2k.jpg` (~150–300 KB).

- [ ] **Step 4: Add the attribution line** to the site footer/credits (search for the footer component, e.g. `src/components/AppLayout.tsx` footer, and add): `Earth night texture: Solar System Scope, CC BY 4.0`. (If no footer credits area exists, note it for follow-up — not build-blocking.)

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add public/textures/earth-night-4k.jpg public/textures/earth-night-2k.jpg
git commit -m "assets: earth night textures"
```

---

## PHASE 3 — Website: globe components

### Task 9: Shared globe types

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/components/globe/types.ts`

- [ ] **Step 1: Create the file**

```ts
// src/components/globe/types.ts
export interface GlobeTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
}

export interface GlobeData {
  stats: { trips: number; cities: number };
  trips: GlobeTrip[];
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/components/globe/types.ts
git commit -m "feat: globe types"
```

---

### Task 10: Anonymous avatar util (TDD)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/lib/anonAvatar.ts`
- Test: `/Users/onezee/OneZeeProjects/trip-track-website/src/lib/anonAvatar.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/anonAvatar.spec.ts
import { describe, it, expect } from 'vitest';
import { avatarStyle } from './anonAvatar';

describe('avatarStyle', () => {
  it('is deterministic for the same id', () => {
    expect(avatarStyle('trip-1')).toEqual(avatarStyle('trip-1'));
  });
  it('differs for different ids', () => {
    expect(avatarStyle('trip-1')).not.toEqual(avatarStyle('trip-2'));
  });
  it('returns hsl strings', () => {
    const s = avatarStyle('x');
    expect(s.from).toMatch(/^hsl\(/);
    expect(s.to).toMatch(/^hsl\(/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- anonAvatar`
Expected: FAIL — cannot resolve `./anonAvatar`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/anonAvatar.ts
// Deterministic, anonymous avatar styling from a trip id. Same id → same colors;
// reveals nothing about the user.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface AvatarStyle {
  from: string;
  to: string;
}

export function avatarStyle(id: string): AvatarStyle {
  const hue = hashString(id) % 360;
  return {
    from: `hsl(${hue} 70% 55%)`,
    to: `hsl(${(hue + 40) % 360} 70% 45%)`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- anonAvatar`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/lib/anonAvatar.ts src/lib/anonAvatar.spec.ts
git commit -m "feat: anonymous avatar util"
```

---

### Task 11: useGlobeData hook (TDD)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/hooks/useGlobeData.ts`
- Test: `/Users/onezee/OneZeeProjects/trip-track-website/src/hooks/useGlobeData.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// @vitest-environment jsdom
// src/hooks/useGlobeData.spec.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGlobeData } from './useGlobeData';

const sample = {
  stats: { trips: 1, cities: 1 },
  trips: [{ id: 'a', region: 'X', coords: [[1, 2], [3, 4]] }],
};

afterEach(() => vi.restoreAllMocks());

describe('useGlobeData', () => {
  it('returns success with data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(sample) }));
    const { result } = renderHook(() => useGlobeData());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('returns empty when no trips', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }) }));
    const { result } = renderHook(() => useGlobeData());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { result } = renderHook(() => useGlobeData());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- useGlobeData`
Expected: FAIL — cannot resolve `./useGlobeData`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/hooks/useGlobeData.ts
import { useEffect, useState } from 'react';
import type { GlobeData } from '../components/globe/types';

export type GlobeDataState =
  | { status: 'loading' }
  | { status: 'success'; data: GlobeData }
  | { status: 'empty' }
  | { status: 'error' };

const ENDPOINT = '/api/globe';

function isValid(d: unknown): d is GlobeData {
  return !!d && typeof d === 'object' && 'stats' in d && Array.isArray((d as GlobeData).trips);
}

export function useGlobeData(): GlobeDataState {
  const [state, setState] = useState<GlobeDataState>({ status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(ENDPOINT, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: unknown) => {
        if (!isValid(d)) return setState({ status: 'error' });
        setState(d.trips.length ? { status: 'success', data: d } : { status: 'empty' });
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- useGlobeData`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/hooks/useGlobeData.ts src/hooks/useGlobeData.spec.ts
git commit -m "feat: useGlobeData hook"
```

---

### Task 12: TripGlobe (WebGL component)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/components/globe/TripGlobe.tsx`

(Not unit-tested — WebGL needs a real GPU; verified by build + manual check in Task 19. Reference component from research, adapted to our data contract.)

- [ ] **Step 1: Create the component**

```tsx
// src/components/globe/TripGlobe.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import type { GlobeTrip } from './types';

const TEX_2K = '/textures/earth-night-2k.jpg';
const TEX_4K = '/textures/earth-night-4k.jpg';

function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}
function reduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface EndPoint {
  lat: number;
  lng: number;
  trip: GlobeTrip;
}

export default function TripGlobe({
  trips,
  onSelect,
}: {
  trips: GlobeTrip[];
  onSelect: (t: GlobeTrip) => void;
}) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tex, setTex] = useState(TEX_2K);
  const [supported] = useState(() => typeof window !== 'undefined' && webglOK());

  const points = useMemo<EndPoint[]>(
    () =>
      trips.flatMap((t) => {
        if (t.coords.length < 2) return [];
        const a = t.coords[0];
        const b = t.coords[t.coords.length - 1];
        return [
          { lat: a[0], lng: a[1], trip: t },
          { lat: b[0], lng: b[1], trip: t },
        ];
      }),
    [trips],
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // upgrade 2K → 4K after first paint
  useEffect(() => {
    const id = window.setTimeout(() => setTex(TEX_4K), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const onReady = useCallback(() => {
    const g = globeEl.current;
    if (!g) return;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const mat = g.globeMaterial() as THREE.MeshPhongMaterial;
    if (mat.map) {
      mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.map.anisotropy = 8;
      mat.needsUpdate = true;
    }
    const c = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
      addEventListener: (e: string, cb: () => void) => void;
    };
    c.enableZoom = false;
    c.enablePan = false;
    c.autoRotate = !reduceMotion();
    c.autoRotateSpeed = 0.35;
    g.pointOfView({ lat: 30, lng: 50, altitude: 2.3 });
    const pause = () => {
      c.autoRotate = false;
      window.clearTimeout(idleTimer.current);
    };
    const resume = () => {
      if (reduceMotion()) return;
      idleTimer.current = window.setTimeout(() => {
        c.autoRotate = true;
      }, 2500);
    };
    c.addEventListener('start', pause);
    c.addEventListener('end', resume);
  }, []);

  // pause RAF loop when offscreen
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const g = globeEl.current;
        if (!g) return;
        if (e.isIntersecting) g.resumeAnimation();
        else g.pauseAnimation();
      },
      { threshold: 0.05 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      window.clearTimeout(idleTimer.current);
    };
  }, []);

  if (!supported) {
    return (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 45%, #16263a 0%, #0a1018 55%, #06060a 100%)',
        }}
      />
    );
  }

  return (
    <div ref={wrapRef} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <Globe
        ref={globeEl}
        width={size.w || undefined}
        height={size.h || undefined}
        onGlobeReady={onReady}
        rendererConfig={{ antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance', alpha: true }}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={tex}
        atmosphereColor="#ff7a18"
        atmosphereAltitude={0.18}
        pathsData={trips}
        pathPoints={(t: any) => t.coords}
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathPointAlt={0.005}
        pathColor={() => ['rgba(255,176,0,0)', 'rgba(255,122,24,0.9)', 'rgba(255,176,0,0)']}
        pathStroke={null as unknown as number}
        pathResolution={2}
        pathDashLength={0.4}
        pathDashGap={0.6}
        pathDashAnimateTime={reduceMotion() ? 0 : 4000}
        pathTransitionDuration={1000}
        onPathClick={(t: any) => onSelect(t as GlobeTrip)}
        pointsData={points}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointAltitude={0.01}
        pointRadius={0.16}
        pointColor={() => '#ffb000'}
        onPointClick={(d: any) => onSelect((d as EndPoint).trip)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check** (accessor props use `any`; if react-globe.gl's exact accessor types reject any cast, the executor adjusts the cast — the logic is correct)

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npx tsc -b`
Expected: no errors. (If `pathStroke`/accessor typing errors appear, adjust casts minimally; do not change behavior.)

- [ ] **Step 3: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/components/globe/TripGlobe.tsx
git commit -m "feat: TripGlobe webgl component"
```

---

### Task 13: TripCard (anonymous, numbers-free)

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/components/globe/TripCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/globe/TripCard.tsx
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { GlobeTrip } from './types';
import { avatarStyle } from '../../lib/anonAvatar';
import { useTranslation } from '../../i18n/useTranslation';

const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

function routeThumb(coords: [number, number][]): string {
  if (coords.length < 2) return '';
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of coords) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  const w = 200, h = 90, pad = 12;
  const sx = maxLng - minLng || 1e-6;
  const sy = maxLat - minLat || 1e-6;
  return coords
    .map(([lat, lng]) => {
      const x = pad + ((lng - minLng) / sx) * (w - 2 * pad);
      const y = h - pad - ((lat - minLat) / sy) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TripCard({ trip, onClose }: { trip: GlobeTrip; onClose: () => void }) {
  const { t } = useTranslation();
  const av = avatarStyle(trip.id);
  const pts = routeThumb(trip.coords);
  const label = [t('home.globe.card_traveler'), trip.region].filter(Boolean).join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      className="rounded-2xl bg-[#16161d] border border-white/10 shadow-2xl overflow-hidden text-white"
    >
      <div className="relative h-[100px] bg-[#0d1622]">
        <svg viewBox="0 0 200 90" preserveAspectRatio="none" className="w-full h-full">
          <polyline points={pts} fill="none" stroke="#FF7A18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-full shrink-0"
            style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
          />
          <span className="text-sm text-white/80">{label}</span>
        </div>
        <a
          href={APP_STORE_URL}
          className="mt-4 block text-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] py-2.5 font-bold text-[#1a1209]"
        >
          {t('home.globe.card_cta')}
        </a>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/components/globe/TripCard.tsx
git commit -m "feat: anonymous trip card"
```

---

### Task 14: GlobeHero (compose) + fallback test

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/src/components/globe/GlobeHero.tsx`
- Test: `/Users/onezee/OneZeeProjects/trip-track-website/src/components/globe/GlobeHero.spec.tsx`

- [ ] **Step 1: Write the failing test** (empty data → CSS fallback path; globe lib never imported; assert hero chrome renders)

```tsx
// @vitest-environment jsdom
// src/components/globe/GlobeHero.spec.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../../i18n/LanguageContext';
import GlobeHero from './GlobeHero';

afterEach(() => vi.restoreAllMocks());

describe('GlobeHero', () => {
  it('renders headline + CTA and the fallback when there are no trips', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }) }));
    render(
      <LanguageProvider>
        <GlobeHero />
      </LanguageProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link')).toBeTruthy(); // App Store CTA
    await waitFor(() => expect((globalThis.fetch as any)).toHaveBeenCalled());
  });
});
```

(If `LanguageProvider` is not the actual export name from `src/i18n/LanguageContext.tsx`, use the correct provider export — confirm by reading that file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- GlobeHero`
Expected: FAIL — cannot resolve `./GlobeHero`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/globe/GlobeHero.tsx
import { Suspense, lazy, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGlobeData } from '../../hooks/useGlobeData';
import { TripCard } from './TripCard';
import type { GlobeTrip } from './types';

const TripGlobe = lazy(() => import('./TripGlobe'));
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const Fallback = () => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{ background: 'radial-gradient(circle at 50% 45%, #16263a 0%, #0a1018 55%, #06060a 100%)' }}
  />
);

export default function GlobeHero() {
  const { t } = useTranslation();
  const state = useGlobeData();
  const [selected, setSelected] = useState<GlobeTrip | null>(null);

  const trips = state.status === 'success' ? state.data.trips : [];
  const stats = state.status === 'success' ? state.data.stats : null;
  const reduce = prefersReducedMotion();
  const showGlobe = !reduce && trips.length > 0;

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[#06060a] text-white">
      <div className="absolute inset-0">
        {showGlobe ? (
          <Suspense fallback={<Fallback />}>
            <TripGlobe trips={trips} onSelect={setSelected} />
          </Suspense>
        ) : (
          <Fallback />
        )}
      </div>

      {/* darkening scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06060a]/90 via-[#06060a]/40 to-transparent pointer-events-none" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-[640px]">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05]">{t('home.globe.title')}</h1>
          <p className="mt-5 text-lg text-white/70 max-w-md">{t('home.globe.subtitle')}</p>
          <a
            href={APP_STORE_URL}
            className="mt-8 inline-flex w-max items-center gap-2 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] px-6 py-3 font-bold text-[#1a1209]"
          >
            {t('home.globe.cta')}
          </a>
          {stats && (
            <div className="mt-6 flex gap-5 text-sm text-white/60">
              <span><b className="text-[#FFB000]">{stats.trips}</b> {t('home.globe.stat_trips')}</span>
              <span><b className="text-[#FFB000]">{stats.cities}</b> {t('home.globe.stat_cities')}</span>
            </div>
          )}
          {showGlobe && (
            <p className="mt-8 text-xs uppercase tracking-[0.15em] text-white/40">{t('home.globe.hint')}</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="absolute z-20 bottom-8 right-6 left-6 md:left-auto md:w-[340px]">
            <TripCard trip={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test -- GlobeHero`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/components/globe/GlobeHero.tsx src/components/globe/GlobeHero.spec.tsx
git commit -m "feat: GlobeHero section"
```

---

## PHASE 4 — Website: integration

### Task 15: i18n keys (EN + RU lockstep)

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/src/i18n/en.json`
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/src/i18n/ru.json`

- [ ] **Step 1: Add the `globe` block to en.json**

Replace the last `home` key line (line 47) `    "modal_try_free": "Get TripTrack Free"` with:

```json
    "modal_try_free": "Get TripTrack Free",
    "globe": {
      "title": "Every road, on the world map",
      "subtitle": "TripTrack turns your drives into a living globe. Spin it, zoom in, explore real journeys from the community.",
      "cta": "Download on the App Store",
      "hint": "Drag · zoom · tap a trip",
      "stat_trips": "trips",
      "stat_cities": "cities",
      "card_traveler": "Traveler",
      "card_cta": "Open in TripTrack"
    }
```

- [ ] **Step 2: Add the `globe` block to ru.json**

Replace the last `home` key line (line 47) `    "modal_try_free": "Попробовать бесплатно"` with:

```json
    "modal_try_free": "Попробовать бесплатно",
    "globe": {
      "title": "Каждая дорога — на карте мира",
      "subtitle": "TripTrack превращает поездки в живой глобус. Крути, приближай, исследуй реальные маршруты сообщества.",
      "cta": "Скачать в App Store",
      "hint": "Крути · приближай · нажми на поездку",
      "stat_trips": "поездок",
      "stat_cities": "городов",
      "card_traveler": "Путешественник",
      "card_cta": "Открыть в TripTrack"
    }
```

- [ ] **Step 3: Verify JSON validity**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && node -e "JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/ru.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/i18n/en.json src/i18n/ru.json
git commit -m "i18n: globe hero strings"
```

---

### Task 16: Vite chunk-splitting for three/globe

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/vite.config.ts`

- [ ] **Step 1: Replace the file contents**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ['three'] },
  optimizeDeps: { include: ['three', 'react-globe.gl'] },
  build: {
    rollupOptions: {
      output: {
        // function form avoids the React.lazy eager-load regression (Vite #17653)
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('react-globe.gl') || id.includes('globe.gl') || id.includes('three-globe')) return 'globe'
        },
      },
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add vite.config.ts
git commit -m "build: split three/globe vendor chunks"
```

---

### Task 17: Mount GlobeHero in Home.tsx (functional swap)

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/src/pages/Home.tsx`

This task does the minimal, build-correct swap (dead-code cleanup is Task 18). Read the file first to confirm anchors.

- [ ] **Step 1: Add the import**

Add to the import block (after line 7, the `usePageMeta` import):

```ts
import GlobeHero from '../components/globe/GlobeHero';
```

- [ ] **Step 2: Replace the hero + map sections with `<GlobeHero />`**

In the `return (...)`, delete the entire block from the `{/* HERO */}` comment (line 261) through the close of the desktop draggable map section `</section>` (line 405) — i.e. the old headline hero (262-280), mobile carousel (285-339), and desktop draggable map (342-405) — and replace all of it with:

```tsx
        {/* GLOBE HERO */}
        <GlobeHero />
```

(Keep the root wrapper `<div className="w-full flex flex-col items-center">` on line 259 and everything from `{/* PROBLEM STATEMENT */}` (line 407) downward.)

- [ ] **Step 3: Remove the now-unreachable Trip Detail Modal**

Delete the block from `{/* Trip Detail Modal */}` / `<AnimatePresence>` (line 491) through its closing `</AnimatePresence>` (line 565). It is driven by `selectedCard`, which nothing sets after the desktop map is gone. (Leaving it compiles but renders dead UI logic; remove it.)

- [ ] **Step 4: Type-check + build**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npx tsc -b`
Expected: no errors. (Unused module-level helpers/imports remain but do NOT error — `noUnusedLocals` is false; they are cleaned in Task 18.)

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/pages/Home.tsx
git commit -m "feat: globe hero replaces map presentation"
```

---

### Task 18: Home.tsx dead-code cleanup

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/src/pages/Home.tsx`

Remove code orphaned by Task 17. Re-read the file (line numbers shifted). Remove each item, building after each removal.

- [ ] **Step 1: Remove orphaned module-level definitions**

Delete (now unreferenced after Task 17): the map-tile constants (`ZOOM`/`START_TILE_*`/`TILES_*`/`CANVAS_*`), `geoToPixel()`, `TRIP_DATA`, `ROUTE_WAYPOINTS`, `SpeedRoute` (memo component), and the old desktop `TripCard` (memo component, the one taking `{trip,onClick,onHoverStart,onHoverEnd}` — NOT the new `globe/TripCard.tsx`).

- [ ] **Step 2: Remove orphaned hooks/state inside `Home`**

Delete: `selectedCard` state, `dragX/dragY/coordX/coordY` motion values, the `TRIPS` memo, the `routePath` memo, the drag-centering `useEffect`, the `tiles` memo, and the `setHoverState` from `useContext(CursorContext)` if no longer used.

- [ ] **Step 3: Prune unused imports**

From lines 1-7, remove now-unused imports (e.g. `useMotionValue`, `useTransform`, `memo`, `useContext`, `CursorContext`, and unused `lucide-react` icons `Map`, `Crosshair`, `Camera`, `Target`, `X`). Keep imports still used by the retained sections (e.g. `motion`, `Link`, `useTranslation`, `usePageMeta`, the screenshot PNG imports, and any icons used in PROBLEM/HOW/SOCIAL/CTA sections). Verify by building.

- [ ] **Step 4: Build to confirm nothing was over-removed**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npx tsc -b && npm run lint`
Expected: `tsc` passes; `lint` reports no unused-var errors for Home.tsx.

- [ ] **Step 5: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/pages/Home.tsx
git commit -m "refactor: drop dead map presentation code"
```

---

### Task 19: globals.css hint animation + local manual check

**Files:**
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/src/globals.css`

- [ ] **Step 1: Append a subtle hint pulse** after line 208 (end of file):

```css

/* Globe hero hint */
@keyframes globe-hint-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}
.globe-hint {
  animation: globe-hint-pulse 2.8s ease-in-out infinite;
}
```

(Optional: add `globe-hint` to the hint `<p>` className in GlobeHero.tsx for the pulse.)

- [ ] **Step 2: Run the dev server and manually verify the globe**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm run dev` — then open the printed localhost URL. The dev server proxies nothing, so `/api/globe` will 404 in dev → the hero shows the CSS fallback + headline (expected). To see the live globe in dev, temporarily point `useGlobeData`'s `ENDPOINT` at the backend (`http://localhost:3003/public/map`) OR add a Vite dev proxy (see note). Confirm: headline/CTA render, no console errors, and (with data) the globe spins, drags, dashes flow, and clicking a route opens the card.

> Dev proxy note (optional, do NOT commit): add to `vite.config.ts` `server: { proxy: { '/api/globe': { target: 'http://localhost:3003', rewrite: p => p.replace('/api/globe','/public/map'), changeOrigin: true } } }` to test end-to-end locally.

- [ ] **Step 3: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add src/globals.css
git commit -m "style: globe hint pulse"
```

---

## PHASE 5 — Website: nginx proxy + cache + deploy

### Task 20: nginx reverse-proxy + micro-cache for `/api/globe`

**Files:**
- Create: `/Users/onezee/OneZeeProjects/trip-track-website/nginx-cache.conf`
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/nginx.conf`
- Modify: `/Users/onezee/OneZeeProjects/trip-track-website/Dockerfile`

- [ ] **Step 1: Create the http-context cache zone file**

```nginx
# nginx-cache.conf — copied to /etc/nginx/conf.d/00-globe-cache.conf
# (included inside http{} by the base image; sorts before default.conf so the
#  keys_zone exists when the server block parses). proxy_cache_path is http-only.
proxy_cache_path /var/cache/nginx/globe levels=1:2 keys_zone=globe_cache:1m
                 max_size=64m inactive=60m use_temp_path=off;
limit_req_zone $binary_remote_addr zone=globe_rl:1m rate=30r/s;
```

- [ ] **Step 2: Add the `/api/globe` location** to `nginx.conf` (inside the `server { ... }` block, e.g. right after the `location /` SPA block, before the static-assets `location ~*`):

```nginx
    # Reverse-proxy + 5-min micro-cache for the public globe data
    location = /api/globe {
        limit_except GET { deny all; }
        limit_req zone=globe_rl burst=60 nodelay;
        proxy_set_header Cookie "";

        proxy_pass https://api.trip-track.app/public/map;
        proxy_set_header Host api.trip-track.app;
        proxy_ssl_server_name on;            # REQUIRED (default off) for SNI behind Cloudflare
        proxy_ssl_name api.trip-track.app;
        proxy_http_version 1.1;

        proxy_cache globe_cache;
        proxy_cache_key $scheme$proxy_host$uri$http_accept_encoding;
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 10s;
        proxy_ignore_headers Set-Cookie Cache-Control Expires X-Accel-Expires;
        proxy_hide_header Set-Cookie;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;
        proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_revalidate on;
        proxy_connect_timeout 3s;
        proxy_read_timeout 5s;

        add_header X-Cache-Status $upstream_cache_status always;
        add_header Cache-Control "public, max-age=60";
    }
```

- [ ] **Step 3: Add `avif` to the static-asset cache regex** in `nginx.conf` (line 13) for future-proofing texture formats — change:

```nginx
    location ~* \.(js|css|png|jpg|jpeg|webp|gif|ico|svg|woff2)$ {
```
to:
```nginx
    location ~* \.(js|css|png|jpg|jpeg|webp|avif|gif|ico|svg|woff2)$ {
```

- [ ] **Step 4: Wire the cache file + cache dir into the Dockerfile**

In `/Users/onezee/OneZeeProjects/trip-track-website/Dockerfile`, after the existing `COPY nginx.conf /etc/nginx/conf.d/default.conf` line, add:

```dockerfile
COPY nginx-cache.conf /etc/nginx/conf.d/00-globe-cache.conf
USER root
RUN mkdir -p /var/cache/nginx/globe && chown -R 101:101 /var/cache/nginx/globe
USER 101
```

- [ ] **Step 5: Verify the image builds and nginx config is valid**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
docker build -t triptrack-web-test .
docker run --rm triptrack-web-test nginx -t
```
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`.

- [ ] **Step 6: Confirm CORS on the backend is unnecessary** — because the browser calls same-origin `trip-track.app/api/globe` and nginx proxies server-to-server, no `CORS_ORIGINS` change is needed. (No action; documented for the reviewer.)

- [ ] **Step 7: Commit**

```bash
cd /Users/onezee/OneZeeProjects/trip-track-website
git add nginx.conf nginx-cache.conf Dockerfile
git commit -m "ops: proxy+cache /api/globe"
```

---

## PHASE 6 — End-to-end verification

### Task 21: Full build + test sweep + deploy verify

- [ ] **Step 1: Backend test + build**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-backend && yarn test && yarn build`
Expected: all specs pass; build clean.

- [ ] **Step 2: Website test + production build**

Run: `cd /Users/onezee/OneZeeProjects/trip-track-website && npm test && npm run build`
Expected: all specs pass; `dist/` built. Confirm the three/globe code is in separate `three-*.js` / `globe-*.js` chunks and NOT referenced by the initial `index.html` (check `dist/index.html` and `dist/assets/` — the globe chunk should load on demand, not in the entry).

- [ ] **Step 3: Verify the cache after deploy** (once the new image is deployed)

```bash
curl -sI https://trip-track.app/api/globe   # 1st → X-Cache-Status: MISS
curl -sI https://trip-track.app/api/globe   # 2nd → X-Cache-Status: HIT
curl -s https://trip-track.app/api/globe | head -c 200   # bare JSON {stats,trips}
```
Expected: MISS then HIT; valid JSON body.

- [ ] **Step 4: Browser smoke test (production)**
  - Globe loads, spins, drags; routes glow/flow; clicking a route opens the anonymous card; CTA → App Store.
  - Stat chip shows live counts.
  - DevTools console: no CSP violations (textures `img-src 'self'`, fetch `connect-src 'self'`).
  - Toggle OS "reduce motion" → static CSS-sphere fallback, no auto-rotate.
  - Mobile: drag rotates, page still scrolls (zoom disabled), no jank.
  - Lighthouse: LCP not regressed (globe is lazy; headline/CTA paint immediately).

- [ ] **Step 5: Final confirmation** — privacy check: pick a real (non-mock) public trip if any exist and confirm its plotted route does NOT start/end at a precise address (endpoints clipped + rounded). If only mock data exists, note that the anonymization unit tests (Task 2) are the guarantee until real public trips appear.

---

## Self-Review (completed by author)

- **Spec coverage:** concept/UX → Task 14; realistic globe + perf → Task 12/16; routes+anonymization → Tasks 1–4; data delivery (nginx proxy+cache) → Task 20; anonymous card → Task 13; privacy transform → Task 2 (+ tested); seed → Task 6; i18n → Task 15; fallbacks/a11y → Tasks 12/14; texture → Task 8; testing → Tasks 1/2/4/10/11/14; Home integration → Tasks 17/18. All spec sections mapped.
- **Placeholder scan:** no TBD/TODO; all code complete; line anchors flagged "confirm before editing" (existing-file surgery).
- **Type consistency:** `GlobeTrip`/`GlobeData` identical in backend DTO (`PublicMapTrip`/`PublicMapResponse`) and frontend `types.ts`; `coords: [number,number][]` lat,lng everywhere; `decodePreviewPolyline`/`anonymizeRoute`/`avatarStyle`/`useGlobeData` names consistent across tasks; endpoint `/api/globe` (web) → `/public/map` (backend) consistent in hook + nginx + controller.
- **Known risk:** react-globe.gl accessor TS types — accessors use `any`; Task 12 build step adjusts casts if the lib's exact types reject them (behavior unchanged).
