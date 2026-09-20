import { useState, Suspense, useMemo, lazy } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Globe, Apple, Menu, X } from 'lucide-react';
import { LanguageProvider } from '../i18n/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { useMounted } from '../lib/useMounted';
import { routeFromPath } from '../lib/site';
import { CursorContext } from './CursorContext';
import logo from '../assets/avatar.png';

// `motion` is a sizeable dependency and the cursor is a decorative desktop
// flourish — lazy-loading it keeps `motion` out of the entry chunk that every
// route pays for.
const CustomCursor = lazy(() => import('./CustomCursor'));

/**
 * The chrome around every page.
 *
 * `LanguageProvider` is mounted HERE rather than above the router because it
 * reads the language off the pathname — it needs router context, and putting
 * it inside the layout means the shell and the page can never be rendered in
 * different languages.
 */
export default function AppLayout() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}

const NAV = [
  { path: '/', key: 'nav.home' },
  { path: '/features', key: 'nav.features' },
  { path: '/about', key: 'nav.about' },
  { path: '/roadmap', key: 'nav.roadmap' },
];

function Shell() {
  const [hoverState, setHoverState] = useState<{ text: string; active: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang, href } = useTranslation();
  // The cursor is mouse-only decoration and `motion` is 40 kB: it has no place
  // in prerendered HTML, and gating it on mount keeps the first client render
  // identical to the markup it hydrates.
  const mounted = useMounted();

  // Close the mobile menu when the route changes. Adjusted during render (not
  // an effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // avoids the extra commit a setState-in-effect would cause.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  const here = routeFromPath(location.pathname);
  const toggleLang = () => setLang(lang === 'en' ? 'ru' : 'en');
  const hover = (text: string) => ({
    onMouseEnter: () => setHoverState({ text, active: true }),
    onMouseLeave: () => setHoverState(null),
  });

  return (
    <CursorContext.Provider value={useMemo(() => ({ setHoverState }), [setHoverState])}>
      <div className="min-h-screen bg-[#f8f6f2] text-[#1e1e23] font-sans selection:bg-[#EB571E]/20 flex flex-col relative overflow-x-hidden">

        {/* Header — light glass */}
        <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-black/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 h-20 flex items-center justify-between gap-3">
            <Link to={href('/')} className="flex min-h-[44px] items-center gap-3 group shrink-0" onClick={() => setHoverState(null)} {...hover(t('nav.home'))}>
              <img src={logo} alt="" width={40} height={40} className="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(235,87,30,0.2)] group-hover:scale-105 transition-transform" />
              <div>
                {/* Deliberately not an <h1>: the one heading of a page belongs
                    to the page, and a logo in every header would give each of
                    them two. */}
                <span className="block text-xl font-bold tracking-tight text-[#1e1e23]">TripTrack</span>
                <span className="block text-[10px] text-[#1e1e23]/40 tracking-widest uppercase">Drive Diary</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  to={href(item.path)}
                  className={`flex min-h-[44px] items-center text-[15px] font-medium transition-colors ${here === item.path ? 'text-[#1e1e23]' : 'text-[#1e1e23]/50 hover:text-[#1e1e23]'}`}
                  {...hover(t(item.key))}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 md:gap-4">
              <button
                onClick={toggleLang}
                className="flex h-[44px] items-center gap-1.5 px-3 text-[13px] font-semibold text-[#1e1e23]/50 hover:text-[#1e1e23] transition-colors"
                {...hover(t('nav.switch_lang'))}
                aria-label={t('nav.switch_lang')}
              >
                <Globe className="w-4 h-4" />
                {lang.toUpperCase()}
              </button>
              <Link
                to={href('/download')}
                className="hidden md:flex bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full h-[44px] px-5 text-[15px] font-bold items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_12px_rgba(235,87,30,0.3)]"
                {...hover('App Store')}
              >
                <Apple className="w-4 h-4" />
                {t('nav.download_free')}
              </Link>
              <button
                className="md:hidden w-[44px] h-[44px] flex items-center justify-center text-[#1e1e23]/50 hover:text-[#1e1e23] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-black/5 px-5 py-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  to={href(item.path)}
                  className={`flex min-h-[44px] items-center text-[17px] font-medium ${here === item.path ? 'text-[#1e1e23]' : 'text-[#1e1e23]/50'}`}
                >
                  {t(item.key)}
                </Link>
              ))}
              <Link to={href('/download')} className="bg-[#EB571E] text-white rounded-full min-h-[44px] px-6 text-center font-bold flex items-center justify-center gap-2 mt-3">
                <Apple className="w-5 h-5" />
                {t('nav.download_free')}
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col w-full">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>

        {/* Footer — warm light */}
        <footer className="w-full border-t border-black/5 bg-[#f4f2ee] py-12 px-5 sm:px-6 flex flex-col md:flex-row items-center justify-between text-[#1e1e23]/50 text-[15px] gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-[#1e1e23]/70">TripTrack</span>
            <span className="ml-2">&copy; 2026 OneZee</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-7 gap-y-1 font-medium">
            <Link to={href('/privacy')} className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.privacy')}</Link>
            <Link to={`${href('/privacy')}#cookies`} className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.cookies')}</Link>
            <a href="https://github.com/OneZee23/trip-track-ios" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.github')}</a>
            <a href="https://t.me/triptrack_app" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.telegram')}</a>
            <a href="https://www.youtube.com/@onezee_dev" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.youtube')}</a>
            <a href="mailto:nikitona123@gmail.com" className="flex min-h-[44px] items-center hover:text-[#1e1e23] transition-colors">{t('footer.email')}</a>
          </div>
          <div className="font-medium text-center">{t('footer.made_with')}</div>
        </footer>

        {/* Custom cursor */}
        {mounted && (
          <Suspense fallback={null}>
            <CustomCursor hoverState={hoverState} />
          </Suspense>
        )}
      </div>
    </CursorContext.Provider>
  );
}
