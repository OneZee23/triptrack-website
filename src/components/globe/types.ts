export interface GlobeTrip {
  id: string;
  region: string | null;
  coords: [number, number][]; // anonymized [lat, lng]
}

export interface GlobeData {
  stats: { trips: number; cities: number };
  trips: GlobeTrip[];
}
