import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Apple, Lock } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { login } from './api';
import { codeOf, errorKey } from './errors';
import { isCancelled, loadAppleSdk, randomNonce, sha256Hex } from './appleSdk';
import { useAuth } from './useAuth';
import { ErrorNote } from './ui';

/** The Services ID registered in the Apple Developer portal — a different
 *  identifier from the iOS bundle id, and one the backend has to list in
 *  `APPLE_BUNDLE_ID` (it accepts a comma-separated list already). */
const CLIENT_ID = String(import.meta.env.VITE_APPLE_SERVICES_ID ?? 'app.trip-track.web');

export default function LoginPage() {
  const { t, href } = useTranslation();
  const { signedIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setErrorText(null);
    try {
      const auth = await loadAppleSdk();
      const nonce = randomNonce();
      auth.init({
        clientId: CLIENT_ID,
        scope: 'name email',
        // Must match the Return URL on the Services ID exactly.
        redirectURI: `${window.location.origin}/app/login`,
        usePopup: true,
        // Apple gets the HASH, the backend gets the raw value below.
        nonce: await sha256Hex(nonce),
      });
      const response = await auth.signIn();
      const session = await login(response.authorization.id_token, nonce);
      signedIn(session);
      navigate(href('/app/trips'), { replace: true });
    } catch (error: unknown) {
      if (isCancelled(error)) {
        setBusy(false);
        return;
      }
      if (error instanceof Error && error.message === 'APPLE_SDK') {
        setErrorText(t('app.error.apple_sdk'));
      } else {
        setErrorText(t(errorKey(codeOf(error) ?? 'INVALID_APPLE_TOKEN')));
      }
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#f4f2ee] flex items-center justify-center mb-8">
        <Lock className="w-6 h-6 text-[#EB571E]" aria-hidden="true" />
      </div>

      <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight text-[#1e1e23] mb-4">
        {t('app.login.title')}
      </h1>
      <p className="text-[17px] text-[#1e1e23]/65 leading-relaxed mb-10">
        {t('app.login.lead')}
      </p>

      <button
        type="button"
        onClick={() => { void signIn(); }}
        disabled={busy}
        className="w-full sm:w-auto bg-black text-white rounded-full px-8 py-4 font-semibold text-[17px] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        <Apple className="w-5 h-5" aria-hidden="true" />
        {busy ? t('app.login.busy') : t('app.login.button')}
      </button>

      <p className="text-[14px] text-[#1e1e23]/65 leading-relaxed mt-8 max-w-md">
        {t('app.login.note')}
      </p>

      {errorText && (
        <div className="mt-8 w-full text-left">
          <ErrorNote message={errorText} onRetry={() => { void signIn(); }} retryLabel={t('app.retry')} />
        </div>
      )}
    </div>
  );
}
