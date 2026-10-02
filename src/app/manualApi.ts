import { authedPost } from './api';

/** Coordinate order matches iOS and our API, not GeoJSON. */
export type Coordinate = [latitude: number, longitude: number];
export interface ProStatus { active: boolean; until: string | null; productId: string | null; isTrial: boolean }
export interface Vehicle {
  id: string;
  name: string;
  avatarEmoji: string;
  isArchived?: boolean;
  soldAt?: string | null;
  isDeleted?: boolean;
}
export interface Place { name: string; latitude: number; longitude: number }
export interface RouteResult { coordinates: Coordinate[]; distance: number; durationSeconds: number }
export interface RoutingCapabilities { manualTrips: boolean; search: boolean; routing: boolean }
export interface ManualTripInput {
  id: string;
  title: string;
  startDate: string;
  durationSeconds: number;
  vehicleId?: string;
  coordinates: Coordinate[];
}

export const proStatus = () => authedPost<ProStatus>('/plus/status', {});
export const listVehicles = async () => {
  const result = await authedPost<{ vehicles: Vehicle[] }>('/vehicles/list', {});
  return { vehicles: result.vehicles.filter((vehicle) => !vehicle.isDeleted && !vehicle.isArchived && !vehicle.soldAt) };
};
export const routingCapabilities = async (): Promise<RoutingCapabilities> => {
  const result = await authedPost<Partial<RoutingCapabilities> | null>('/web-routing/capabilities', {});
  // An older API or an incomplete rollout must never expose the editor.
  const manualTrips = result?.manualTrips === true;
  return { manualTrips, search: manualTrips && result?.search === true, routing: manualTrips && result?.routing === true };
};
export const searchPlaces = (query: string, language: 'ru' | 'en') =>
  authedPost<{ places: Place[] }>('/web-routing/search', { query, language });
export const buildRoadRoute = (waypoints: Coordinate[]) =>
  authedPost<RouteResult>('/web-routing/route', { waypoints });
export const createManualTrip = (input: ManualTripInput) =>
  authedPost<{ id: string; conflictVersion: number; serverCreatedAt: string }>('/trips/manual/create', input);
