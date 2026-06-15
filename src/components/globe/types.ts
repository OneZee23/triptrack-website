export interface GlobeTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
  title?: string | null; // e.g. "Rostov-on-Don → Krasnodar"
  distanceKm?: number | null;
  date?: string | null; // ISO start date
}

export interface GlobeData {
  stats: { trips: number; cities: number };
  trips: GlobeTrip[];
}
