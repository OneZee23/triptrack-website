import { describe, it, expect } from 'vitest';
import { avatarStyle } from './anonAvatar';

describe('avatarStyle', () => {
  it('is deterministic for the same id', () => {
    expect(avatarStyle('trip-1')).toEqual(avatarStyle('trip-1'));
  });
  it('differs for different ids', () => {
    expect(avatarStyle('trip-1')).not.toEqual(avatarStyle('trip-2'));
  });
  it('returns hsl strings', () => {
    const s = avatarStyle('x');
    expect(s.from).toMatch(/^hsl\(/);
    expect(s.to).toMatch(/^hsl\(/);
  });
});
