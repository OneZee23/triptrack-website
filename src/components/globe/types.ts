export interface GlobeTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
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

export interface GlobeData {
  stats: { trips: number; cities: number };
  trips: GlobeTrip[];
}
