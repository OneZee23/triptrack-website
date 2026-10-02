import MailLink from './MailLink';
import { useState, useEffect, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Globe, Apple, Menu, X } from 'lucide-react';
import { LanguageProvider } from '../i18n/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { routeFromPath } from '../lib/site';
import { trackPageView } from '../lib/analytics';
import logo from '../assets/avatar.png';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang, href } = useTranslation();
  // Close the mobile menu when the route changes. Adjusted during render (not
  // an effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // avoids the extra commit a setState-in-effect would cause.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  // Просмотры страниц шлёт приложение, а не тег: у тега автотрек выключен,
  // иначе `/app/trips/<uuid>` уезжал бы в аналитику идентификатором личной
  // поездки (см. index.html и lib/analytics.ts). `trackPageView` сама молчит
  // на всём, что под `/app`, поэтому здесь нет второй проверки — второй
  // проверке свойственно разойтись с первой.
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const here = routeFromPath(location.pathname);
  const inApp = here === '/app' || here.startsWith('/app/');
  const toggleLang = () => setLang(lang === 'en' ? 'ru' : 'en');
  return (
      <div className={`${inApp ? 'private-app ' : ''}min-h-screen bg-[#f8f6f2] text-[#1e1e23] font-sans selection:bg-[#EB571E]/20 flex flex-col relative overflow-x-hidden`}>

        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-5 focus:py-3 focus:shadow-lg">
          {lang === 'ru' ? 'К содержимому' : 'Skip to content'}
        </a>
        {/* Header — light glass */}
        <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-black/5 pt-[env(safe-area-inset-top,0px)] px-[env(safe-area-inset-left,0px)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 h-20 flex items-center justify-between gap-3">
            <Link to={href('/')} className="flex min-h-[44px] items-center gap-3 group shrink-0">
              <img src={logo} alt="" width={40} height={40} decoding="async" className="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(235,87,30,0.2)] group-hover:scale-105 transition-transform" />
              <div>
                {/* Deliberately not an <h1>: the one heading of a page belongs
                    to the page, and a logo in every header would give each of
                    them two. */}
                <span className="block text-xl font-bold tracking-tight text-[#1e1e23]">TripTrack</span>
                <span className="block text-[10px] text-[#1e1e23]/65 tracking-widest uppercase">Drive Diary</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  to={href(item.path)}
                  aria-current={here === item.path ? 'page' : undefined}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center text-[15px] font-medium transition-colors ${here === item.path ? 'text-[#1e1e23]' : 'text-[#1e1e23]/65 hover:text-[#1e1e23]'}`}
                >
                  {t(item.key)}
                </Link>
              ))}
              <Link
                to={href('/app')}
                aria-current={inApp ? 'page' : undefined}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center text-[15px] font-medium transition-colors ${here.startsWith('/app') ? 'text-[#1e1e23]' : 'text-[#1e1e23]/65 hover:text-[#1e1e23]'}`}
              >
                {t('app.nav.link')}
              </Link>
            </nav>

            <div className="flex items-center gap-1 lg:gap-4">
              <button
                onClick={toggleLang}
                className="flex h-[44px] items-center gap-1.5 px-3 text-[13px] font-semibold text-[#1e1e23]/65 hover:text-[#1e1e23] transition-colors"
                aria-label={t('nav.switch_lang')}
              >
                <Globe className="w-4 h-4" />
                {lang.toUpperCase()}
              </button>
              <Link
                to={href('/download')}
                className="hidden lg:flex bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full h-[44px] px-5 text-[15px] font-bold items-center gap-2 transition-[background-color,transform] hover:scale-105 active:scale-[0.96] shadow-[0_2px_12px_rgba(235,87,30,0.3)]"
              >
                <Apple className="w-4 h-4" />
                {t('nav.download_free')}
              </Link>
              <button
                className="lg:hidden w-[44px] h-[44px] flex items-center justify-center text-[#1e1e23]/65 hover:text-[#1e1e23] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={lang === 'ru' ? (mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div id="mobile-navigation" className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-black/5 px-5 py-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  to={href(item.path)}
                  aria-current={here === item.path ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center text-[17px] font-medium ${here === item.path ? 'text-[#1e1e23]' : 'text-[#1e1e23]/65'}`}
                >
                  {t(item.key)}
                </Link>
              ))}
              <Link
                to={href('/app')}
                aria-current={inApp ? 'page' : undefined}
                className={`flex min-h-[44px] items-center text-[17px] font-medium ${here.startsWith('/app') ? 'text-[#1e1e23]' : 'text-[#1e1e23]/65'}`}
              >
                {t('app.nav.link')}
              </Link>
              <Link to={href('/download')} className="bg-[#EB571E] text-white rounded-full min-h-[44px] px-6 text-center font-bold flex items-center justify-center gap-2 mt-3">
                <Apple className="w-5 h-5" />
                {t('nav.download_free')}
              </Link>
            </div>
          )}
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col w-full pt-[env(safe-area-inset-top,0px)]">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>

        {/* Footer — warm light */}
        {!inApp && <footer className="w-full border-t border-black/5 bg-[#f4f2ee] py-12 px-5 sm:px-6 flex flex-col md:flex-row items-center justify-between text-[#1e1e23]/65 text-[15px] gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-[#1e1e23]/70">TripTrack</span>
            <span className="ml-2">&copy; 2026 OneZee</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-7 gap-y-1 font-medium">
            <Link to={href('/privacy')} className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors">{t('footer.privacy')}</Link>
            <Link to={`${href('/privacy')}#cookies`} className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors">{t('footer.cookies')}</Link>
            <a href="https://github.com/OneZee23/trip-track-ios" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors">{t('footer.github')}</a>
            <a href="https://t.me/triptrack_app" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors">{t('footer.telegram')}</a>
            <a href="https://www.youtube.com/@onezee_dev" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors">{t('footer.youtube')}</a>
            <MailLink email="nikitona123@gmail.com" label={t('footer.email')} className="flex min-h-[44px] min-w-[44px] items-center justify-center hover:text-[#1e1e23] transition-colors" />
          </div>
          <div className="font-medium text-center">{t('footer.made_with')}</div>
        </footer>}

      </div>
  );
}
