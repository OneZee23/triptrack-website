// Apple's Sign in with Apple JS, loaded on the sign-in page and nowhere
// else. It is the only third-party script the `/app` section pulls in —
// see docs/web-app-security.md.

export interface AppleAuthorization {
  id_token: string;
  code: string;
  state?: string;
}

export interface AppleSignInResponse {
  authorization: AppleAuthorization;
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
}

interface AppleIdAuth {
  init(config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    usePopup: boolean;
    nonce?: string;
    state?: string;
  }): void;
  signIn(): Promise<AppleSignInResponse>;
}

declare global {
  interface Window {
    AppleID?: { auth: AppleIdAuth };
  }
}

const SDK_URL = 'https://appleid.cdn-apple.com/appleid/auth/js/appleid.auth.js';

let pending: Promise<AppleIdAuth> | null = null;

/** Injects the SDK once per page load and resolves when `AppleID` exists.
 *  A blocked or failed script rejects, so the page can say "sign-in didn't
 *  load" instead of leaving a dead button. */
export function loadAppleSdk(): Promise<AppleIdAuth> {
  if (window.AppleID?.auth) return Promise.resolve(window.AppleID.auth);
  if (pending) return pending;

  pending = new Promise<AppleIdAuth>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.AppleID?.auth) resolve(window.AppleID.auth);
      else reject(new Error('APPLE_SDK'));
    };
    script.onerror = () => reject(new Error('APPLE_SDK'));
    document.head.appendChild(script);
  }).catch((e: unknown) => {
    // Let a later attempt re-add the tag (the first failure is usually a
    // flaky network or a blocker the person can turn off and retry).
    pending = null;
    throw e;
  });

  return pending;
}

/** Random, per-attempt, and never reused. This is the RAW nonce — the one
 *  that goes to `POST /auth/login`. */
export function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 as lowercase hex — the form `AppleAuthService` compares against
 *  the token's `nonce` claim (`createHash('sha256')…digest('hex')`).
 *
 *  The WEB flow hashes here, on our side: unlike the native iOS flow there
 *  is no library doing it for us, and Apple copies the string we give it
 *  into the claim verbatim. So: hash → Apple, raw → our backend. Backwards
 *  and every sign-in dies with "nonce claim mismatch".
 *
 *  `crypto.subtle` exists only in a secure context, which is the same
 *  condition Sign in with Apple imposes on the page anyway (https). */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Apple reports a closed popup as `{ error: 'popup_closed_by_user' }` —
 *  a person changing their mind, not a failure worth a red box. */
export function isCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { error?: unknown }).error;
  return code === 'popup_closed_by_user' || code === 'user_cancelled_authorize';
}
