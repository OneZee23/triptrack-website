import { describe, it, expect } from 'vitest';
import { isCancelled, randomNonce, sha256Hex } from './appleSdk';

describe('sha256Hex', () => {
  it('matches the server digest format (lowercase hex)', async () => {
    // The canonical NIST vector; `createHash('sha256').update('abc')
    // .digest('hex')` in AppleAuthService produces exactly this string.
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashes the nonce we would actually send', async () => {
    const raw = randomNonce();
    const hashed = await sha256Hex(raw);
    expect(raw).toMatch(/^[0-9a-f]{32}$/);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    // Apple gets the hash, the backend gets the raw value — never the same
    // string, which is the whole point of the binding.
    expect(hashed).not.toBe(raw);
  });

  it('gives a different nonce every time', () => {
    expect(randomNonce()).not.toBe(randomNonce());
  });
});

describe('isCancelled', () => {
  it('recognises a closed popup as a change of mind', () => {
    expect(isCancelled({ error: 'popup_closed_by_user' })).toBe(true);
    expect(isCancelled({ error: 'user_cancelled_authorize' })).toBe(true);
  });

  it('does not swallow real failures', () => {
    expect(isCancelled({ error: 'invalid_client' })).toBe(false);
    expect(isCancelled(new Error('APPLE_SDK'))).toBe(false);
    expect(isCancelled(null)).toBe(false);
  });
});
