import { afterEach, describe, expect, it, vi } from 'vitest';
import { authedPost } from './api';
import { listVehicles, routingCapabilities } from './manualApi';

vi.mock('./api', () => ({ authedPost: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe('manual trip vehicle choices', () => {
  it('excludes sold, archived and deleted vehicles while keeping active vehicles', async () => {
    const active = { id: 'active', name: 'Car', avatarEmoji: '🚗', isArchived: false, soldAt: null };
    const legacy = { id: 'legacy', name: 'Old response', avatarEmoji: '🚗' };
    vi.mocked(authedPost).mockResolvedValue({ vehicles: [
      active, legacy,
      { ...active, id: 'archived', isArchived: true },
      { ...active, id: 'sold', soldAt: '2026-01-01T00:00:00Z' },
      { ...active, id: 'deleted', isDeleted: true },
    ] });
    expect(await listVehicles()).toEqual({ vehicles: [active, legacy] });
    expect(authedPost).toHaveBeenCalledWith('/vehicles/list', {});
  });
});

describe('manual trip rollout capabilities', () => {
  it.each([
    null,
    {},
    { search: true, routing: true },
    { manualTrips: false, search: true, routing: true },
    { manualTrips: 'true', search: true, routing: true },
  ])('keeps the editor closed without an explicit boolean enablement: %j', async (payload) => {
    vi.mocked(authedPost).mockResolvedValue(payload);
    expect(await routingCapabilities()).toEqual({ manualTrips: false, search: false, routing: false });
  });

  it('preserves enabled manual trips independently of a routing provider', async () => {
    vi.mocked(authedPost).mockResolvedValue({ manualTrips: true, search: false, routing: false });
    expect(await routingCapabilities()).toEqual({ manualTrips: true, search: false, routing: false });
    expect(authedPost).toHaveBeenCalledWith('/web-routing/capabilities', {});
  });
});
