import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { LogOut } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { routeFromPath } from '../lib/site';
import { usePageMeta } from '../components/PageMeta';
import { AuthProvider } from './auth';
import { useAuth } from './useAuth';
import { getSession } from './api';
import { resumeAnalytics, suppressAnalytics } from './analytics';
import { useNoIndex } from './meta';

/** Everything under `/app`. The provider is here rather than in `main.tsx`
 *  so the marketing side of the site carries none of this code — the whole
 *  section arrives in one lazy chunk. */
export default function AppShell() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { t, lang, href } = useTranslation();
  const { session, signOut } = useAuth();
  const { pathname } = useLocation();

  // One table for every page's title and description, `/app` included
  // (`PAGE_META.app`, `noindex` and out of the sitemap — see lib/meta.ts).
  usePageMeta('app');
  useNoIndex();

  useEffect(() => {
    suppressAnalytics();
    return () => {
      // Someone who only looked at the sign-in page and left gets their
      // analytics back; someone with a session stays untracked while they
      // have one, which is what protects a direct landing on a trip URL.
      if (!getSession()) resumeAnalytics();
    };
  }, []);

  // The section is mounted under both language roots, so every comparison is
  // made on the English spelling (`/ru/app/login` → `/app/login`) and every
  // redirect is written back through `href` — otherwise a Russian reader gets
  // bounced into the English site by his own sign-in.
  const route = routeFromPath(pathname);
  const onLoginPage = route === '/app/login';
  if (!session && !onLoginPage) return <Navigate to={href('/app/login')} replace />;
  if (session && onLoginPage) return <Navigate to={href('/app/trips')} replace />;
  // `/app` itself is just a door.
  if (route === '/app') return <Navigate to={href(session ? '/app/trips' : '/app/login')} replace />;

  return (
    <div className="flex-1 w-full pt-20 md:pt-32 pb-14 md:pb-20 px-6">
      <div className="max-w-5xl mx-auto w-full">
        {session && (
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center text-[20px] shrink-0" aria-hidden="true">
                {session.account.avatarEmoji || '🚗'}
              </span>
              <span className="font-bold text-[#1e1e23] truncate">
                {session.account.displayName ?? t('app.account.no_name')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="flex items-center gap-2 text-[14px] font-semibold text-[#1e1e23]/65 hover:text-[#1e1e23] transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {t('app.sign_out')}
            </button>
          </div>
        )}

        <Outlet />

        <p className="mt-12 text-[13px] text-[#1e1e23]/65 text-center" lang={lang}>
          {t('app.units_note')}
        </p>
      </div>
    </div>
  );
}
