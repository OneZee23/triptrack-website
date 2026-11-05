export interface GlobeTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
  routeSegments?: [number, number][][];
  title?: string | null; // e.g. "Rostov-on-Don → Krasnodar"
  distanceKm?: number | null;
  date?: string | null; // ISO start date
  durationSec?: number | null; // total trip duration in seconds
  avgSpeedKmh?: number | null; // moving average speed
  maxSpeedKmh?: number | null; // top speed
  maxAltitudeM?: number | null; // peak altitude
  photoCount?: number | null;
  traveler?: string | null; // author display name
  avatarEmoji?: string | null;
  level?: number | null; // author profile level
}

export function tripSegments(trip: GlobeTrip): [number, number][][] {
  const validRuns = trip.routeSegments?.filter((run) => run.length >= 2
    && run.every(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180));
  if (validRuns?.length) return validRuns;
  return trip.coords.length >= 2
    && trip.coords.every(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
    ? [trip.coords] : [];
}

export interface GlobeData {
  stats: { trips: number; cities: number };
  trips: GlobeTrip[];
}
