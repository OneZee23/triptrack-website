import { describe, expect, it } from 'vitest';
import type { Coordinate } from './manualApi';
import { localDateTime, manualValidation, parseCoordinate, routeDistance } from './manualTrip';

const now = Date.parse('2026-10-02T12:00:00Z');
const coordinates: Coordinate[] = [[45, 39], [45, 39.01]];
const draft = { title: 'Coast road', start: '2026-10-01T12:00:00Z', minutes: 60, coordinates };

describe('manual trip input', () => {
  it('keeps explicit coordinates latitude first', () => {
    expect(parseCoordinate('45.04, 138.97')).toEqual([45.04, 138.97]);
    expect(parseCoordinate(' -45.04 ; -138.97 ')).toEqual([-45.04, -138.97]);
    expect(parseCoordinate('138.97, 45.04')).toBeNull();
    expect(parseCoordinate('45.04, 181')).toBeNull();
    expect(parseCoordinate('NaN, 39')).toBeNull();
    expect(parseCoordinate('45, 39, 1')).toBeNull();
  });

  it('calculates metres using the same earth radius as the server', () => {
    expect(routeDistance(coordinates)).toBeCloseTo(786.267, 2);
    expect(routeDistance([])).toBe(0);
    expect(routeDistance([[45, 39], [NaN, 39]])).toBe(0);
  });

  it('accepts a completed, plausible trip', () => {
    expect(manualValidation(draft, now)).toBeNull();
  });

  it.each([
    [{ title: '  ' }, 'title_error'],
    [{ title: 'a'.repeat(201) }, 'title_error'],
    [{ coordinates: [[45, 39]] }, 'route_error'],
    [{ coordinates: [[45, 39], [45, 39]] }, 'route_error'],
    [{ coordinates: [[45, 39], [91, 39]] }, 'route_error'],
    [{ start: 'not-a-date' }, 'date_error'],
    [{ start: '2000-01-01T12:00:00Z' }, 'date_error'],
    [{ start: '2026-10-03T12:00:00Z' }, 'date_error'],
    [{ start: '2026-10-02T11:59:00Z' }, 'end_error'],
    [{ minutes: 0 }, 'duration_error'],
    [{ minutes: 10081 }, 'duration_error'],
    [{ minutes: NaN }, 'duration_error'],
    [{ coordinates: [[45, 39], [46, 39]], minutes: 1 }, 'speed_error'],
  ])('rejects invalid input case %#', (overrides, expected) => {
    expect(manualValidation({ ...draft, ...overrides } as typeof draft, now)).toBe(expected);
  });

  it('formats a datetime-local field without applying UTC twice', () => {
    const date = new Date(2026, 9, 1, 18, 35);
    expect(localDateTime(date)).toBe('2026-10-01T18:35');
  });
});
