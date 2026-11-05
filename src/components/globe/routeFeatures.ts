import type { Feature, FeatureCollection, MultiLineString } from 'geojson';
import { tripSegments, type GlobeTrip } from './types';

export function buildRoutes(trips: GlobeTrip[]): FeatureCollection<MultiLineString, { id: string }> {
  const features: Feature<MultiLineString, { id: string }>[] = trips
    .flatMap((trip) => {
      const segments = tripSegments(trip);
      if (!segments.length) return [];
      return [{
        type: 'Feature',
        properties: { id: trip.id },
        geometry: { type: 'MultiLineString', coordinates: segments.map((segment) => segment.map(([lat, lng]) => [lng, lat])) },
      }];
    });
  return { type: 'FeatureCollection', features };
}
