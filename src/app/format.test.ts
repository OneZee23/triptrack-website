import { describe, it, expect } from 'vitest';
import { formatDistance, formatDuration, formatSpeed, formatDate, tripDurationSeconds } from './format';

describe('formatDistance', () => {
  it('prints metres as kilometres with one decimal', () => {
    expect(formatDistance(12_432, 'en')).toBe('12.4 km');
    expect(formatDistance(12_432, 'ru')).toBe('12.4 км');
  });

  it('keeps the decimal separator a dot in Russian too', () => {
    expect(formatDistance(1_500, 'ru')).not.toContain(',');
  });

  it('survives missing numbers', () => {
    expect(formatDistance(null, 'en')).toBe('—');
    expect(formatDistance(undefined, 'ru')).toBe('—');
    expect(formatDistance(Number.NaN, 'en')).toBe('—');
  });
});

describe('formatDuration', () => {
  it('splits hours and minutes', () => {
    expect(formatDuration(8_075, 'en')).toBe('2 h 14 min');
    expect(formatDuration(8_075, 'ru')).toBe('2 ч 14 мин');
  });

  it('drops the hour when there is none', () => {
    expect(formatDuration(2_820, 'en')).toBe('47 min');
    expect(formatDuration(0, 'ru')).toBe('0 мин');
  });

  it('rejects nonsense', () => {
    expect(formatDuration(null, 'en')).toBe('—');
    expect(formatDuration(-5, 'en')).toBe('—');
  });
});

describe('formatSpeed', () => {
  it('converts metres per second to km/h', () => {
    expect(formatSpeed(23.4, 'en')).toBe('84 km/h');
    expect(formatSpeed(0, 'ru')).toBe('0 км/ч');
    expect(formatSpeed(null, 'ru')).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats by language and refuses broken input', () => {
    expect(formatDate('2026-09-20T10:00:00.000Z', 'en')).toContain('2026');
    expect(formatDate('not a date', 'en')).toBe('—');
    expect(formatDate(null, 'ru')).toBe('—');
  });
});

describe('tripDurationSeconds', () => {
  it('prefers the moving time the app computed', () => {
    expect(tripDurationSeconds({
      startDate: '2026-09-20T10:00:00.000Z',
      endDate: '2026-09-20T12:00:00.000Z',
      drivingTime: 5_400,
    })).toBe(5_400);
  });

  it('falls back to the wall clock for rows without one', () => {
    expect(tripDurationSeconds({
      startDate: '2026-09-20T10:00:00.000Z',
      endDate: '2026-09-20T12:00:00.000Z',
      drivingTime: null,
    })).toBe(7_200);
  });

  it('gives up on an unfinished trip', () => {
    expect(tripDurationSeconds({
      startDate: '2026-09-20T10:00:00.000Z',
      endDate: null,
      drivingTime: null,
    })).toBeNull();
  });
});
