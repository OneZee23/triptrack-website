import { describe, expect, it } from 'vitest';
import { buildRoutes } from './routeFeatures';

describe('MapGlobe routes', () => {
  it('keeps each visible run separate in one selectable trip feature', () => {
    const routes = buildRoutes([{
      id: 'split', region: null, coords: [[1, 2], [3, 4]],
      routeSegments: [[[10, 20], [11, 21]], [[30, 40], [31, 41]]],
    }]);

    expect(routes.features).toHaveLength(1);
    expect(routes.features[0].properties.id).toBe('split');
    expect(routes.features[0].geometry).toEqual({
      type: 'MultiLineString',
      coordinates: [[[20, 10], [21, 11]], [[40, 30], [41, 31]]],
    });
  });
});
